export interface Product {
  id: string;
  sku: string;
  productName: string;
  description?: string;
  onHand: number;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  userId: string;
  location: {
    loc1: string;
    loc2: string;
    loc3: string;
    loc4: string;
  };
  location2?: {
    loc1: string;
    loc2: string;
    loc3: string;
    loc4: string;
    onHand: number;
  };
  shopifyProducts: {
    nakedArmor: {
      productId: string;
      variantId: string;
      inventoryItemId: string;
      locationId?: string;
    };
    grownManShave: {
      productId: string;
      variantId: string;
      inventoryItemId: string;
      locationId?: string;
    };
  };
} 