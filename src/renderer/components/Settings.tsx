import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const { ipcRenderer } = window.require('electron');

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [terminalId, setTerminalId] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [vatRate, setVatRate] = useState('7');
  const [vatType, setVatType] = useState<'INCLUSIVE' | 'EXCLUSIVE'>('INCLUSIVE');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const terminalResult = await ipcRenderer.invoke('config:get', 'terminal_id');
      const apiUrlResult = await ipcRenderer.invoke('config:get', 'api_base_url');
      const apiKeyResult = await ipcRenderer.invoke('config:get', 'api_key');
      const vatRateResult = await ipcRenderer.invoke('config:get', 'vat_rate');
      const vatTypeResult = await ipcRenderer.invoke('config:get', 'vat_type');

      if (terminalResult.success && terminalResult.data) setTerminalId(terminalResult.data);
      if (apiUrlResult.success && apiUrlResult.data) setApiBaseUrl(apiUrlResult.data);
      if (apiKeyResult.success && apiKeyResult.data) setApiKey(apiKeyResult.data);
      if (vatRateResult.success && vatRateResult.data) setVatRate(vatRateResult.data);
      if (vatTypeResult.success && vatTypeResult.data) setVatType(vatTypeResult.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all settings
      await ipcRenderer.invoke('config:set', {
        key: 'terminal_id',
        value: terminalId,
        description: 'Terminal ID',
      });

      await ipcRenderer.invoke('config:set', {
        key: 'api_base_url',
        value: apiBaseUrl,
        description: 'API Base URL',
      });

      await ipcRenderer.invoke('config:set', {
        key: 'api_key',
        value: apiKey,
        description: 'API Key',
      });

      await ipcRenderer.invoke('config:set', {
        key: 'vat_rate',
        value: vatRate,
        description: 'VAT Rate',
      });

      await ipcRenderer.invoke('config:set', {
        key: 'vat_type',
        value: vatType,
        description: 'VAT Type',
      });

      // Configure API client
      if (apiBaseUrl && apiKey && terminalId) {
        await ipcRenderer.invoke('api:configure', {
          baseURL: apiBaseUrl,
          apiKey: apiKey,
          terminalId: terminalId,
        });
      }

      alert(t('settings.saveSuccess'));
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await ipcRenderer.invoke('api:testConnection');
      if (result.success && result.data) {
        alert(t('settings.connectionSuccess'));
      } else {
        alert(t('settings.connectionFailed'));
      }
    } catch (error) {
      alert(t('settings.connectionFailed'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gray-800 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Language Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('settings.language')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: 'th', name: 'ไทย', flag: '🇹🇭' },
                { code: 'en', name: 'English', flag: '🇬🇧' },
                { code: 'lo', name: 'ລາວ', flag: '🇱🇦' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    i18n.language === lang.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{lang.flag}</div>
                  <div className="font-medium">{lang.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('settings.terminal')}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terminal ID
              </label>
              <input
                type="text"
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="POS-01"
              />
            </div>
          </div>

          {/* Server Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('settings.server')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={handleTestConnection}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                {t('settings.testConnection')}
              </button>
            </div>
          </div>

          {/* VAT Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('settings.vat')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.vatRate')} (%)
                </label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.vatType')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVatType('INCLUSIVE')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      vatType === 'INCLUSIVE'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t('sales.inclusive')}
                  </button>
                  <button
                    onClick={() => setVatType('EXCLUSIVE')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      vatType === 'EXCLUSIVE'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t('sales.exclusive')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
