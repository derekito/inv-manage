// Product Types

## NEW TYPES (Added for variantId support) ##
export type ShopifyProductInfo = {
  productId: string;
  variantId: string;  // This was missing in your implementation
  inventoryItemId: string;
  locationId?: string;
};

export type ShopifyProducts = {
  nakedArmor?: ShopifyProductInfo;
  grownManShave?: ShopifyProductInfo;
};
## END NEW TYPES ##

## CURRENT WORKING TYPE ##
export type Product = {
  id?: string;
  sku: string;
  productName: string;
  description: string;
  onHand: number;
  lastUpdated: any; // Firestore Timestamp
  location: {
    loc1: string;
    loc2: string;
    loc3: string;
    loc4: string;
  };
  location2: {
    loc1: string;
    loc2: string;
    loc3: string;
    loc4: string;
    onHand: number;
  };
  shopifyProducts?: {
    nakedArmor?: {
      productId: string;
      variantId: string;  // Added for type compatibility
      inventoryItemId: string;
      locationId?: string;
    };
    grownManShave?: {
      productId: string;
      variantId: string;  // Added for type compatibility
      inventoryItemId: string;
      locationId?: string;
    };
  };
  status: 'active' | 'inactive';
  userId: string;
  createdAt: any; // Firestore Timestamp
};

## ORIGINAL WORKING TYPE (Keep for reference) ##
/*
export type Product = {
  id?: string;
  sku: string;
  productName: string;
  description: string;
  onHand: number;
  lastUpdated: any; // Firestore Timestamp
  location: {
    loc1: string;
    loc2: string;
    loc3: string;
    loc4: string;
  };
  location2: {
    loc1: string;
    loc2: string;
    loc3: string;
    loc4: string;
    onHand: number;
  };
  shopifyProducts?: {
    nakedArmor?: {
      productId: string;
      inventoryItemId: string;
      locationId?: string;
    };
    grownManShave?: {
      productId: string;
      inventoryItemId: string;
      locationId?: string;
    };
  };
  status: 'active' | 'inactive';
  userId: string;
  createdAt: any; // Firestore Timestamp
};
*/
## END ORIGINAL TYPE ##

// Warehouse Location Types
export interface Location {
  id: string;
  name: string;
  sections: {
    [key: string]: {
      aisles: {
        [key: string]: {
          shelves: {
            [key: string]: {
              bins: string[];
            };
          };
        };
      };
    };
  };
}

// Inventory Update Types
export interface InventoryUpdate {
  id: string;
  productSku: string;
  previousQuantity: number;
  newQuantity: number;
  source: 'shopify' | 'manual' | 'import';
  storeIdentifier?: string;
  timestamp: Date;
  userId: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  preferences: {
    defaultWarehouse?: string;
    notifications?: {
      lowStock: boolean;
      inventoryUpdates: boolean;
    };
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Shopify Types
export interface ShopifyInventoryUpdate {
  inventory_item_id: string;
  location_id: string;
  available: number;
  updated_at: string;
} 