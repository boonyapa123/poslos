import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcRenderer } from 'electron';
import { getProductName } from '../utils/productName';

interface ProductUnit {
  id: string;
  unitCode: string;
  unitName: string;
  unitNameEn?: string;
  unitNameLo?: string;
  barcode?: string;
  conversionRate: number;
  isBaseUnit: boolean;
  prices: Array<{
    priceLevel: number;
    price: number;
  }>;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  nameEn?: string;
  nameLo?: string;
  category?: string;
  units: ProductUnit[];
}

interface ProductSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, unit: ProductUnit, price: number) => void;
  priceLevel: number;
}

export default function ProductSearch({ isOpen, onClose, onSelectProduct, priceLevel }: ProductSearchProps) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('product:search', query);
      if (result.success) {
        setProducts(result.data);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchProducts]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setProducts([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && products.length > 0) {
      e.preventDefault();
      handleSelectProduct(products[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectProduct = (product: Product) => {
    // Use base unit by default
    const baseUnit = product.units.find((u) => u.isBaseUnit) || product.units[0];
    if (!baseUnit) return;

    // Find price for current price level
    const priceObj = baseUnit.prices.find((p) => p.priceLevel === priceLevel);
    const price = priceObj?.price || 0;

    onSelectProduct(product, baseUnit, price);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('productSearch.title')}</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('productSearch.placeholder')}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4">{t('productSearch.searching')}</p>
            </div>
          )}

          {!loading && searchQuery.length >= 2 && products.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">{t('productSearch.noResults')}</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="space-y-2">
              {products.map((product, index) => {
                const baseUnit = product.units.find((u) => u.isBaseUnit) || product.units[0];
                const priceObj = baseUnit?.prices.find((p) => p.priceLevel === priceLevel);
                const price = priceObj?.price || 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                            {product.sku}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {getProductName(product, i18n.language)}
                          </h3>
                        </div>
                        {product.category && (
                          <p className="text-sm text-gray-500 mt-1">{t('productSearch.category')}: {product.category}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {product.units.map((unit) => (
                            <span
                              key={unit.id}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                            >
                              {unit.unitName}
                              {unit.barcode && ` (${unit.barcode})`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(price).toLocaleString('th-TH')}
                        </div>
                        {baseUnit && (
                          <div className="text-sm text-gray-500">{t('productSearch.per')} {baseUnit.unitName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {products.length > 0 && (
              <span>
                {t('productSearch.found')} {products.length} {t('productSearch.items')} | {t('productSearch.instructions')}
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
