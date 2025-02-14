import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export function ImportModal({ isOpen, onClose, onSuccess }) {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleImport = async (parsedData) => {
    setImporting(true);
    try {
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedData })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);

      setResults(data.results);
      toast({
        title: 'Import Complete',
        description: `Created: ${data.results.created}, Updated: ${data.results.updated}, Failed: ${data.results.failed}`,
        variant: data.results.failed > 0 ? 'warning' : 'success'
      });

      if (data.results.errors.length > 0) {
        console.error('Import errors:', data.results.errors);
      }

      onSuccess();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  // ... rest of component
} 