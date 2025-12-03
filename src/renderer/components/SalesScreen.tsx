import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePOS } from '../context/POSContext';
import ProductSearch from './ProductSearch';
import CustomerSelection from './CustomerSelection';
import Payment, { PaymentData } from './Payment';
import ParkedBills from './ParkedBills';
import HotkeyManager from '../../services/HotkeyManager';
import { getProductName } from '../utils/productName';
import { formatCurrency as formatCurrencyDisplay, formatNumber } from '../utils/currency';

const { ipcRenderer } = window.require('electron');

const SalesScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentBill, removeItem, addItem, setCustomer, clearCustomer, clearBill, restoreBill, parkBill } = usePOS();
  const [productInput, setProductInput] = useState('');
  const [quantityMultiplier, setQuantityMultiplier] = useState(1);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerSelection, setShowCustomerSelection] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showParkedBills, setShowParkedBills] = useState(false);

  useEffect(() => {
    const hotkeyManager = HotkeyManager.getInstance();

    // Register hotkeys
    hotkeyManager.registerHotkey('f6', () => setShowProductSearch(true), 'Search Products');
    hotkeyManager.registerHotkey('delete', () => setShowCustomerSelection(true), 'Select Customer');
    hotkeyManager.registerHotkey('f9', () => setShowParkedBills(true), 'View Parked Bills');
    hotkeyManager.registerHotkey('end', () => {
      if (currentBill.items.length > 0) {
        setShowPayment(true);
      }
    }, 'Payment');
    hotkeyManager.registerHotkey('m', () => {
      // Delete last item
      if (currentBill.items.length > 0) {
        const lastItem = currentBill.items[currentBill.items.length - 1];
        removeItem(lastItem.lineNumber);
      }
    }, 'Delete Last Item');
    
    hotkeyManager.registerHotkey('ctrl+delete', () => {
      // Clear all items (ใส่หลักสูตรค้า)
      clearBill();
    }, 'Clear All Items');
    
    hotkeyManager.registerHotkey('pagedown', () => {
      // Exit bill (ออกบิลขาย)
      if (currentBill.items.length > 0) {
        setShowPayment(true);
      }
    }, 'Exit Bill');
    
    hotkeyManager.registerHotkey('f10', () => {
      // Calculator (เครื่องคิดเลข) - open system calculator
      const { shell } = window.require('electron');
      if (process.platform === 'win32') {
        shell.openPath('calc.exe');
      } else if (process.platform === 'darwin') {
        shell.openPath('/Applications/Calculator.app');
      }
    }, 'Calculator');
    
    hotkeyManager.registerHotkey('insert', () => {
      // Reprint last receipt (ฟิมพบิลซ้ำ)
      ipcRenderer.invoke('printer:reprint').catch((err: any) => {
        console.error('Error reprinting:', err);
      });
    }, 'Reprint Receipt');
    
    hotkeyManager.registerHotkey('home', () => {
      // Home screen (บิดโปรแกรมขาย) - could navigate to home
      // For now, just clear the bill
      clearBill();
    }, 'Home Screen');
    
    hotkeyManager.registerHotkey('ctrl+m', () => {
      // Cancel bill (ยกเลิกหมดบิล)
      clearBill();
    }, 'Cancel Bill');

    // Handle keyboard input for product code
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if input is focused or modal is open
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT') return;
      if (showProductSearch || showCustomerSelection || showPayment || showParkedBills) return;

      // Number keys for product code
      if (e.key >= '0' && e.key <= '9') {
        setProductInput((prev) => prev + e.key);
      }
      // Asterisk for quantity multiplier
      else if (e.key === '*') {
        const qty = parseInt(productInput) || 1;
        setQuantityMultiplier(qty);
        setProductInput('');
      }
      // Enter to add product
      else if (e.key === 'Enter' && productInput) {
        handleAddProduct();
      }
      // Backspace
      else if (e.key === 'Backspace') {
        setProductInput((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      hotkeyManager.unregisterAll();
    };
  }, [productInput, quantityMultiplier, currentBill.items, showProductSearch, showCustomerSelection, showPayment, showParkedBills]);

  const handleAddProduct = async () => {
    if (!productInput) return;

    try {
      // Search product by SKU/barcode
      const result = await ipcRenderer.invoke('product:findByCode', productInput);
      
      if (!result.success || !result.data) {
        alert(`${t('sales.productNotFound')}: ${productInput}`);
        setProductInput('');
        return;
      }

      const product = result.data;
      
      // Get base unit (or first unit)
      const baseUnit = product.units.find((u: any) => u.isBaseUnit) || product.units[0];
      
      if (!baseUnit) {
        alert('สินค้านี้ไม่มีหน่วยขาย');
        setProductInput('');
        return;
      }

      // Get price for current customer's price level
      const priceLevel = currentBill.customerPriceLevel;
      const priceInfo = baseUnit.prices.find((p: any) => p.priceLevel === priceLevel);
      
      if (!priceInfo) {
        alert(`ไม่พบราคาสำหรับระดับ ${priceLevel}`);
        setProductInput('');
        return;
      }

      // Add to bill
      const newItem = {
        lineNumber: 0, // Will be set by context
        productId: product.id,
        productSku: product.sku,
        productName: getProductName(product, i18n.language),
        productNameEn: product.nameEn,
        productNameLo: product.nameLo,
        unitId: baseUnit.id,
        unitName: baseUnit.unitName,
        unitNameEn: baseUnit.unitNameEn,
        unitNameLo: baseUnit.unitNameLo,
        quantity: quantityMultiplier,
        unitPrice: parseFloat(priceInfo.price),
        lineTotal: quantityMultiplier * parseFloat(priceInfo.price),
        discount: 0,
      };

      addItem(newItem);
      
      // Reset
      setProductInput('');
      setQuantityMultiplier(1);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    }
  };

  const handlePaymentComplete = async (paymentData: PaymentData) => {
    try {
      // Save transaction to database
      const transactionData = {
        ...currentBill,
        paymentMethod: paymentData.method,
      };
      
      const result = await ipcRenderer.invoke('transaction:complete', transactionData);
      
      if (result.success) {
        // Print receipt if requested
        if (paymentData.printReceipt) {
          const receiptData = {
            transactionNumber: result.data.transactionNumber,
            transactionDate: new Date(result.data.transactionDate),
            customerName: currentBill.customerName,
            items: currentBill.items,
            subtotal: currentBill.subtotal,
            vatAmount: currentBill.vatAmount,
            vatRate: currentBill.vatRate,
            grandTotal: currentBill.grandTotal,
            paymentMethod: paymentData.method,
            amountReceived: paymentData.amountReceived,
            change: paymentData.change,
          };
          
          await ipcRenderer.invoke('printer:print', receiptData);
        }
        
        // Show thank you on customer display
        ipcRenderer.send('customer-display:show-thank-you');
        
        // Clear bill
        clearBill();
        setShowPayment(false);
        
        alert(t('payment.complete'));
      } else {
        alert(t('common.error') + ': ' + result.error);
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      alert(t('common.error'));
    }
  };

  const handleParkBill = async () => {
    if (currentBill.items.length === 0) {
      alert(t('sales.noItems'));
      return;
    }
    
    const success = await parkBill();
    if (success) {
      alert(t('parkedBills.parkSuccess'));
    } else {
      alert(t('common.error'));
    }
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyDisplay(amount, { convertFromTHB: true, showSymbol: true });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Product Input Area */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('sales.productCode')}
            </label>
            <input
              type="text"
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddProduct();
              }}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('sales.productCodePlaceholder')}
              autoFocus
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('sales.quantity')}
            </label>
            <input
              type="number"
              value={quantityMultiplier}
              onChange={(e) => setQuantityMultiplier(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
              min="1"
            />
          </div>
        </div>

        {/* Customer Info */}
        {currentBill.customerName && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">{t('sales.customer')}: </span>
                <span className="font-semibold text-blue-900">{currentBill.customerName}</span>
                <span className="ml-3 text-sm text-gray-600">
                  {t('sales.priceLevel')}: {currentBill.customerPriceLevel}
                </span>
              </div>
              <button
                onClick={clearCustomer}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                ✕ {t('sales.removeCustomer')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto">
        {currentBill.items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-2">{t('sales.noItems')}</p>
              <p className="text-sm">{t('sales.scanToStart')}</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">{t('sales.lineNumber')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('sales.code')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('sales.productName')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('sales.unit')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('sales.quantity')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('sales.price')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('sales.total')}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {currentBill.items.map((item) => (
                <tr key={item.lineNumber} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{item.lineNumber}</td>
                  <td className="px-4 py-3 text-sm font-mono">{item.productSku}</td>
                  <td className="px-4 py-3 text-sm">{getProductName({
                    name: item.productName,
                    nameEn: item.productNameEn,
                    nameLo: item.productNameLo
                  }, i18n.language)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.unitName}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatNumber(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                    {formatNumber(item.lineTotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeItem(item.lineNumber)}
                      className="text-red-600 hover:text-red-800 font-bold"
                      title="ลบรายการ (M)"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className="border-t-2 border-gray-300 bg-gray-50 p-4">
        <div className="max-w-md ml-auto space-y-2">
          <div className="flex justify-between text-lg">
            <span className="text-gray-700">{t('sales.subtotal')}:</span>
            <span className="font-semibold">{formatNumber(currentBill.subtotal)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-700">
              {t('sales.vat')} {currentBill.vatRate}% ({currentBill.vatType === 'INCLUSIVE' ? t('sales.inclusive') : t('sales.exclusive')}):
            </span>
            <span className="font-semibold">{formatNumber(currentBill.vatAmount)}</span>
          </div>
          {currentBill.discount > 0 && (
            <div className="flex justify-between text-lg text-red-600">
              <span>{t('sales.discount')}:</span>
              <span className="font-semibold">-{formatNumber(currentBill.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-bold text-blue-600 pt-2 border-t-2 border-gray-300">
            <span>{t('sales.grandTotal')}:</span>
            <span>{formatCurrency(currentBill.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex space-x-3">
          <button
            onClick={() => setShowProductSearch(true)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg transition"
            title={t('hotkeys.f6')}
          >
            🔍 {t('sales.searchProduct')} (F6)
          </button>
          <button
            onClick={() => setShowParkedBills(true)}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold text-lg transition"
            title={t('hotkeys.f9')}
          >
            📋 {t('parkedBills.title')} (F9)
          </button>
          <button
            onClick={handleParkBill}
            disabled={currentBill.items.length === 0}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-semibold text-lg transition"
            title={t('hotkeys.endPlus')}
          >
            💾 {t('sales.parkBill')}
          </button>
          <button
            onClick={clearBill}
            disabled={currentBill.items.length === 0}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-semibold text-lg transition"
            title={t('hotkeys.endM')}
          >
            ✕ {t('sales.cancelBill')}
          </button>
          <button
            onClick={() => setShowPayment(true)}
            disabled={currentBill.items.length === 0}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-semibold text-lg transition"
            title={t('hotkeys.end')}
          >
            💰 {t('sales.payment')}
          </button>
        </div>
      </div>

      {/* Product Search Modal */}
      <ProductSearch
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        onSelectProduct={(product, unit, price) => {
          addItem({
            lineNumber: 0,
            productId: product.id,
            productSku: product.sku,
            productName: getProductName(product, i18n.language),
            productNameEn: product.nameEn,
            productNameLo: product.nameLo,
            unitId: unit.id,
            unitName: unit.unitName,
            unitNameEn: unit.unitNameEn,
            unitNameLo: unit.unitNameLo,
            quantity: quantityMultiplier,
            unitPrice: price,
            lineTotal: price * quantityMultiplier,
            discount: 0,
          });
          setQuantityMultiplier(1);
        }}
        priceLevel={currentBill.customerPriceLevel}
      />

      {/* Customer Selection Modal */}
      <CustomerSelection
        isOpen={showCustomerSelection}
        onClose={() => setShowCustomerSelection(false)}
        onSelectCustomer={(customer) => {
          setCustomer(customer.id, customer.name, customer.priceLevel);
        }}
      />

      {/* Payment Modal */}
      <Payment
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onComplete={handlePaymentComplete}
        grandTotal={currentBill.grandTotal}
      />

      {/* Parked Bills Modal */}
      <ParkedBills
        isOpen={showParkedBills}
        onClose={() => setShowParkedBills(false)}
        onRecall={(bill) => {
          restoreBill(bill);
        }}
      />
    </div>
  );
};

export default SalesScreen;
