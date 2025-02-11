// Product Types
export interface Product {
  id: string;
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
  location2?: {  // Optional secondary location
    loc1: string;
    loc2: string;
    loc3: string;
    loc4: string;
    onHand: number; // Separate inventory count for location 2
  };
  shopifyProducts: {
    nakedArmor: {
      productId: string;
      inventoryItemId: string;
      locationId: string;
    };
    grownManShave: {
      productId: string;
      inventoryItemId: string;
      locationId: string;
    };
  };
  status: 'active' | 'inactive';
  userId: string;
  createdAt: any; // Firestore Timestamp
}

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