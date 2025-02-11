import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminApiClient } from '@shopify/admin-api-client';

interface InventoryQuantity {
  name: string;
  quantity: number;
}

interface InventoryLevel {
  node: {
    id: string;
    quantities: InventoryQuantity[];
    location: {
      id: string;
      name: string;
    };
  };
}

interface InventoryItem {
  id: string;
  tracked: boolean;
  inventoryLevels: {
    edges: Array<InventoryLevel>;
  };
}

interface Variant {
  node: {
    id: string;
    sku: string | null;
    displayName?: string;
    price?: string;
    inventoryItem: InventoryItem;
  };
}

interface Product {
  node: {
    id: string;
    title: string;
    variants: {
      edges: Array<Variant>;
    };
  };
}

interface ProductsResponse {
  products: {
    edges: Array<Product>;
  };
}

interface ResponseErrors {
  message: string;
  graphQLErrors: Array<{ message: string }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sku } = req.query;
  
  if (!sku || typeof sku !== 'string') {
    return res.status(400).json({ error: 'SKU parameter is required' });
  }

  console.log('Looking up SKU:', sku);

  try {
    // Initialize client with Store One credentials
    const client = createAdminApiClient({
      storeDomain: 'naked-armor.myshopify.com',
      accessToken: process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN || '',
      apiVersion: '2025-01',
    });

    console.log('Store configuration:', {
      storeDomain: 'naked-armor.myshopify.com',
      accessToken: `${process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN?.substring(0, 5)}...`
    });

    // Simplified query to match test.ts structure
    const query = `
      query {
        products(first: 10, query: "sku:${sku}") {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    sku
                    inventoryItem {
                      id
                      tracked
                      inventoryLevels(first: 1) {
                        edges {
                          node {
                            id
                            quantities(names: ["available", "on_hand", "committed"]) {
                              name
                              quantity
                            }
                            location {
                              id
                              name
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    console.log('Executing product query...');
    const response = await client.request(query);
    
    // Debug logging for GraphQL errors
    if (response.errors) {
      console.error('GraphQL Errors:', JSON.stringify(response.errors, null, 2));
      const errors = response.errors as ResponseErrors;
      throw new Error(errors.graphQLErrors[0]?.message || 'GraphQL query failed');
    }
    
    if (!response?.data?.products?.edges) {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid response structure from Shopify API');
    }
    
    const products = response.data.products.edges;
    console.log('Total products found:', products.length);

    // Debug log all products and their SKUs with inventory
    products.forEach((product: Product) => {
      const variants = product.node.variants.edges.map(v => {
        const quantities = v.node.inventoryItem?.inventoryLevels?.edges?.[0]?.node?.quantities || [];
        const availableQuantity = quantities.find((q: InventoryQuantity) => q.name === 'available')?.quantity || 0;
        return {
          sku: v.node.sku,
          inventory: availableQuantity
        };
      });
      console.log('Product:', {
        title: product.node.title,
        variants
      });
    });

    // Find product with matching SKU
    const searchSku = sku.toLowerCase();
    const matchingProduct = products.find((edge: Product) => {
      if (!edge?.node?.variants?.edges) {
        console.log('Invalid product structure:', edge);
        return false;
      }
      return edge.node.variants.edges.some((v: Variant) => {
        if (!v?.node?.sku) {
          console.log('Invalid variant structure:', v);
          return false;
        }
        return v.node.sku.toLowerCase() === searchSku;
      });
    });

    if (matchingProduct) {
      const matchingVariant = matchingProduct.node.variants.edges.find((v: Variant) => 
        v?.node?.sku?.toLowerCase() === searchSku
      )?.node;

      if (matchingVariant) {
        const inventoryLevels = matchingVariant.inventoryItem?.inventoryLevels?.edges || [];
        const inventoryData = inventoryLevels[0]?.node?.quantities || [];
        const inventory = {
          available: inventoryData.find((q: InventoryQuantity) => q.name === 'available')?.quantity || 0,
          onHand: inventoryData.find((q: InventoryQuantity) => q.name === 'on_hand')?.quantity || 0,
          committed: inventoryData.find((q: InventoryQuantity) => q.name === 'committed')?.quantity || 0
        };
        const location = inventoryLevels[0]?.node?.location;

        return res.status(200).json({
          success: true,
          product: {
            id: matchingProduct.node.id,
            title: matchingProduct.node.title,
            variant: {
              id: matchingVariant.id,
              sku: matchingVariant.sku,
              inventory,
              location,
              inventoryLevels: inventoryLevels.map((edge: InventoryLevel) => ({
                quantities: edge.node.quantities.reduce((acc: Record<string, number>, q: InventoryQuantity) => ({
                  ...acc,
                  [q.name]: q.quantity
                }), {}),
                location: edge.node.location
              }))
            }
          }
        });
      }

      // If no exact match, return all available SKUs for reference
      const allSkus = products.flatMap((edge: Product) => {
        if (!edge?.node?.variants?.edges) return [];
        return edge.node.variants.edges.map((v: Variant) => {
          if (!v?.node) return null;
          const quantities = v.node.inventoryItem?.inventoryLevels?.edges?.[0]?.node?.quantities || [];
          const availableQuantity = quantities.find((q: InventoryQuantity) => q.name === 'available')?.quantity || 0;
          return {
            title: edge.node.title,
            sku: v.node.sku,
            inventory: availableQuantity
          };
        }).filter(Boolean);
      }).filter((v: { title: string; sku: string | null; inventory: number } | null): v is { title: string; sku: string | null; inventory: number } => v !== null && v.sku !== null);

      return res.status(404).json({
        success: false,
        error: `No exact match found for SKU "${sku}"`,
        availableSkus: allSkus
      });
    }

  } catch (error: any) {
    console.error('Shopify product lookup failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.errors || error.response?.data
    });
  }
}