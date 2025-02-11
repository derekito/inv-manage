import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminApiClient } from '@shopify/admin-api-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize client with Store One credentials
    const client = createAdminApiClient({
      storeDomain: process.env.SHOPIFY_STORE_ONE_URL || '',
      accessToken: process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN || '',
      apiVersion: '2025-01',
    });

    console.log('Testing connection with config:', {
      storeDomain: process.env.SHOPIFY_STORE_ONE_URL,
      accessToken: `${process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN?.substring(0, 5)}...`,
    });

    // Test query to get shop information and product count
    const query = `
      query {
        shop {
          name
          myshopifyDomain
          primaryDomain {
            url
            host
          }
        }
        products(first: 1) {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    sku
                    inventoryItem {
                      id
                      tracked
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.request(query);
    
    return res.status(200).json({
      success: true,
      shop: response.data?.shop,
      config: {
        storeDomain: process.env.SHOPIFY_STORE_ONE_URL,
        accessToken: `${process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN?.substring(0, 5)}...`,
      },
      products: response.data?.products
    });
  } catch (error: any) {
    console.error('Shopify test connection failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.errors || error.response?.data
    });
  }
} 