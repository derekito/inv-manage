import { useState } from 'react';
import { Product } from '@/types';
import Modal from './Modal';

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Partial<Product>) => Promise<void>;
}

export default function ProductEditModal({ product, isOpen, onClose, onSave }: ProductEditModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      sku: '',
      productName: '',
      description: '',
      onHand: 0,
      location: {
        loc1: '',
        loc2: '',
        loc3: '',
        loc4: ''
      },
      location2: {
        loc1: '',
        loc2: '',
        loc3: '',
        loc4: '',
        onHand: 0
      },
      status: 'active',
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
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('location.')) {
      const [_, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else if (name.startsWith('location2.')) {
      const [_, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        location2: {
          ...prev.location2,
          [field]: field === 'onHand' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'onHand' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleShopifyConfigChange = (
    store: 'nakedArmor' | 'grownManShave',
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      shopifyProducts: {
        ...prev.shopifyProducts,
        [store]: {
          ...prev.shopifyProducts?.[store],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">On Hand (Primary Location)</label>
              <input
                type="number"
                name="onHand"
                value={formData.onHand}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Primary Location (Syncs with Shopify)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <input
                  type="text"
                  name="location.loc1"
                  value={formData.location?.loc1}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aisle</label>
                <input
                  type="text"
                  name="location.loc2"
                  value={formData.location?.loc2}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Shelf</label>
                <input
                  type="text"
                  name="location.loc3"
                  value={formData.location?.loc3}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bin</label>
                <input
                  type="text"
                  name="location.loc4"
                  value={formData.location?.loc4}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Secondary Location</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <input
                  type="text"
                  name="location2.loc1"
                  value={formData.location2?.loc1}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aisle</label>
                <input
                  type="text"
                  name="location2.loc2"
                  value={formData.location2?.loc2}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Shelf</label>
                <input
                  type="text"
                  name="location2.loc3"
                  value={formData.location2?.loc3}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bin</label>
                <input
                  type="text"
                  name="location2.loc4"
                  value={formData.location2?.loc4}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">On Hand (Secondary Location)</label>
              <input
                type="number"
                name="location2.onHand"
                value={formData.location2?.onHand}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Shopify Configuration</h3>
            
            {/* Naked Armor Configuration */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Naked Armor</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.nakedArmor?.productId || ''}
                    onChange={(e) => handleShopifyConfigChange('nakedArmor', 'productId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variant ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.nakedArmor?.variantId || ''}
                    onChange={(e) => handleShopifyConfigChange('nakedArmor', 'variantId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inventory Item ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.nakedArmor?.inventoryItemId || ''}
                    onChange={(e) => handleShopifyConfigChange('nakedArmor', 'inventoryItemId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.nakedArmor?.locationId || ''}
                    onChange={(e) => handleShopifyConfigChange('nakedArmor', 'locationId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Grown Man Shave Configuration */}
            <div>
              <h4 className="text-md font-medium mb-2">Grown Man Shave</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.grownManShave?.productId || ''}
                    onChange={(e) => handleShopifyConfigChange('grownManShave', 'productId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variant ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.grownManShave?.variantId || ''}
                    onChange={(e) => handleShopifyConfigChange('grownManShave', 'variantId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inventory Item ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.grownManShave?.inventoryItemId || ''}
                    onChange={(e) => handleShopifyConfigChange('grownManShave', 'inventoryItemId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location ID</label>
                  <input
                    type="text"
                    value={formData.shopifyProducts?.grownManShave?.locationId || ''}
                    onChange={(e) => handleShopifyConfigChange('grownManShave', 'locationId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 