import { adminDb } from './firebase-admin';

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