import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcRenderer } from 'electron';
import { formatCurrency, convertFromTHB, convertToTHB, getCurrencyCode } from '../utils/currency';

interface PaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (paymentData: PaymentData) => void;
  grandTotal: number;
}

export interface PaymentData {
  method: 'CASH' | 'TRANSFER';
  amountReceived?: number;
  change?: number;
  printReceipt?: boolean;
}

export default function Payment({ isOpen, onClose, onComplete, grandTotal }: PaymentProps) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [change, setChange] = useState<number>(0);
  const [printReceipt, setPrintReceipt] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      // Convert to current currency
      const displayAmount = Math.round(convertFromTHB(grandTotal));
      setAmountReceived(displayAmount.toString());
      setChange(0);
    }
  }, [isOpen, grandTotal]);

  useEffect(() => {
    if (paymentMethod === 'CASH') {
      const received = parseFloat(amountReceived) || 0;
      const displayTotal = convertFromTHB(grandTotal);
      const changeAmount = received - displayTotal;
      setChange(changeAmount >= 0 ? changeAmount : 0);
    } else {
      setChange(0);
    }
  }, [amountReceived, grandTotal, paymentMethod]);

  const handleComplete = () => {
    if (paymentMethod === 'CASH') {
      const received = parseFloat(amountReceived) || 0;
      const displayTotal = convertFromTHB(grandTotal);
      
      if (received < displayTotal) {
        alert(t('payment.insufficientAmount'));
        return;
      }
      
      // Convert back to THB for storage
      const receivedTHB = convertToTHB(received);
      const changeTHB = convertToTHB(change);
      
      onComplete({
        method: 'CASH',
        amountReceived: receivedTHB,
        change: changeTHB,
        printReceipt,
      });
    } else {
      onComplete({
        method: 'TRANSFER',
        printReceipt,
      });
    }
  };

  const handleQuickAmount = (amountTHB: number) => {
    // Convert to current currency
    const displayAmount = Math.round(convertFromTHB(amountTHB));
    setAmountReceived(displayAmount.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b bg-blue-600 text-white rounded-t-lg">
          <h2 className="text-3xl font-bold">{t('payment.title')}</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Grand Total */}
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <div className="text-lg text-gray-600 mb-2">{t('sales.grandTotal')}</div>
            <div className="text-5xl font-bold text-blue-600">
              {formatCurrency(grandTotal, { convertFromTHB: true })}
            </div>
            {getCurrencyCode() !== 'THB' && (
              <div className="text-sm text-gray-500 mt-2">
                (฿{Math.round(grandTotal).toLocaleString('th-TH')})
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              {t('payment.method')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-2">💵</div>
                <div className="text-xl font-semibold">{t('payment.cash')}</div>
              </button>
              <button
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-2">🏦</div>
                <div className="text-xl font-semibold">{t('payment.transfer')}</div>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  {t('payment.amountReceived')}
                </label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full px-4 py-3 text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  autoFocus
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, grandTotal].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                  >
                    {amount === grandTotal 
                      ? t('payment.exact') 
                      : formatCurrency(amount, { convertFromTHB: true })}
                  </button>
                ))}
              </div>

              {/* Change */}
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-700">{t('payment.change')}:</span>
                  <span className="text-3xl font-bold text-green-600">
                    {formatCurrency(convertToTHB(change), { convertFromTHB: true })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Note */}
          {paymentMethod === 'TRANSFER' && (
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-gray-700">
                {t('payment.transferNote')}
              </p>
            </div>
          )}

          {/* Print Receipt Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="printReceipt"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="printReceipt" className="text-lg text-gray-700 cursor-pointer">
              🖨️ {t('payment.print')}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleComplete}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            ✓ {t('payment.complete')}
          </button>
        </div>
      </div>
    </div>
  );
}
