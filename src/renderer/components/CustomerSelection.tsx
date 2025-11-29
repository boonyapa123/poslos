import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcRenderer } from 'electron';

interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  priceLevel: number;
}

interface CustomerSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export default function CustomerSelection({ isOpen, onClose, onSelectCustomer }: CustomerSelectionProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('customer:search', query);
      if (result.success) {
        setCustomers(result.data);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchCustomers]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setCustomers([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, customers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && customers.length > 0) {
      e.preventDefault();
      handleSelectCustomer(customers[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('customer.selectCustomer')}</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('customer.searchPlaceholder')}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4">{t('common.loading')}</p>
            </div>
          )}

          {!loading && searchQuery.length >= 2 && customers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">{t('customer.noResults')}</p>
            </div>
          )}

          {!loading && customers.length > 0 && (
            <div className="space-y-2">
              {customers.map((customer, index) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                          {customer.code}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-800">{customer.name}</h3>
                      </div>
                      {customer.phone && (
                        <p className="text-sm text-gray-500 mt-1">
                          {t('customer.phone')}: {customer.phone}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-600">{t('sales.priceLevel')}</div>
                      <div className="text-2xl font-bold text-blue-600">{customer.priceLevel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {customers.length > 0 && (
              <span>
                {t('productSearch.found')} {customers.length} {t('customer.customers')}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            {t('common.close')} (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
