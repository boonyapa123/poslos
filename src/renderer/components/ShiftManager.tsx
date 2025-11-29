import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const { ipcRenderer } = window.require('electron');

interface Shift {
  id: string;
  shiftNumber: string;
  startTime: Date;
  endTime?: Date;
  openingCash: number;
  closingCash?: number;
  totalSales?: number;
  status: 'OPEN' | 'CLOSED';
}

interface ShiftManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShiftManager({ isOpen, onClose }: ShiftManagerProps) {
  const { t } = useTranslation();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentShift();
    }
  }, [isOpen]);

  const loadCurrentShift = async () => {
    try {
      const result = await ipcRenderer.invoke('shift:getCurrent');
      if (result.success && result.data) {
        setCurrentShift(result.data);
      } else {
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error loading shift:', error);
    }
  };

  const handleStartShift = async () => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('shift:start', {
        openingCash: parseFloat(openingCash) || 0,
      });

      if (result.success) {
        alert(t('shift.startSuccess'));
        await loadCurrentShift();
        setOpeningCash('0');
      } else {
        alert(t('common.error') + ': ' + result.error);
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!currentShift) return;

    if (!confirm(t('shift.confirmEnd'))) return;

    setLoading(true);
    try {
      // 1. ปิดกะ
      const result = await ipcRenderer.invoke('shift:end', {
        shiftId: currentShift.id,
        closingCash: parseFloat(closingCash) || 0,
      });

      if (!result.success) {
        alert(t('common.error') + ': ' + result.error);
        setLoading(false);
        return;
      }

      // 2. ลอง Sync ข้อมูลขาย (ถ้าเน็ตใช้ได้)
      try {
        // ตรวจสอบว่ามีบิลที่ยังไม่ส่งหรือไม่
        const unsentResult = await ipcRenderer.invoke('sync:getUnsentCount');
        
        if (unsentResult.success && unsentResult.data > 0) {
          // มีบิลที่ยังไม่ส่ง → ลอง sync
          const syncResult = await ipcRenderer.invoke('sync:push');
          
          if (syncResult.success) {
            alert(
              t('shift.endSuccess') + '\n\n' +
              t('shift.syncSuccess') + ': ' + syncResult.data.transactionsSent + ' ' + t('shift.bills')
            );
          } else {
            // Sync ล้มเหลว (อาจจะเน็ตขัดข้อง)
            alert(
              t('shift.endSuccess') + '\n\n' +
              t('shift.syncFailed') + '\n' +
              t('shift.syncLater')
            );
          }
        } else {
          // ไม่มีบิลที่ต้องส่ง
          alert(t('shift.endSuccess'));
        }
      } catch (syncError) {
        // Sync error (เน็ตขัดข้อง)
        console.error('Sync error:', syncError);
        alert(
          t('shift.endSuccess') + '\n\n' +
          t('shift.syncFailed') + '\n' +
          t('shift.syncLater')
        );
      }

      await loadCurrentShift();
      setClosingCash('0');
      onClose();
    } catch (error) {
      console.error('Error ending shift:', error);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b bg-indigo-600 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold">{t('shift.title')}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {!currentShift ? (
            /* Start Shift */
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🕐</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {t('shift.noActiveShift')}
                </h3>
                <p className="text-gray-600">{t('shift.startShiftPrompt')}</p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  {t('shift.openingCash')}
                </label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-4 py-3 text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  step="0.01"
                  min="0"
                  autoFocus
                />
              </div>

              <button
                onClick={handleStartShift}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {loading ? t('common.loading') : `▶️ ${t('shift.startShift')}`}
              </button>
            </div>
          ) : (
            /* End Shift */
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-600">{t('shift.shiftNumber')}</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {currentShift.shiftNumber}
                    </div>
                  </div>
                  <div className="text-green-600 text-4xl">✓</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">{t('shift.startTime')}</div>
                    <div className="font-semibold">
                      {new Date(currentShift.startTime).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">{t('shift.openingCash')}</div>
                    <div className="font-semibold">
                      {Math.round(parseFloat(String(currentShift.openingCash))).toLocaleString('th-TH')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  {t('shift.closingCash')}
                </label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="w-full px-4 py-3 text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  💡 {t('shift.autoSyncNote')}
                </p>
              </div>

              <button
                onClick={handleEndShift}
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {loading ? t('common.loading') : `⏹️ ${t('shift.endShift')}`}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
