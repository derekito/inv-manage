import { NextApiRequest, NextApiResponse } from 'next';
import { upsertProductFromCsvAdmin } from '@/lib/db-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('\n=== Starting CSV Import ===');
  
  try {
    const products = req.body.products;
    console.log('Products to Process:', {
      total: products.length,
      skus: products.map(p => p.sku)
    });

    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[],
      processed: [] as string[]
    };

    for (const product of products) {
      try {
        console.log(`\nProcessing Product ${results.updated + results.failed + 1} of ${products.length}`);
        
        const result = await upsertProductFromCsvAdmin(product);
        results.updated++;
        results.processed.push(result.sku);
        
        console.log('Successfully Processed:', {
          sku: product.sku,
          status: result.status,
          id: result.id
        });

      } catch (error) {
        results.failed++;
        results.errors.push(`SKU ${product.sku}: ${error.message}`);
        console.error('Failed to Process:', {
          sku: product.sku,
          error: error.message
        });
      }
    }

    console.log('\n=== Import Summary ===');
    console.log('Results:', {
      total: products.length,
      updated: results.updated,
      failed: results.failed,
      processed: results.processed,
      errors: results.errors
    });
    console.log('=== Import Complete ===\n');

    return res.status(200).json({
      success: true,
      message: `Processed ${products.length} products. Updated: ${results.updated}, Failed: ${results.failed}`,
      results
    });

  } catch (error) {
    console.error('Import Failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Import failed',
      error: error.message 
    });
  }
} 