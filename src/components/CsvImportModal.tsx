import { useState } from 'react';
import Papa from 'papaparse';
import Modal from './Modal';
import { Product } from '@/types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'lastUpdated'>[]) => Promise<void>;
}

export default function CsvImportModal({ isOpen, onClose, onImport }: CsvImportModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          setIsLoading(true);
          const products = results.data.map((row: any) => {
            let status: 'active' | 'inactive' = 'active';
            if (row.Status?.toLowerCase() === 'inactive') {
              status = 'inactive';
            }

            return {
              sku: row.SKU,
              productName: row.ProductName,
              description: row.Description || '',
              onHand: parseInt(row.OnHand) || 0,
              status,
              location: {
                loc1: row.Section || '',
                loc2: row.Aisle || '',
                loc3: row.Shelf || '',
                loc4: row.Bin || ''
              },
              shopifyProducts: {
                nakedArmor: {
                  productId: '',
                  variantId: '',
                  inventoryItemId: '',
                  locationId: process.env.NEXT_PUBLIC_SHOPIFY_STORE_ONE_LOCATION_ID || ''
                },
                grownManShave: {
                  productId: '',
                  variantId: '',
                  inventoryItemId: '',
                  locationId: process.env.NEXT_PUBLIC_SHOPIFY_STORE_TWO_LOCATION_ID || ''
                }
              }
            };
          });

          await onImport(products);
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to import products');
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const handleDownloadTemplate = () => {
    const headers = ['SKU', 'ProductName', 'Description', 'OnHand', 'Status', 'Section', 'Aisle', 'Shelf', 'Bin'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white p-6 rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Import Products from CSV</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Upload a CSV file with the following columns: SKU, ProductName, Description, OnHand, Status, Section, Aisle, Shelf, Bin
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Download Template
            </button>
          </div>

          <div className="mt-4">
            <label className="block">
              <span className="sr-only">Choose CSV file</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </label>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
} 