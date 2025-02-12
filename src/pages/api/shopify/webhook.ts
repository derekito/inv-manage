import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { updateProduct, getProductBySku } from '@/lib/db';
import { syncProductWithBothStores } from '@/lib/shopify';

// Verify Shopify webhook
function verifyShopifyWebhook(req: NextApiRequest, secret: string) {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const body = req.body;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('base64');
  
  return hmac === hash;
}

// Get store config based on shop domain
function getStoreConfig(shopDomain: string) {
  if (shopDomain === process.env.SHOPIFY_STORE_ONE_URL) {
    return {
      name: 'naked-armor',
      secret: process.env.SHOPIFY_STORE_ONE_WEBHOOK_SECRET
    };
  }
  if (shopDomain === process.env.SHOPIFY_STORE_TWO_URL) {
    return {
      name: 'grown-man-shave',
      secret: process.env.SHOPIFY_STORE_TWO_WEBHOOK_SECRET
    };
  }
  return null;
}

export const config = {
  api: {
    bodyParser: {
      raw: true,
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    const storeConfig = getStoreConfig(shopDomain);

    if (!storeConfig || !storeConfig.secret) {
      console.error('Invalid shop domain or missing webhook secret');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Verify webhook authenticity
    if (!verifyShopifyWebhook(req, storeConfig.secret)) {
      console.error('Invalid webhook signature');
      return res.status(403).json({ message: 'Invalid signature' });
    }

    const order = req.body;
    console.log('Received order webhook:', {
      store: storeConfig.name,
      orderId: order.id,
      orderNumber: order.order_number
    });

    // Process each line item in the order
    for (const item of order.line_items) {
      const sku = item.sku;
      const quantity = item.quantity;

      if (!sku) continue;

      console.log('Processing order item:', { sku, quantity });

      // Get current product from database
      const product = await getProductBySku(sku);
      if (!product) {
        console.error(`Product not found for SKU: ${sku}`);
        continue;
      }

      // Calculate new inventory
      const newQuantity = Math.max(0, product.onHand - quantity);
      
      // Update product in database
      await updateProduct(product.id, {
        onHand: newQuantity,
        lastUpdated: new Date()
      });

      console.log('Updated inventory:', {
        sku,
        previousQuantity: product.onHand,
        newQuantity,
        store: storeConfig.name
      });
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 