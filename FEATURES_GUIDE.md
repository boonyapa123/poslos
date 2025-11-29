# คู่มือฟีเจอร์ระบบ POS

## 1. การพิมพ์ใบเสร็จ (Print Receipt)

### สถานะปัจจุบัน
✅ มี PrinterService พร้อมใช้งาน แต่ยังไม่ได้ติดตั้ง printer library

### วิธีใช้งาน

#### ติดตั้ง Library
```bash
npm install electron-pos-printer
```

#### เรียกใช้งานใน Code
```typescript
import PrinterService from './services/PrinterService';

const printerService = PrinterService.getInstance();

// พิมพ์ใบเสร็จ
await printerService.printReceipt({
  transactionNumber: 'POS-2024-001',
  transactionDate: new Date(),
  customerName: 'ลูกค้าทั่วไป',
  items: [
    {
      productName: 'สินค้า A',
      unitName: 'ชิ้น',
      quantity: 2,
      unitPrice: 100,
      lineTotal: 200
    }
  ],
  subtotal: 200,
  vatAmount: 14,
  vatRate: 7,
  grandTotal: 214,
  paymentMethod: 'CASH',
  amountReceived: 500,
  change: 286
});

// พิมพ์ใบเสร็จซ้ำ (ใบเสร็จล่าสุด)
await printerService.reprintLastReceipt();
```

#### ตำแหน่งไฟล์
- **Service**: `src/services/PrinterService.ts`
- **Interface**: `ReceiptData` ใน PrinterService.ts

### การปรับแต่ง

แก้ไขไฟล์ `src/services/PrinterService.ts`:

```typescript
public async printReceipt(data: ReceiptData): Promise<boolean> {
  try {
    const { PosPrinter } = require('electron-pos-printer');
    
    const options = {
      preview: false,               // แสดง preview หรือไม่
      width: '80mm',               // ความกว้างกระดาษ
      margin: '0 0 0 0',           // ขอบกระดาษ
      copies: 1,                   // จำนวนสำเนา
      printerName: 'POS-80',       // ชื่อเครื่องพิมพ์
      timeOutPerLine: 400,
      silent: true
    };

    const data = [
      {
        type: 'text',
        value: 'ใบเสร็จรับเงิน',
        style: { textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }
      },
      // ... เพิ่มข้อมูลอื่นๆ
    ];

    PosPrinter.print(data, options);
    return true;
  } catch (error) {
    console.error('Error printing:', error);
    return false;
  }
}
```

---

## 2. ดูรายการที่ยังไม่ส่ง (Unsent Transactions)

### วิธีดูรายการที่ยังไม่ส่ง

#### ใน Code
```typescript
import SyncManager from './services/SyncManager';

const syncManager = SyncManager.getInstance();

// ดึงรายการที่ยังไม่ส่ง
const unsentTransactions = await syncManager.getUnsentTransactions();

console.log(`มี ${unsentTransactions.length} รายการที่ยังไม่ส่ง`);

unsentTransactions.forEach(transaction => {
  console.log(`- ${transaction.transactionNumber}: ${transaction.grandTotal} บาท`);
});
```

#### Query Database โดยตรง
```sql
-- ดูรายการที่ยังไม่ส่ง
SELECT 
  transactionNumber,
  transactionDate,
  grandTotal,
  paymentMethod,
  status
FROM transactions
WHERE isSynced = 0 
  AND status = 'COMPLETED'
ORDER BY transactionDate ASC;

-- นับจำนวน
SELECT COUNT(*) as unsent_count
FROM transactions
WHERE isSynced = 0 AND status = 'COMPLETED';
```

#### เพิ่ม IPC Handler สำหรับ UI

แก้ไขไฟล์ `src/main/ipcHandlers.ts`:

```typescript
import SyncManager from '../services/SyncManager';

export function setupIpcHandlers() {
  // ... existing handlers ...

  // ดูรายการที่ยังไม่ส่ง
  ipcMain.handle('sync:getUnsent', async () => {
    try {
      const syncManager = SyncManager.getInstance();
      const transactions = await syncManager.getUnsentTransactions();
      
      return {
        success: true,
        count: transactions.length,
        transactions: transactions.map(t => ({
          id: t.id,
          transactionNumber: t.transactionNumber,
          transactionDate: t.transactionDate,
          grandTotal: t.grandTotal,
          paymentMethod: t.paymentMethod,
          status: t.status
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  });

  // ส่งข้อมูลขึ้น server
  ipcMain.handle('sync:sendToServer', async () => {
    try {
      const syncManager = SyncManager.getInstance();
      const result = await syncManager.sendSalesToServer();
      return result;
    } catch (error) {
      return {
        success: false,
        transactionsSent: 0,
        errors: [String(error)]
      };
    }
  });
}
```

#### เรียกใช้จาก Renderer (React)

```typescript
// ดูรายการที่ยังไม่ส่ง
const result = await window.electron.ipcRenderer.invoke('sync:getUnsent');
if (result.success) {
  console.log(`มี ${result.count} รายการที่ยังไม่ส่ง`);
  console.log(result.transactions);
}

// ส่งข้อมูลขึ้น server
const syncResult = await window.electron.ipcRenderer.invoke('sync:sendToServer');
if (syncResult.success) {
  console.log(`ส่งสำเร็จ ${syncResult.transactionsSent} รายการ`);
} else {
  console.error('ส่งไม่สำเร็จ:', syncResult.errors);
}
```

---

## 3. การตั้งค่า Database กลาง (Server Configuration)

### ตำแหน่งการตั้งค่า

การตั้งค่าเก็บในตาราง `configurations`:

| Key | Value | Description |
|-----|-------|-------------|
| `api_base_url` | `https://api.example.com` | URL ของ API server |
| `api_key` | `your-api-key` | API Key สำหรับ authentication |
| `terminal_id` | `BRANCH-01` | รหัสเครื่อง POS |

### วิธีแก้ไขการตั้งค่า

#### 1. ผ่าน Code

แก้ไขไฟล์ `src/main/ipcHandlers.ts`:

```typescript
import Configuration from '../models/Configuration';
import APIClient from '../services/APIClient';

export function setupIpcHandlers() {
  // ... existing handlers ...

  // บันทึกการตั้งค่า API
  ipcMain.handle('config:saveApi', async (event, config: {
    baseUrl: string;
    apiKey: string;
    terminalId: string;
  }) => {
    try {
      // บันทึกลง database
      await Configuration.upsert({
        key: 'api_base_url',
        value: config.baseUrl,
        description: 'API Server URL'
      });

      await Configuration.upsert({
        key: 'api_key',
        value: config.apiKey,
        description: 'API Authentication Key'
      });

      await Configuration.upsert({
        key: 'terminal_id',
        value: config.terminalId,
        description: 'Terminal/Branch ID'
      });

      // อัพเดท APIClient
      const apiClient = APIClient.getInstance();
      apiClient.configure(config.baseUrl, config.apiKey, config.terminalId);

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ดึงการตั้งค่า API
  ipcMain.handle('config:getApi', async () => {
    try {
      const baseUrl = await Configuration.findByPk('api_base_url');
      const apiKey = await Configuration.findByPk('api_key');
      const terminalId = await Configuration.findByPk('terminal_id');

      return {
        success: true,
        config: {
          baseUrl: baseUrl?.value || '',
          apiKey: apiKey?.value || '',
          terminalId: terminalId?.value || ''
        }
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ทดสอบการเชื่อมต่อ
  ipcMain.handle('config:testConnection', async () => {
    try {
      const apiClient = APIClient.getInstance();
      const isConnected = await apiClient.testConnection();
      return { success: isConnected };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
```

#### 2. ผ่าน UI (Settings Page)

สร้างหน้า Settings ใน React:

```typescript
// src/renderer/components/Settings.tsx
import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [config, setConfig] = useState({
    baseUrl: '',
    apiKey: '',
    terminalId: ''
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const result = await window.electron.ipcRenderer.invoke('config:getApi');
    if (result.success) {
      setConfig(result.config);
    }
  };

  const handleSave = async () => {
    const result = await window.electron.ipcRenderer.invoke('config:saveApi', config);
    if (result.success) {
      alert('บันทึกสำเร็จ');
    } else {
      alert('บันทึกไม่สำเร็จ: ' + result.error);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    const result = await window.electron.ipcRenderer.invoke('config:testConnection');
    setTesting(false);
    
    if (result.success) {
      alert('เชื่อมต่อสำเร็จ');
    } else {
      alert('เชื่อมต่อไม่สำเร็จ: ' + result.error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">ตั้งค่า Server</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">API Server URL</label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
            placeholder="https://api.example.com"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({...config, apiKey: e.target.value})}
            placeholder="your-api-key"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Terminal ID</label>
          <input
            type="text"
            value={config.terminalId}
            onChange={(e) => setConfig({...config, terminalId: e.target.value})}
            placeholder="BRANCH-01"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            บันทึก
          </button>
          
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 3. ผ่าน Database โดยตรง

```sql
-- ตั้งค่า API Server
INSERT OR REPLACE INTO configurations (key, value, description, updatedAt)
VALUES 
  ('api_base_url', 'https://api.example.com', 'API Server URL', datetime('now')),
  ('api_key', 'your-api-key-here', 'API Authentication Key', datetime('now')),
  ('terminal_id', 'BRANCH-01', 'Terminal/Branch ID', datetime('now'));

-- ดูการตั้งค่าปัจจุบัน
SELECT * FROM configurations 
WHERE key IN ('api_base_url', 'api_key', 'terminal_id');
```

---

## สรุปไฟล์ที่เกี่ยวข้อง

### Services
- `src/services/PrinterService.ts` - การพิมพ์ใบเสร็จ
- `src/services/SyncManager.ts` - การ sync ข้อมูล
- `src/services/APIClient.ts` - เชื่อมต่อ API server

### Models
- `src/models/Configuration.ts` - การตั้งค่าระบบ
- `src/models/Transaction.ts` - ธุรกรรมการขาย
- `src/models/SyncLog.ts` - Log การ sync

### IPC Handlers
- `src/main/ipcHandlers.ts` - จัดการ IPC communication
- `src/main/main.ts` - โหลดการตั้งค่า API

---

## ขั้นตอนการใช้งานจริง

### 1. ตั้งค่า Server ครั้งแรก
```typescript
// ใน Settings page
await window.electron.ipcRenderer.invoke('config:saveApi', {
  baseUrl: 'https://your-server.com/api',
  apiKey: 'your-secret-key',
  terminalId: 'BRANCH-01'
});
```

### 2. ทดสอบการเชื่อมต่อ
```typescript
const result = await window.electron.ipcRenderer.invoke('config:testConnection');
```

### 3. ดูรายการที่ยังไม่ส่ง
```typescript
const unsent = await window.electron.ipcRenderer.invoke('sync:getUnsent');
console.log(`มี ${unsent.count} รายการรอส่ง`);
```

### 4. ส่งข้อมูลขึ้น Server
```typescript
const result = await window.electron.ipcRenderer.invoke('sync:sendToServer');
if (result.success) {
  alert(`ส่งสำเร็จ ${result.transactionsSent} รายการ`);
}
```

### 5. พิมพ์ใบเสร็จ
```typescript
// หลังจากบันทึกการขาย
await printerService.printReceipt(receiptData);
```
