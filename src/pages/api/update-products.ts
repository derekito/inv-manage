import { NextApiRequest, NextApiResponse } from 'next';
import { updateExistingProductBySku } from '@/lib/db-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const products = req.body.products;
    console.log('Products to Update:', products.length);

    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const product of products) {
      try {
        await updateExistingProductBySku(product);
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`SKU ${product.sku}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${results.updated} products. Failed: ${results.failed}`,
      results
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Update failed',
      error: error.message
    });
  }
} 