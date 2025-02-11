import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '@/lib/db';
import ProductEditModal from '@/components/ProductEditModal';
import CsvImportModal from '@/components/CsvImportModal';
import { toast } from '@/lib/toast';
import { syncAllProducts } from '@/lib/shopify';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const fetchedProducts = await getAllProducts();
      console.log('Fetched products:', fetchedProducts);
      
      // Verify Shopify configuration
      fetchedProducts.forEach(product => {
        console.log(`Product ${product.sku} Shopify config:`, {
          hasShopifyProducts: !!product.shopifyProducts,
          nakedArmorConfig: product.shopifyProducts?.nakedArmor,
          grownManShaveConfig: product.shopifyProducts?.grownManShave
        });
      });
      
      setProducts(fetchedProducts);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleEditSave = async (updatedProduct: Partial<Product>) => {
    try {
      if (!editingProduct?.id) throw new Error('No product selected for editing');
      
      await updateProduct(editingProduct.id, updatedProduct);
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      
      await loadProducts();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating product:', err);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    }
  };

  const handleAddSave = async (newProduct: Partial<Product>) => {
    try {
      await addProduct(newProduct as Omit<Product, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>);
      toast({
        title: 'Success',
        description: 'Product added successfully',
      });
      
      await loadProducts();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding product:', err);
      toast({
        title: 'Error',
        description: 'Failed to add product',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.productName}? This action cannot be undone.`)) {
      handleDelete(product);
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      setDeletingProduct(product);
      await deleteProduct(product.sku);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleImportProducts = async (products: Omit<Product, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>[]) => {
    try {
      for (const product of products) {
        await addProduct(product);
      }
      await loadProducts();
      toast({
        title: 'Success',
        description: `Successfully imported ${products.length} products`,
      });
    } catch (err) {
      console.error('Error importing products:', err);
      toast({
        title: 'Error',
        description: 'Failed to import products',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleShopifySync = async (store: 'naked-armor' | 'grown-man-shave') => {
    setIsSyncing(true);
    try {
      console.log('Starting sync for store:', store);
      console.log('Total products:', products.length);

      // Remove the filter for pre-configured products
      const syncableProducts = products.filter(product => product.sku);

      console.log('Products to sync:', syncableProducts.map(p => ({
        sku: p.sku,
        onHand: p.onHand
      })));

      if (syncableProducts.length === 0) {
        toast({
          title: 'Warning',
          description: 'No products found to sync',
          variant: 'destructive',
        });
        return;
      }

      console.log('Calling sync API...');
      const response = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: syncableProducts,
          storeIdentifier: store,
        }),
      });

      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync with Shopify');
      }

      toast({
        title: 'Sync Complete',
        description: `${data.summary.succeeded} products synced successfully, ${data.summary.failed} failed`,
        variant: data.success ? 'default' : 'destructive',
      });

      if (data.summary.failed > 0) {
        const failedItems = data.results
          .filter(r => !r.success)
          .map(r => `${r.sku}: ${r.error}`)
          .join('\n');
        
        toast({
          title: 'Sync Failures',
          description: `Failed items:\n${failedItems}`,
          variant: 'destructive',
        });
      }

      await loadProducts();
    } catch (error) {
      console.error('Error syncing with Shopify:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync with Shopify',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Product
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Import CSV
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => handleShopifySync('naked-armor')}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Sync Naked Armor'}
            </button>
            <button
              onClick={() => handleShopifySync('grown-man-shave')}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Sync Grown Man Shave'}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by SKU or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">Primary Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Primary Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">Secondary Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Secondary Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{product.productName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {product.location ? `${product.location.loc1}-${product.location.loc2}-${product.location.loc3}-${product.location.loc4}` : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.onHand}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {product.location2 ? `${product.location2.loc1}-${product.location2.loc2}-${product.location2.loc3}-${product.location2.loc4}` : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{product.location2?.onHand || 0}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  <div className="flex justify-end items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      disabled={deletingProduct?.id === product.id}
                      className={`text-red-600 hover:text-red-900 ${
                        deletingProduct?.id === product.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {deletingProduct?.id === product.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <ProductEditModal
          product={editingProduct}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
        />
      )}

      {showAddModal && (
        <ProductEditModal
          product={null}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportProducts}
      />
    </div>
  );
} 