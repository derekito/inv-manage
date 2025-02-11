import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { updateProduct, getProductBySku } from '@/lib/db';
import { syncProductWithBothStores } from '@/lib/shopify';

// Verify Shopify webhook
function verifyShopifyWebhook(req: NextApiRequest): boolean {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const topic = req.headers['x-shopify-topic'] as string;
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const rawBody = JSON.stringify(req.body);

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || '')
    .update(rawBody, 'utf8')
    .digest('base64');

  return hmac === hash;
}

export const config = {
  api: {
    bodyParser: {
      raw: true,
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify webhook authenticity
    if (!verifyShopifyWebhook(req)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    // Parse webhook body
    const body = JSON.parse(req.body.toString());
    const topic = req.headers['x-shopify-topic'] as string;
    const shop = req.headers['x-shopify-shop-domain'] as string;

    console.log('Received webhook:', {
      topic,
      shop,
      body
    });

    // Handle inventory_items/update webhook
    if (topic === 'inventory_items/update') {
      const { id: inventoryItemId, sku, available } = body;
      
      if (!sku) {
        console.error('No SKU provided in webhook');
        return res.status(400).json({ message: 'No SKU provided' });
      }

      // Get product from our database
      const product = await getProductBySku(sku);
      
      if (!product) {
        console.error(`Product not found with SKU: ${sku}`);
        return res.status(404).json({ message: 'Product not found' });
      }

      // Update our master inventory
      const updatedProduct = {
        ...product,
        onHand: available,
        lastUpdated: new Date()
      };

      await updateProduct(product.id, updatedProduct);

      // Sync the updated inventory with both stores
      const syncResults = await syncProductWithBothStores(updatedProduct);

      console.log('Sync results:', syncResults);

      return res.status(200).json({
        message: 'Inventory updated successfully',
        results: syncResults
      });
    }

    // Handle inventory_levels/update webhook
    if (topic === 'inventory_levels/update') {
      const { inventory_item_id, location_id, available } = body;
      
      // Log the inventory level update
      console.log('Inventory level update:', {
        inventory_item_id,
        location_id,
        available
      });

      // You might want to look up the product by inventory_item_id
      // This would require maintaining a mapping of inventory_item_ids to SKUs
      
      return res.status(200).json({ message: 'Inventory level update received' });
    }

    // Handle other webhook topics as needed
    console.log('Unhandled webhook topic:', topic);
    return res.status(200).json({ message: 'Webhook received' });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 