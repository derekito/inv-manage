import { NextApiRequest, NextApiResponse } from 'next';
import { syncProductWithBothStores } from '@/lib/shopify';
import { Product } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!process.env.SHOPIFY_STORE_ONE_URL) {
    return res.status(500).json({ error: 'Missing SHOPIFY_STORE_ONE_URL configuration' });
  }
  if (!process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Missing SHOPIFY_STORE_ONE_ACCESS_TOKEN configuration' });
  }
  if (!process.env.SHOPIFY_STORE_ONE_LOCATION_ID) {
    return res.status(500).json({ error: 'Missing SHOPIFY_STORE_ONE_LOCATION_ID configuration' });
  }

  try {
    console.log('Received sync request');
    const { products } = req.body;
    console.log('Products received:', products?.length);

    if (!products) {
      console.log('No products provided');
      return res.status(400).json({ error: 'Missing products parameter' });
    }

    console.log('Starting sync for products');
    const allResults = [];
    let totalSucceeded = 0;
    let totalFailed = 0;

    // Sync each product with both stores
    for (const product of products) {
      console.log(`Processing product ${product.sku}`);
      const results = await syncProductWithBothStores(product);
      allResults.push(...results);
      
      // Count successes and failures
      results.forEach(result => {
        if (result.success) totalSucceeded++;
        else totalFailed++;
      });
    }

    const response = {
      success: totalFailed === 0,
      message: `Sync completed: ${totalSucceeded} succeeded, ${totalFailed} failed`,
      summary: {
        total: totalSucceeded + totalFailed,
        succeeded: totalSucceeded,
        failed: totalFailed
      },
      results: allResults
    };

    console.log('Sync completed:', response);

    // Return detailed response
    return res.status(200).json(response);

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred during sync'
    });
  }
} 