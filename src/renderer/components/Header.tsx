import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import Settings from './Settings';
import ShiftManager from './ShiftManager';

const { ipcRenderer } = window.require('electron');

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [unsentCount, setUnsentCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShiftManager, setShowShiftManager] = useState(false);

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const countResult = await ipcRenderer.invoke('sync:getUnsentCount');
      if (countResult.success) {
        setUnsentCount(countResult.data);
      }

      const timeResult = await ipcRenderer.invoke('sync:getLastSyncTime');
      if (timeResult.success && timeResult.data) {
        setLastSyncTime(new Date(timeResult.data));
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleSyncPull = async () => {
    setIsSyncing(true);
    try {
      const result = await ipcRenderer.invoke('sync:pull');
      if (result.success) {
        alert(`ดึงข้อมูลสำเร็จ!\nสินค้า: ${result.data.productsUpdated}\nลูกค้า: ${result.data.customersUpdated}\nพนักงาน: ${result.data.employeesUpdated}\nบัญชีธนาคาร: ${result.data.banksUpdated}`);
        await loadSyncStatus();
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPush = async () => {
    if (unsentCount === 0) {
      alert('ไม่มีข้อมูลขายที่ต้องส่ง');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await ipcRenderer.invoke('sync:push');
      if (result.success) {
        alert(`ส่งข้อมูลสำเร็จ!\nจำนวนบิล: ${result.data.transactionsSent}`);
        await loadSyncStatus();
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">ระบบ POS</h1>
            <div className="text-sm">
              {lastSyncTime && (
                <span className="opacity-75">
                  Sync ล่าสุด: {lastSyncTime.toLocaleString('th-TH')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSwitcher />

            {unsentCount > 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {t('sync.unsent')}: {unsentCount}
              </div>
            )}

            <button
              onClick={handleSyncPull}
              disabled={isSyncing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold transition"
            >
              {isSyncing ? t('sync.syncing') : `⬇ ${t('sync.pull')}`}
            </button>

            <button
              onClick={handleSyncPush}
              disabled={isSyncing || unsentCount === 0}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold transition"
            >
              {isSyncing ? t('sync.syncing') : `⬆ ${t('sync.push')}`}
            </button>

            <button
              onClick={() => setShowShiftManager(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold transition"
              title={t('shift.title')}
            >
              🕐
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-semibold transition"
              title={t('settings.title')}
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ShiftManager isOpen={showShiftManager} onClose={() => setShowShiftManager(false)} />
    </header>
  );
};

export default Header;
