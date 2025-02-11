import { db } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp, serverTimestamp } from 'firebase/firestore';
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

export async function updateProduct(id: string, updates: Partial<Product>) {
  try {
    if (!id) {
      throw new Error('Product ID is required for update');
    }

    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    const currentProduct = productSnap.data() as Product;
    
    // Clean the updates object by removing undefined values
    const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<Product>);

    // Create the final update object
    const updatedProduct = {
      ...cleanedUpdates,
      lastUpdated: serverTimestamp(),
      // Preserve fields that shouldn't be updated
      sku: currentProduct.sku,
      userId: currentProduct.userId,
      createdAt: currentProduct.createdAt
    };

    await updateDoc(productRef, updatedProduct);
    return { id, ...currentProduct, ...updatedProduct };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(sku: string): Promise<void> {
  const product = await getProduct(sku);
  if (!product) {
    throw new Error('Product not found');
  }
  
  const docRef = doc(productsCollection, product.id);
  await deleteDoc(docRef);
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
export async function getProductBySku(sku: string): Promise<Product | null> {
  try {
    const q = query(productsCollection, where('sku', '==', sku));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { ...doc.data(), id: doc.id } as Product;
  } catch (error) {
    console.error('Error getting product by SKU:', error);
    throw error;
  }
} 