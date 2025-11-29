import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bill } from '../../types/pos';

interface ParkedBillsProps {
  isOpen: boolean;
  onClose: () => void;
  onRecall: (bill: Bill) => void;
}

export default function ParkedBills({ isOpen, onClose, onRecall }: ParkedBillsProps) {
  const { t } = useTranslation();
  const [parkedBills, setParkedBills] = useState<Bill[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadParkedBills();
    }
  }, [isOpen]);

  const loadParkedBills = async () => {
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('transaction:getParked');
      if (result.success) {
        // Convert transactions to Bill format
        const bills = result.data.map((txn: any) => ({
          id: txn.id,
          items: txn.items || [],
          customerId: txn.customerId,
          customerName: txn.Customer?.name,
          customerPriceLevel: 1,
          subtotal: txn.subtotal,
          vatAmount: txn.vatAmount,
          vatType: txn.vatType,
          vatRate: txn.vatRate,
          discount: txn.discount,
          grandTotal: txn.grandTotal,
          status: 'PARKED',
          parkedAt: txn.createdAt,
        }));
        setParkedBills(bills);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error loading parked bills:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, parkedBills.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && parkedBills.length > 0) {
      e.preventDefault();
      handleRecall(parkedBills[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleRecall = (bill: Bill) => {
    onRecall(bill);
    onClose();
  };

  const handleDelete = async (billId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('parkedBills.confirmDelete'))) {
      try {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('transaction:delete', billId);
        if (result.success) {
          loadParkedBills();
        }
      } catch (error) {
        console.error('Error deleting parked bill:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-yellow-500 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold">{t('parkedBills.title')}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4" onKeyDown={handleKeyDown} tabIndex={0}>
          {parkedBills.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-xl">{t('parkedBills.noBills')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {parkedBills.map((bill, index) => (
                <div
                  key={bill.id || index}
                  onClick={() => handleRecall(bill)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-yellow-100 border-2 border-yellow-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-800">
                          {t('parkedBills.bill')} #{bill.id?.slice(0, 8)}
                        </span>
                        {bill.customerName && (
                          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {bill.customerName}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {bill.items.length} {t('parkedBills.items')} • {t('parkedBills.parkedAt')}: {bill.parkedAt ? new Date(bill.parkedAt).toLocaleString() : '-'}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600">
                        ฿{Math.round(bill.grandTotal).toLocaleString('th-TH')}
                      </div>
                      <button
                        onClick={(e) => handleDelete(bill.id || '', e)}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-lg">
          <div className="text-sm text-gray-600">
            {parkedBills.length > 0 && (
              <span>
                {t('parkedBills.found')} {parkedBills.length} {t('parkedBills.bills')}
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
