import { NextApiRequest, NextApiResponse } from 'next';
import { getAllProducts } from '@/lib/db';
import { syncInventoryWithShopify } from '@/lib/shopify';
import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security check
  const cronToken = req.headers['x-cron-token'];
  if (cronToken !== process.env.CRON_SECRET) {
    console.error('Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting automated sync via cron...');
    
    // Get all products using adminDb
    const snapshot = await adminDb.collection('products').get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Total products:', products.length);

    // Filter products with SKUs (same as your manual sync)
    const syncableProducts = products.filter(product => product.sku);

    if (syncableProducts.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No products found to sync'
      });
    }

    // Sync with both stores (same as your manual sync)
    const results = await Promise.all(
      syncableProducts.map(async (product) => {
        const nakedArmorResult = await syncInventoryWithShopify(product, 'naked-armor');
        const grownManResult = await syncInventoryWithShopify(product, 'grown-man-shave');
        return [nakedArmorResult, grownManResult];
      })
    );

    // Flatten results and count successes/failures
    const flatResults = results.flat();
    const summary = {
      succeeded: flatResults.filter(r => r.success).length,
      failed: flatResults.filter(r => !r.success).length
    };

    return res.status(200).json({
      success: true,
      summary,
      results: flatResults
    });

  } catch (error) {
    console.error('Cron sync failed:', error);
    return res.status(500).json({ 
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 