import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Bill, BillItem } from '../../types/pos';
import { ipcRenderer } from 'electron';

interface POSContextType {
  currentBill: Bill;
  addItem: (item: BillItem) => void;
  removeItem: (lineNumber: number) => void;
  updateQuantity: (lineNumber: number, quantity: number) => void;
  setCustomer: (customerId: string, customerName: string, priceLevel: number) => void;
  clearCustomer: () => void;
  calculateTotals: () => void;
  clearBill: () => void;
  parkBill: () => Promise<boolean>;
  restoreBill: (bill: Bill) => void;
  vatType: 'INCLUSIVE' | 'EXCLUSIVE';
  setVatType: (type: 'INCLUSIVE' | 'EXCLUSIVE') => void;
  vatRate: number;
  setVatRate: (rate: number) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within POSProvider');
  }
  return context;
};

const createEmptyBill = (vatType: 'INCLUSIVE' | 'EXCLUSIVE', vatRate: number): Bill => ({
  items: [],
  customerPriceLevel: 1,
  subtotal: 0,
  vatAmount: 0,
  vatType,
  vatRate,
  discount: 0,
  grandTotal: 0,
  status: 'ACTIVE',
});

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vatType, setVatType] = useState<'INCLUSIVE' | 'EXCLUSIVE'>('INCLUSIVE');
  const [vatRate, setVatRate] = useState<number>(7);
  const [currentBill, setCurrentBill] = useState<Bill>(createEmptyBill(vatType, vatRate));

  // Update customer display whenever bill changes
  useEffect(() => {
    const displayData = {
      items: currentBill.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productNameEn: item.productNameEn,
        productNameLo: item.productNameLo,
        unitName: item.unitName,
        unitNameEn: item.unitNameEn,
        unitNameLo: item.unitNameLo,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      subtotal: currentBill.subtotal,
      vatAmount: currentBill.vatAmount,
      grandTotal: currentBill.grandTotal,
      customerName: currentBill.customerName,
    };
    
    ipcRenderer.send('customer-display:update', displayData);
  }, [currentBill]);

  const calculateTotals = useCallback(() => {
    setCurrentBill((prev) => {
      const subtotalBeforeDiscount = prev.items.reduce((sum, item) => sum + item.lineTotal, 0);
      const subtotal = subtotalBeforeDiscount - prev.discount;

      let vatAmount = 0;
      let grandTotal = 0;

      if (prev.vatType === 'INCLUSIVE') {
        // VAT included in price
        grandTotal = subtotal;
        vatAmount = grandTotal - grandTotal / (1 + prev.vatRate / 100);
      } else {
        // VAT exclusive
        vatAmount = subtotal * (prev.vatRate / 100);
        grandTotal = subtotal + vatAmount;
      }

      return {
        ...prev,
        subtotal,
        vatAmount: Math.round(vatAmount * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
      };
    });
  }, []);

  const addItem = useCallback(
    (item: BillItem) => {
      setCurrentBill((prev) => {
        const existingItemIndex = prev.items.findIndex(
          (i) => i.productId === item.productId && i.unitId === item.unitId
        );

        let newItems;
        if (existingItemIndex >= 0) {
          // Update existing item
          newItems = [...prev.items];
          const existingItem = newItems[existingItemIndex];
          existingItem.quantity += item.quantity;
          existingItem.lineTotal = existingItem.quantity * existingItem.unitPrice;
        } else {
          // Add new item
          const lineNumber = prev.items.length > 0 ? Math.max(...prev.items.map((i) => i.lineNumber)) + 1 : 1;
          newItems = [...prev.items, { ...item, lineNumber }];
        }

        return { ...prev, items: newItems };
      });
      calculateTotals();
    },
    [calculateTotals]
  );

  const removeItem = useCallback(
    (lineNumber: number) => {
      setCurrentBill((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.lineNumber !== lineNumber),
      }));
      calculateTotals();
    },
    [calculateTotals]
  );

  const updateQuantity = useCallback(
    (lineNumber: number, quantity: number) => {
      setCurrentBill((prev) => {
        const newItems = prev.items.map((item) => {
          if (item.lineNumber === lineNumber) {
            return {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice,
            };
          }
          return item;
        });
        return { ...prev, items: newItems };
      });
      calculateTotals();
    },
    [calculateTotals]
  );

  const setCustomer = useCallback(
    (customerId: string, customerName: string, priceLevel: number) => {
      setCurrentBill((prev) => ({
        ...prev,
        customerId,
        customerName,
        customerPriceLevel: priceLevel,
      }));
    },
    []
  );

  const clearCustomer = useCallback(() => {
    setCurrentBill((prev) => ({
      ...prev,
      customerId: undefined,
      customerName: undefined,
      customerPriceLevel: 1,
    }));
  }, []);

  const clearBill = useCallback(() => {
    setCurrentBill(createEmptyBill(vatType, vatRate));
  }, [vatType, vatRate]);

  const parkBill = useCallback(async () => {
    try {
      const result = await ipcRenderer.invoke('transaction:park', currentBill);
      if (result.success) {
        clearBill();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error parking bill:', error);
      return false;
    }
  }, [currentBill]);

  const restoreBill = useCallback((bill: Bill) => {
    setCurrentBill({ ...bill, status: 'ACTIVE' });
  }, []);

  const value: POSContextType = {
    currentBill,
    addItem,
    removeItem,
    updateQuantity,
    setCustomer,
    clearCustomer,
    calculateTotals,
    clearBill,
    parkBill,
    restoreBill,
    vatType,
    setVatType,
    vatRate,
    setVatRate,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
