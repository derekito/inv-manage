import { adminDb } from './firebase-admin';
import { Product } from '../types';  // Make sure we import the Product type

// Add proper type for update data
interface UpdateData {
  productName?: string;
  description?: string;
  onHand?: number;
  status?: string;
  location?: {
    loc1?: string;
    loc2?: string;
    loc3?: string;
    loc4?: string;
  };
  sku: string;
  lastUpdated: Date;
  createdAt: any; // FirebaseTimestamp
  userId: string;
  shopifyProducts: {
    nakedArmor: {
      productId: string;
      variantId: string;
      inventoryItemId: string;
      locationId: string;
    };
    grownManShave: {
      productId: string;
      variantId: string;
      inventoryItemId: string;
      locationId: string;
    };
  };
}

export async function getProductBySkuAdmin(sku: string) {
  try {
    const snapshot = await adminDb
      .collection('products')
      .where('sku', '==', sku)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting product by SKU:', error);
    throw error;
  }
}

export async function updateProductAdmin(id: string, data: any) {
  try {
    return await adminDb
      .collection('products')
      .doc(id)
      .update({
        ...data,
        lastUpdated: new Date()
      });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Test function using admin SDK
export async function testSkuLookup(sku: string) {
  try {
    if (!sku) {
      throw new Error('SKU is required');
    }

    console.log('Starting SKU lookup test for:', sku);
    
    // Use adminDb instead of regular db
    const q = adminDb.collection('products').where('sku', '==', sku.trim());
    const querySnapshot = await q.get();
    
    const results = {
      totalFound: querySnapshot.size,
      documents: querySnapshot.docs.map(doc => ({
        id: doc.id,
        sku: doc.data().sku,
        productName: doc.data().productName
      }))
    };

    console.log('Query results:', results);

    if (querySnapshot.size === 0) {
      console.log('No products found with SKU:', sku);
    } else if (querySnapshot.size > 1) {
      console.warn('Multiple products found with SKU:', sku);
    }

    return results;
  } catch (error) {
    console.error('Error in SKU lookup test:', error);
    throw new Error(`SKU lookup failed: ${error.message}`);
  }
}

// Add this function to update products from CSV
export async function upsertProductFromCsvAdmin(productData: Partial<Product>) {
  try {
    if (!productData.sku) {
      throw new Error('SKU is required for import');
    }

    const sku = productData.sku.trim();
    console.log('Processing SKU:', sku);
    
    // First check if product exists
    const snapshot = await adminDb
      .collection('products')
      .where('sku', '==', sku)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      // UPDATE existing product
      const doc = snapshot.docs[0];
      const existingData = doc.data();

      // Only update specific fields
      const updateData = {
        productName: productData.productName || existingData.productName,
        description: productData.description || existingData.description,
        onHand: productData.onHand || existingData.onHand,
        status: productData.status || existingData.status,
        location: productData.location || existingData.location,
        lastUpdated: new Date()
      };

      await adminDb.collection('products').doc(doc.id).update(updateData);

      return {
        status: 'updated',
        id: doc.id,
        sku
      };

    } else {
      // CREATE new product
      const newProductData = {
        ...productData,
        sku,
        createdAt: new Date(),
        lastUpdated: new Date(),
        status: productData.status || 'active',
        shopifyProducts: {
          nakedArmor: {
            productId: '',
            variantId: '',
            inventoryItemId: '',
            locationId: ''
          },
          grownManShave: {
            productId: '',
            variantId: '',
            inventoryItemId: '',
            locationId: ''
          }
        }
      };

      const docRef = await adminDb.collection('products').add(newProductData);

      return {
        status: 'created',
        id: docRef.id,
        sku
      };
    }

  } catch (error) {
    console.error('CSV Import Error:', {
      sku: productData.sku,
      error: error.message
    });
    throw error;
  }
}

// New function specifically for updating existing products only
export async function updateExistingProductBySku(productData: Partial<Product>) {
  try {
    if (!productData.sku) {
      throw new Error('SKU is required for update');
    }

    const sku = productData.sku.trim();
    console.log('Attempting to update SKU:', sku);

    // 1. Connect and find existing product
    const snapshot = await adminDb
      .collection('products')
      .where('sku', '==', sku)
      .limit(1)
      .get();

    // 2. Verify product exists
    if (snapshot.empty) {
      throw new Error(`Cannot update: No product found with SKU: ${sku}`);
    }

    // 3. Get existing data
    const doc = snapshot.docs[0];
    const existingData = doc.data();

    // 4. Update only specific fields
    const updateData = {
      productName: productData.productName || existingData.productName,
      description: productData.description || existingData.description,
      onHand: productData.onHand || existingData.onHand,
      status: productData.status || existingData.status,
      location: productData.location || existingData.location,
      lastUpdated: new Date()
    };

    // 5. Perform update
    await adminDb
      .collection('products')
      .doc(doc.id)
      .update(updateData);

    console.log('Successfully updated product:', {
      sku,
      id: doc.id,
      fields: Object.keys(updateData)
    });

    return {
      status: 'updated',
      id: doc.id,
      sku
    };

  } catch (error) {
    console.error('Update Failed:', {
      sku: productData.sku,
      error: error.message
    });
    throw error;
  }
} 