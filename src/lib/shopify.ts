import { createAdminApiClient } from '@shopify/admin-api-client';
import { ShopifyInventoryUpdate, Product } from '../types';

export type ShopifyStore = 'naked-armor' | 'grown-man-shave';

export type ShopifyProductInfo = {
  productId: string;
  variantId: string;
  inventoryItemId: string;
  locationId: string;
};

export type ShopifyProducts = {
  nakedArmor?: ShopifyProductInfo;
  grownManShave?: ShopifyProductInfo;
};

// Export types for use in other files
export type ProductWithShopify = Product & {
  shopifyProducts?: ShopifyProducts;
};

// Initialize Shopify clients for both stores
const nakedArmorClient = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_STORE_ONE_URL || '',
  accessToken: process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN || '',
  apiVersion: '2025-01',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN || ''
  }
});

// Add Grown Man Shave client alongside existing Naked Armor client
const grownManShaveClient = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_STORE_TWO_URL || '',
  accessToken: process.env.SHOPIFY_STORE_TWO_ACCESS_TOKEN || '',
  apiVersion: '2025-01',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': process.env.SHOPIFY_STORE_TWO_ACCESS_TOKEN || ''
  }
});

// Helper function to get the appropriate client based on store identifier
function getClientForStore(storeIdentifier: ShopifyStore) {
  console.log('Getting client for store:', storeIdentifier);
  
  // Debug log all environment variables (but mask sensitive data)
  console.log('Environment Variables:', {
    STORE_ONE_URL: process.env.SHOPIFY_STORE_ONE_URL,
    STORE_ONE_TOKEN: process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN ? 'Set' : 'Not Set',
    STORE_ONE_LOCATION: process.env.SHOPIFY_STORE_ONE_LOCATION_ID,
    STORE_TWO_URL: process.env.SHOPIFY_STORE_TWO_URL,
    STORE_TWO_TOKEN: process.env.SHOPIFY_STORE_TWO_ACCESS_TOKEN ? 'Set' : 'Not Set',
    STORE_TWO_LOCATION: process.env.SHOPIFY_STORE_TWO_LOCATION_ID,
    NODE_ENV: process.env.NODE_ENV,
    API_VERSION: '2025-01'
  });

  if (storeIdentifier === 'naked-armor') {
    if (!process.env.SHOPIFY_STORE_ONE_URL) {
      throw new Error('Missing SHOPIFY_STORE_ONE_URL');
    }
    if (!process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN) {
      throw new Error('Missing SHOPIFY_STORE_ONE_ACCESS_TOKEN');
    }

    // Create a new client instance each time to ensure fresh credentials
    return createAdminApiClient({
      storeDomain: process.env.SHOPIFY_STORE_ONE_URL,
      accessToken: process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN,
      apiVersion: '2025-01',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN
      }
    });
  }
  
  if (storeIdentifier === 'grown-man-shave') {
    if (!process.env.SHOPIFY_STORE_TWO_URL) {
      throw new Error('Missing SHOPIFY_STORE_TWO_URL');
    }
    if (!process.env.SHOPIFY_STORE_TWO_ACCESS_TOKEN) {
      throw new Error('Missing SHOPIFY_STORE_TWO_ACCESS_TOKEN');
    }

    return createAdminApiClient({
      storeDomain: process.env.SHOPIFY_STORE_TWO_URL,
      accessToken: process.env.SHOPIFY_STORE_TWO_ACCESS_TOKEN,
      apiVersion: '2025-01',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_STORE_TWO_ACCESS_TOKEN
      }
    });
  }

  throw new Error(`Invalid store identifier: ${storeIdentifier}`);
}

interface InventoryResponse {
  product?: {
    variants: {
      edges: Array<{
        node: {
          inventoryItem: {
            id: string;
            inventoryLevels: {
              edges: Array<{
                node: {
                  available: number;
                  location: {
                    id: string;
                  };
                };
              }>;
            };
          };
        };
      }>;
    };
  };
}

interface AdjustInventoryResponse {
  inventoryAdjustQuantity?: {
    inventoryLevel: {
      available: number;
    };
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

// Fetch product from Shopify
export async function getShopifyProduct(productId: string, storeIdentifier: string) {
  const client = getClientForStore(storeIdentifier as ShopifyStore);
  
  const query = `
    query getProduct($productId: ID!) {
      product(id: $productId) {
        id
        title
        handle
        variants(first: 10) {
          edges {
            node {
              id
              sku
              inventoryItem {
                id
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      available
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
  `;

  const response = await client.request(query, {
    variables: { productId },
  });

  return response.data?.product;
}

// Fetch inventory levels from Shopify
export async function getShopifyInventory(productId: string, storeIdentifier: string): Promise<ShopifyInventoryUpdate> {
  const client = getClientForStore(storeIdentifier as ShopifyStore);
  
  const query = `
    query getInventoryLevel($productId: ID!) {
      product(id: $productId) {
        variants(first: 10) {
          edges {
            node {
              inventoryItem {
                id
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      available
                      location {
                        id
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

  const response = await client.request(query, {
    variables: { productId },
  });

  if (!response.data?.product) {
    throw new Error('Product not found');
  }

  const variant = response.data.product.variants.edges[0]?.node;
  if (!variant) {
    throw new Error('Product variant not found');
  }

  const inventoryLevel = variant.inventoryItem.inventoryLevels.edges[0]?.node;
  if (!inventoryLevel) {
    throw new Error('Inventory level not found');
  }

  return {
    inventory_item_id: variant.inventoryItem.id,
    location_id: inventoryLevel.location.id,
    available: inventoryLevel.available,
    updated_at: new Date().toISOString(),
  };
}

// Add new type for sync results
interface SyncResult {
  sku: string;
  store: ShopifyStore;
  success: boolean;
  previousQuantity?: number;
  newQuantity?: number;
  error?: string;
  message?: string;
}

// First, let's get all products and find by SKU
async function findShopifyProductBySku(client: ReturnType<typeof createAdminApiClient>, sku: string, locationId: string) {
  try {
    // Keep the working authentication test
    const authTest = await client.request(`
      query {
        shop {
          name
        }
      }
    `);

    if (authTest.errors) {
      throw new Error('Authentication test failed');
    }

    console.log('Authentication successful, proceeding with product lookup');

    // First find the inventory item ID using SKU
    const findInventoryItemQuery = `
      query {
        inventoryItems(first: 1, query: "sku:${sku}") {
          nodes {
            id
            variant {
              id
              sku
              product {
                id
                title
              }
              inventoryItem {
                id
                inventoryLevel(locationId: "${locationId}") {
                  id
                  quantities(names: ["available", "on_hand", "committed", "incoming"]) {
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
    `;

    const inventoryResponse = await client.request(findInventoryItemQuery);
    console.log('Inventory Item Response:', JSON.stringify(inventoryResponse, null, 2));

    const inventoryItem = inventoryResponse.data?.inventoryItems?.nodes[0];
    if (!inventoryItem?.variant) {
      throw new Error(`No inventory item found with SKU: ${sku}`);
    }

    const inventoryLevel = inventoryItem.variant.inventoryItem.inventoryLevel;
    if (!inventoryLevel) {
      throw new Error(`No inventory level found for location: ${locationId}`);
    }

    // Get the quantities from the response
    const quantities = inventoryLevel.quantities.reduce((acc: any, q: any) => {
      acc[q.name] = q.quantity;
      return acc;
    }, {});

    return {
      productId: inventoryItem.variant.product.id,
      variantId: inventoryItem.variant.id,
      inventoryItemId: inventoryItem.variant.inventoryItem.id,
      locationId,
      currentInventory: quantities.on_hand || quantities.available || 0,
      title: inventoryItem.variant.product.title,
      quantities
    };

  } catch (error) {
    console.error('Error finding product by SKU:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

// Update inventory levels in Shopify
async function updateShopifyInventory(
  client: ReturnType<typeof createAdminApiClient>,
  inventoryItemId: string,
  locationId: string,
  newQuantity: number,
  currentQuantity: number
) {
  const mutation = `
    mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        inventoryAdjustmentGroup {
          createdAt
          reason
          changes {
            name
            delta
            quantityAfterChange
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Calculate the delta (difference) instead of setting absolute quantity
  const delta = newQuantity - currentQuantity;

  const variables = {
    input: {
      changes: [{
        inventoryItemId,
        locationId,
        delta: delta  // Changed from quantity to delta
      }],
      name: "available",  // Changed from "on_hand" to "available"
      reason: "correction",
      referenceDocumentUri: `gid://shopify/App/${process.env.SHOPIFY_APP_ID || 'inventory_sync'}`
    }
  };

  try {
    console.log('Updating inventory with:', JSON.stringify(variables, null, 2));
    const response = await client.request(mutation, { variables });
    console.log('Update response:', JSON.stringify(response.data, null, 2));

    if (response.data?.inventoryAdjustQuantities?.userErrors?.length > 0) {
      throw new Error(response.data.inventoryAdjustQuantities.userErrors[0].message);
    }

    return response.data?.inventoryAdjustQuantities?.inventoryAdjustmentGroup;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
}

// Main sync function
export async function syncInventoryWithShopify(
  product: Product,
  storeIdentifier: ShopifyStore
): Promise<SyncResult> {
  const client = getClientForStore(storeIdentifier);
  
  try {
    const storeConfig = storeIdentifier === 'naked-armor' 
      ? product.shopifyProducts?.nakedArmor
      : product.shopifyProducts?.grownManShave;

    // Use environment variable as fallback for locationId
    const locationId = storeConfig?.locationId || 
      (storeIdentifier === 'naked-armor' 
        ? process.env.SHOPIFY_STORE_ONE_LOCATION_ID 
        : process.env.SHOPIFY_STORE_TWO_LOCATION_ID);

    if (!locationId) {
      throw new Error(`No location ID configured for store: ${storeIdentifier}`);
    }

    console.log(`Starting sync for product:`, {
      sku: product.sku,
      store: storeIdentifier,
      productId: storeConfig?.productId,
      variantId: storeConfig?.variantId,
      locationId,
      currentInventory: product.onHand
    });
    
    // Find product in Shopify by SKU
    const shopifyProduct = await findShopifyProductBySku(
      client, 
      product.sku,
      locationId
    );
    
    if (!shopifyProduct) {
      console.log(`No Shopify product found for SKU: ${product.sku}`);
      return {
        sku: product.sku,
        store: storeIdentifier,
        success: false,
        error: 'Product not found in Shopify'
      };
    }

    // Set the inventory directly to our master inventory level
    const masterInventory = product.onHand;
    
    console.log('Inventory update details:', {
      sku: product.sku,
      store: storeIdentifier,
      currentShopify: shopifyProduct.currentInventory,
      masterInventory,
      locationId: shopifyProduct.locationId,
      inventoryItemId: shopifyProduct.inventoryItemId
    });

    // Update Shopify inventory to match our master inventory
    const updateResult = await updateShopifyInventory(
      client,
      shopifyProduct.inventoryItemId,
      shopifyProduct.locationId,
      masterInventory,
      shopifyProduct.currentInventory  // Pass current quantity for delta calculation
    );

    console.log('Update result:', updateResult);

    return {
      sku: product.sku,
      store: storeIdentifier,
      success: true,
      previousQuantity: shopifyProduct.currentInventory,
      newQuantity: masterInventory,
      message: `Updated inventory from ${shopifyProduct.currentInventory} to ${masterInventory}`
    };

  } catch (error) {
    console.error(`Sync error for ${product.sku}:`, error);
    return {
      sku: product.sku,
      store: storeIdentifier,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to sync a product with both stores
export async function syncProductWithBothStores(product: Product) {
  const results = [];
  
  // Sync with Naked Armor
  try {
    const nakedArmorResult = await syncInventoryWithShopify(product, 'naked-armor');
    results.push(nakedArmorResult);
  } catch (error) {
    results.push({
      sku: product.sku,
      store: 'naked-armor',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Sync with Grown Man Shave
  try {
    const grownManResult = await syncInventoryWithShopify(product, 'grown-man-shave');
    results.push(grownManResult);
  } catch (error) {
    results.push({
      sku: product.sku,
      store: 'grown-man-shave',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

// Test connection to Shopify
export async function testShopifyConnection(storeIdentifier: string) {
  const client = getClientForStore(storeIdentifier as ShopifyStore);
  
  const query = `
    query {
      shop {
        name
        myshopifyDomain
      }
    }
  `;

  try {
    const response = await client.request(query);
    return response.data?.shop;
  } catch (error) {
    console.error('Shopify connection test failed:', error);
    throw error;
  }
}