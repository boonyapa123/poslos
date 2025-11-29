import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ipcRenderer } from 'electron';
import { useTranslation } from 'react-i18next';
import '../i18n/config';
import { formatCurrency as formatCurrencyDisplay, formatNumber } from './utils/currency';
import { getProductName, getUnitName } from './utils/productName';

interface DisplayItem {
  productId: string;
  productName: string;
  productNameEn?: string;
  productNameLo?: string;
  unitName: string;
  unitNameEn?: string;
  unitNameLo?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface DisplayData {
  items: DisplayItem[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  customerName?: string;
}

function CustomerDisplay() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<DisplayData>({
    items: [],
    subtotal: 0,
    vatAmount: 0,
    grandTotal: 0,
  });
  const [showThankYou, setShowThankYou] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    // Listen for updates from main window
    ipcRenderer.on('update-customer-display', (event, displayData: DisplayData) => {
      setData(displayData);
      setShowThankYou(false);
    });

    ipcRenderer.on('show-thank-you', () => {
      setShowThankYou(true);
      // Auto hide after 5 seconds
      setTimeout(() => {
        setShowThankYou(false);
        setData({
          items: [],
          subtotal: 0,
          vatAmount: 0,
          grandTotal: 0,
        });
      }, 5000);
    });

    ipcRenderer.on('show-qr-code', (event, qrCodeData: string) => {
      setQrCode(qrCodeData);
    });

    ipcRenderer.on('hide-qr-code', () => {
      setQrCode(null);
    });

    ipcRenderer.on('change-language', (event, language: string) => {
      i18n.changeLanguage(language);
    });

    return () => {
      ipcRenderer.removeAllListeners('update-customer-display');
      ipcRenderer.removeAllListeners('show-thank-you');
      ipcRenderer.removeAllListeners('show-qr-code');
      ipcRenderer.removeAllListeners('hide-qr-code');
      ipcRenderer.removeAllListeners('change-language');
    };
  }, [i18n]);

  if (showThankYou) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="text-center">
          <h1 className="text-8xl font-bold mb-8">{t('customerDisplay.thankYou')}</h1>
          <div className="mt-12 text-6xl">😊</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-blue-400">{t('customerDisplay.welcome')}</h1>
        {data.customerName && (
          <p className="text-2xl text-gray-300 mt-2">{data.customerName}</p>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-auto mb-6">
        {data.items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-3xl text-gray-500">{t('customerDisplay.pleaseWait')}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                <th className="p-4 text-xl">{t('sales.productName')}</th>
                <th className="p-4 text-xl text-center">{t('sales.quantity')}</th>
                <th className="p-4 text-xl text-right">{t('sales.price')}</th>
                <th className="p-4 text-xl text-right">{t('sales.total')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-4">
                    <div className="text-2xl font-medium">
                      {getProductName({
                        name: item.productName,
                        nameEn: item.productNameEn,
                        nameLo: item.productNameLo
                      }, i18n.language)}
                    </div>
                    <div className="text-lg text-gray-400">
                      {getUnitName({
                        unitName: item.unitName,
                        unitNameEn: item.unitNameEn,
                        unitNameLo: item.unitNameLo
                      }, i18n.language)}
                    </div>
                  </td>
                  <td className="p-4 text-2xl text-center">{item.quantity}</td>
                  <td className="p-4 text-2xl text-right">
                    {formatNumber(item.unitPrice, { convertFromTHB: true })}
                  </td>
                  <td className="p-4 text-2xl text-right font-medium">
                    {formatNumber(item.lineTotal, { convertFromTHB: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* QR Code Display */}
      {qrCode && (
        <div className="mb-6 flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            <p className="text-center text-gray-800 mt-2">{t('customerDisplay.scanToPay')}</p>
          </div>
        </div>
      )}

      {/* Totals */}
      {data.items.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-3">
          <div className="flex justify-between text-2xl">
            <span>{t('sales.subtotal')}:</span>
            <span>{formatNumber(data.subtotal, { convertFromTHB: true })}</span>
          </div>
          <div className="flex justify-between text-2xl">
            <span>{t('sales.vat')} 7%:</span>
            <span>{formatNumber(data.vatAmount, { convertFromTHB: true })}</span>
          </div>
          <div className="flex justify-between text-5xl font-bold text-green-400 pt-3 border-t border-gray-600">
            <span>{t('sales.grandTotal')}:</span>
            <span>{formatCurrencyDisplay(data.grandTotal, { convertFromTHB: true, showSymbol: true })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('customer-display-root')!);
root.render(<CustomerDisplay />);
