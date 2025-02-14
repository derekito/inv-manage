import { NextApiRequest, NextApiResponse } from 'next';
import { getProductBySkuAdmin } from '@/lib/db-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sku = req.query.sku as string;
    if (!sku) {
      return res.status(400).json({ message: 'SKU parameter is required' });
    }

    // Use the existing admin function that we know works
    const product = await getProductBySkuAdmin(sku);
    
    console.log('SKU Lookup Results:', {
      searchedSku: sku,
      found: product ? true : false,
      product: product ? {
        id: product.id,
        sku: product.sku,
        productName: product.productName
      } : null
    });

    return res.status(200).json({ 
      found: !!product,
      product 
    });

  } catch (error) {
    console.error('Test Error:', error);
    return res.status(500).json({ error: error.message });
  }
} 