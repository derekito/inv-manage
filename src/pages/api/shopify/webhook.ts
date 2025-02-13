import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import getRawBody from 'raw-body';
import { getProductBySkuAdmin, updateProductAdmin } from '@/lib/db-admin';

// Debug logging helper
function debugLog(label: string, data: any) {
  console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
}

// Get store config based on shop domain
function getStoreConfig(shopDomain: string) {
  debugLog('Store Config Request', { 
    shopDomain,
    storeOneUrl: process.env.SHOPIFY_STORE_ONE_URL,
    storeTwoUrl: process.env.SHOPIFY_STORE_TWO_URL
  });
  
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

// Verify Shopify webhook HMAC
function verifyWebhook(rawBody: Buffer, hmac: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  return hash === hmac;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get raw body before parsing
    const rawBody = await getRawBody(req);
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    const topic = req.headers['x-shopify-topic'] as string;

    // Log webhook receipt immediately
    console.log('Webhook received:', {
      topic,
      shop: shopDomain,
      test: req.headers['x-shopify-test']
    });

    // Validate shop and get config
    const storeConfig = getStoreConfig(shopDomain);
    if (!storeConfig || !storeConfig.secret) {
      return res.status(403).json({ message: 'Unauthorized shop' });
    }

    // Verify webhook signature
    if (!verifyWebhook(rawBody, hmac, storeConfig.secret)) {
      return res.status(403).json({ message: 'Invalid signature' });
    }

    // Parse order data
    const order = JSON.parse(rawBody.toString('utf8'));

    // Respond quickly to Shopify (under 5 seconds)
    res.status(200).json({ message: 'Webhook received' });

    // Process order asynchronously
    processOrder(order, storeConfig).catch(error => {
      console.error('Async order processing error:', error);
    });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Async order processing
async function processOrder(order: any, storeConfig: any) {
  try {
    // Process each line item
    for (const item of order.line_items || []) {
      const { sku, quantity } = item;
      if (!sku) continue;

      const product = await getProductBySkuAdmin(sku);
      if (!product) {
        console.error(`Product not found for SKU: ${sku}`);
        continue;
      }

      const newQuantity = Math.max(0, product.onHand - quantity);
      await updateProductAdmin(product.id, {
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
  } catch (error) {
    console.error('Order processing error:', error);
    throw error;
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for raw body access
  },
};