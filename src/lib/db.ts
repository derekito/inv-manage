import { db } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp, serverTimestamp, limit } from 'firebase/firestore';
import { Product, Location, InventoryUpdate } from '../types';
import { auth } from './firebase';

// Collections
export const productsCollection = collection(db, 'products');
export const locationsCollection = collection(db, 'locations');
export const inventoryUpdatesCollection = collection(db, 'inventory_updates');

// Test data function
export async function createTestProduct() {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to create products');
    }

    const testProduct = {
      sku: `TEST-${Date.now()}`,
      productName: 'Test Product',
      warehouseName: 'Main Warehouse',
      location: {
        loc1: 'A',
        loc2: '01',
        loc3: 'B',
        loc4: '01'
      },
      onHand: 100,
      lastUpdated: Timestamp.now(),
      storeIdentifier: 'naked-armor',
      shopifyProductId: `test-${Date.now()}`,
      status: 'active',
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(productsCollection, testProduct);
    console.log('Test product created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test product:', error);
    throw error;
  }
}

// Product Operations
export async function getProduct(sku: string): Promise<Product | null> {
  const q = query(productsCollection, where('sku', '==', sku));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return { ...doc.data(), id: doc.id } as Product;
}

export async function getAllProducts(): Promise<Product[]> {
  const querySnapshot = await getDocs(productsCollection);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Product);
}

export async function addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'userId'>) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be logged in to add a product');

    const newProduct = {
      ...productData,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      userId: user.uid,
      shopifyProducts: {
        nakedArmor: {
          productId: '',
          variantId: '',
          inventoryItemId: '',
          locationId: process.env.SHOPIFY_STORE_ONE_LOCATION_ID || ''
        },
        grownManShave: {
          productId: '',
          variantId: '',
          inventoryItemId: '',
          locationId: process.env.SHOPIFY_STORE_TWO_LOCATION_ID || ''
        }
      }
    };

    const docRef = await addDoc(collection(db, 'products'), newProduct);
    return { id: docRef.id, ...newProduct };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    const productRef = doc(db, 'products', id);
    return await updateDoc(productRef, {
      ...data,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Location Operations
export async function getLocation(id: string): Promise<Location | null> {
  const docRef = doc(locationsCollection, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return { ...docSnap.data(), id: docSnap.id } as Location;
}

export async function getAllLocations(): Promise<Location[]> {
  const querySnapshot = await getDocs(locationsCollection);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Location);
}

// Inventory Update Operations
export async function recordInventoryUpdate(update: Omit<InventoryUpdate, 'id' | 'timestamp'>): Promise<string> {
  const docRef = await addDoc(inventoryUpdatesCollection, {
    ...update,
    timestamp: new Date()
  });
  return docRef.id;
}

export async function getInventoryUpdates(productSku: string): Promise<InventoryUpdate[]> {
  const q = query(inventoryUpdatesCollection, where('productSku', '==', productSku));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as InventoryUpdate);
}

export async function searchProductsBySku(searchTerm: string): Promise<Product[]> {
  try {
    const q = query(
      productsCollection,
      where('sku', '>=', searchTerm),
      where('sku', '<=', searchTerm + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Product);
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

// Shopify Configuration Operations
export async function updateShopifyConfig(
  productId: string, 
  store: 'nakedArmor' | 'grownManShave',
  config: ShopifyStoreConfig
) {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    const currentProduct = productSnap.data() as Product;
    const shopifyProducts = currentProduct.shopifyProducts || {};

    await updateDoc(productRef, {
      shopifyProducts: {
        ...shopifyProducts,
        [store]: config
      },
      lastUpdated: serverTimestamp()
    });

    return {
      id: productId,
      ...currentProduct,
      shopifyProducts: {
        ...shopifyProducts,
        [store]: config
      }
    };
  } catch (error) {
    console.error('Error updating Shopify config:', error);
    throw error;
  }
}

// Update the ShopifyStoreConfig type
export type ShopifyStoreConfig = {
  productId: string;
  variantId: string;
  inventoryItemId: string;
  locationId?: string;  // Make optional since we'll use env var as fallback
};

// Add this function if it doesn't exist
export async function getProductBySku(sku: string) {
  try {
    const q = query(productsCollection, where('sku', '==', sku));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting product by SKU:', error);
    throw error;
  }
}

// First, add a function to get product ID by SKU
async function getProductIdBySku(sku: string): Promise<string | null> {
  const q = query(productsCollection, where('sku', '==', sku.trim()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return snapshot.docs[0].id;
}

// Modify the upsertProductFromCsv function to use a transaction
export async function upsertProductFromCsv(productData: Partial<Product>) {
  try {
    if (!productData.sku) {
      throw new Error('SKU is required for import');
    }

    const sku = productData.sku.trim();
    console.log('Processing SKU:', sku);

    // Query for existing product with this SKU
    const q = query(productsCollection, where('sku', '==', sku), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`No product found with SKU: ${sku}`);
    }

    const existingDoc = querySnapshot.docs[0];
    const existingData = existingDoc.data();

    // Prepare update data while preserving critical fields
    const updateData = {
      ...productData,
      lastUpdated: serverTimestamp(),
      // Preserve these fields exactly as they are
      sku: existingData.sku,
      createdAt: existingData.createdAt,
      userId: existingData.userId,
      shopifyProducts: existingData.shopifyProducts,
      id: existingDoc.id
    };

    // Update the document directly using its reference
    await updateDoc(doc(productsCollection, existingDoc.id), updateData);

    console.log(`Updated product with SKU ${sku}`, {
      id: existingDoc.id,
      before: existingData,
      after: updateData
    });

    return { 
      status: 'updated', 
      sku,
      id: existingDoc.id 
    };

  } catch (error) {
    console.error('Error in upsertProductFromCsv:', error);
    throw error;
  }
}

// Test function using same approach as getProductBySku
export async function testSkuLookup(sku: string) {
  try {
    if (!sku) {
      throw new Error('SKU is required');
    }

    // Use the same collection reference and query structure as getProductBySku
    const q = query(productsCollection, where('sku', '==', sku));
    const querySnapshot = await getDocs(q);

    // Log the results
    console.log('SKU Lookup Results:', {
      searchedSku: sku,
      found: querySnapshot.size,
      matches: querySnapshot.docs.map(doc => ({
        id: doc.id,
        sku: doc.data().sku,
        productName: doc.data().productName
      }))
    });

    // Return in the same format as other functions
    if (querySnapshot.empty) return [];
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('SKU Lookup Error:', error);
    throw error;
  }
} 