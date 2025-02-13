import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getProductBySkuAdmin } from '@/lib/db-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // First find a valid SKU from our database
    const testSku = 'SS-NOG'; // Use a known SKU from Naked Armor
    const product = await getProductBySkuAdmin(testSku);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Test SKU ${testSku} not found in database`
      });
    }

    // Create test data with valid SKU
    const testOrder = {
      id: 'test-123',
      order_number: 'TEST-001',
      line_items: [
        { 
          sku: testSku, 
          quantity: 1,
          title: product.productName
        }
      ],
      test: true
    };

    const rawBody = JSON.stringify(testOrder);
    const secret = process.env.SHOPIFY_STORE_ONE_WEBHOOK_SECRET;

    // Calculate HMAC
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    // Make request to webhook endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Topic': 'orders/create',
        'X-Shopify-Shop-Domain': process.env.SHOPIFY_STORE_ONE_URL,
        'X-Shopify-Hmac-SHA256': hmac,
        'X-Shopify-Test': 'true'
      },
      body: rawBody
    });

    const result = await response.json();

    res.status(200).json({
      success: true,
      testData: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/webhook`,
        hmac,
        body: testOrder,
        product: {
          id: product.id,
          sku: product.sku,
          onHand: product.onHand
        }
      },
      result
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 