# 🔄 คู่มือการ Sync กับ Server

## 📋 ภาพรวมการทำงาน

### ระบบ Sync มี 2 ทิศทาง:

```
┌─────────────────────────────────────────────┐
│           Server (API)                      │
│  - Products (สินค้า)                        │
│  - Customers (ลูกค้า)                       │
│  - Employees (พนักงาน)                      │
│  - Bank Accounts (บัญชีธนาคาร)              │
└──────────┬──────────────────────┬───────────┘
           │                      │
    ⬇ PULL (ดึงข้อมูล)    ⬆ PUSH (ส่งข้อมูล)
           │                      │
┌──────────▼──────────────────────▼───────────┐
│           POS Terminal                      │
│  - Local Database (SQLite)                  │
│  - Transactions (บิลขาย)                    │
└─────────────────────────────────────────────┘
```

---

## 🔽 PULL: ดึงข้อมูลจาก Server

### ข้อมูลที่ดึง (Master Data):
1. **Products** - สินค้า, ราคา, หน่วย
2. **Customers** - ลูกค้า, ระดับราคา
3. **Employees** - พนักงาน
4. **Bank Accounts** - บัญชีธนาคาร

### วิธีการทำงาน:

```typescript
// 1. เรียก API
GET /products
GET /customers
GET /employees
GET /bank-accounts

// 2. รับข้อมูล JSON
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "100001",
      "name": "สินค้า A",
      "prices": [...]
    }
  ]
}

// 3. Upsert เข้า Local Database
await Product.upsert({
  id: data.id,
  sku: data.sku,
  name: data.name,
  syncedAt: new Date()
});
```

### เมื่อไหร่ที่ PULL:
- ✅ เปิดโปรแกรมครั้งแรก
- ✅ คลิกปุ่ม "⬇ ดึงข้อมูล"
- ✅ Auto sync ทุก 5-10 นาที (ถ้าตั้งค่าไว้)
- ✅ เมื่อมีการแจ้งเตือนว่ามีข้อมูลใหม่

---

## 🔼 PUSH: ส่งข้อมูลขึ้น Server

### ข้อมูลที่ส่ง (Transaction Data):
1. **Transactions** - บิลขาย (DOCINFO)
2. **Transaction Items** - รายการสินค้าในบิล (SKUMOVE)

### วิธีการทำงาน:

```typescript
// 1. ดึง transactions ที่ยังไม่ sync
const unsent = await Transaction.findAll({
  where: { isSynced: false, status: 'COMPLETED' }
});

// 2. แปลงเป็นรูปแบบ DOCINFO + SKUMOVE (ตาม Excel)
const docInfos = [
  {
    DI_DATE: 45234,              // Excel date number
    DI_BRANCH: "POS-01",         // Terminal ID
    DI_REF: "POS-01-20251117-001", // Transaction number
    DI_AMOUNT: 100000,           // Amount in satang (1000.00 THB)
    DI_PM_BY: "Cash",            // Payment method
    DI_Ccy: "K"                  // Currency (K = THB)
  }
];

const skuMoves = [
  {
    SKM_DATE: 45234,
    DI_REF: "POS-01-20251117-001",
    SKU_CODE: "100001",
    QTY: 2,
    SKM_PRC: 50000,              // Price in satang
    SKM_AMOUNT: 100000,          // Total in satang
    AR_CODE: "54787"             // Customer code
  }
];

// 3. ส่งไปยัง Server
POST /sync/sales
{
  "docInfo": docInfos,
  "skuMove": skuMoves
}

// 4. Mark as synced
transaction.isSynced = true;
transaction.syncedAt = new Date();
await transaction.save();
```

### เมื่อไหร่ที่ PUSH:
- ✅ คลิกปุ่ม "⬆ ส่งข้อมูล"
- ✅ Auto sync ทุก 10-15 นาที (ถ้าตั้งค่าไว้)
- ✅ ปิดกะ (End of Shift)
- ✅ ปิดโปรแกรม

---

## ⚙️ การตั้งค่า Server

### 1. ตั้งค่าใน Settings

```typescript
// ใน UI Settings
{
  "apiBaseUrl": "https://api.yourcompany.com",
  "apiKey": "your-api-key-here",
  "terminalId": "POS-01"
}
```

### 2. บันทึกลง Database

```typescript
// Configuration table
await Configuration.upsert({ key: 'api_base_url', value: 'https://api.yourcompany.com' });
await Configuration.upsert({ key: 'api_key', value: 'your-api-key' });
await Configuration.upsert({ key: 'terminal_id', value: 'POS-01' });
```

### 3. Configure APIClient

```typescript
// src/main/main.ts
const apiClient = APIClient.getInstance();
apiClient.configure(
  'https://api.yourcompany.com',
  'your-api-key',
  'POS-01'
);
```

---

## 🔧 วิธีเปลี่ยนเป็น Server จริง

### ขั้นตอนที่ 1: เตรียม Server API

#### Option A: ใช้ Server ที่มีอยู่แล้ว

ถ้าคุณมี Server API อยู่แล้ว ให้ตรวจสอบว่ามี endpoints เหล่านี้:

```
GET  /health                 - Health check
GET  /products               - ดึงสินค้าทั้งหมด
GET  /customers              - ดึงลูกค้าทั้งหมด
GET  /employees              - ดึงพนักงานทั้งหมด
GET  /bank-accounts          - ดึงบัญชีธนาคาร
POST /sync/sales             - รับข้อมูลการขาย (DOCINFO + SKUMOVE)
```

#### Option B: สร้าง Server ใหม่

ดูคู่มือ `SYNC_FROM_SERVER_GUIDE.md` สำหรับวิธีสร้าง Server

### ขั้นตอนที่ 2: แก้ไข Configuration

#### 2.1 สร้าง UI Settings

```typescript
// src/renderer/components/Settings.tsx
import React, { useState } from 'react';

export function Settings() {
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [terminalId, setTerminalId] = useState('');

  const handleSave = async () => {
    // Save to database
    await window.electron.saveConfiguration({
      api_base_url: apiBaseUrl,
      api_key: apiKey,
      terminal_id: terminalId
    });

    // Configure API client
    await window.electron.configureAPI(apiBaseUrl, apiKey, terminalId);

    alert('บันทึกการตั้งค่าสำเร็จ');
  };

  const handleTest = async () => {
    const isConnected = await window.electron.testConnection();
    if (isConnected) {
      alert('✅ เชื่อมต่อสำเร็จ');
    } else {
      alert('❌ เชื่อมต่อไม่สำเร็จ');
    }
  };

  return (
    <div className="settings">
      <h2>⚙️ ตั้งค่า API Server</h2>

      <div className="form-group">
        <label>API Base URL:</label>
        <input
          type="text"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
          placeholder="https://api.yourcompany.com"
        />
      </div>

      <div className="form-group">
        <label>API Key:</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="your-api-key"
        />
      </div>

      <div className="form-group">
        <label>Terminal ID:</label>
        <input
          type="text"
          value={terminalId}
          onChange={(e) => setTerminalId(e.target.value)}
          placeholder="POS-01"
        />
      </div>

      <div className="buttons">
        <button onClick={handleTest}>ทดสอบการเชื่อมต่อ</button>
        <button onClick={handleSave}>บันทึก</button>
      </div>
    </div>
  );
}
```

#### 2.2 เพิ่ม IPC Handlers

```typescript
// src/main/ipcHandlers.ts
import { ipcMain } from 'electron';
import APIClient from '../services/APIClient';
import Configuration from '../models/Configuration';

export function setupIpcHandlers() {
  // Save configuration
  ipcMain.handle('save-configuration', async (event, config) => {
    try {
      for (const [key, value] of Object.entries(config)) {
        await Configuration.upsert({ key, value: String(value) });
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Configure API client
  ipcMain.handle('configure-api', async (event, baseURL, apiKey, terminalId) => {
    try {
      const apiClient = APIClient.getInstance();
      apiClient.configure(baseURL, apiKey, terminalId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Test connection
  ipcMain.handle('test-connection', async () => {
    try {
      const apiClient = APIClient.getInstance();
      const isConnected = await apiClient.testConnection();
      return isConnected;
    } catch (error) {
      return false;
    }
  });

  // Sync from server
  ipcMain.handle('sync-from-server', async () => {
    try {
      const syncManager = SyncManager.getInstance();
      const result = await syncManager.syncFromServer();
      return result;
    } catch (error) {
      return { success: false, errors: [String(error)] };
    }
  });

  // Send to server
  ipcMain.handle('send-to-server', async () => {
    try {
      const syncManager = SyncManager.getInstance();
      const result = await syncManager.sendSalesToServer();
      return result;
    } catch (error) {
      return { success: false, errors: [String(error)] };
    }
  });
}
```

#### 2.3 เพิ่ม Preload Script

```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  saveConfiguration: (config: any) => ipcRenderer.invoke('save-configuration', config),
  configureAPI: (baseURL: string, apiKey: string, terminalId: string) =>
    ipcRenderer.invoke('configure-api', baseURL, apiKey, terminalId),
  testConnection: () => ipcRenderer.invoke('test-connection'),
  syncFromServer: () => ipcRenderer.invoke('sync-from-server'),
  sendToServer: () => ipcRenderer.invoke('send-to-server'),
});
```

### ขั้นตอนที่ 3: ทดสอบ

#### 3.1 ทดสอบ Health Check

```bash
curl https://api.yourcompany.com/health
```

ควรได้:
```json
{
  "success": true,
  "message": "OK"
}
```

#### 3.2 ทดสอบ Pull Data

```bash
curl -H "X-API-Key: your-api-key" \
     -H "X-Terminal-ID: POS-01" \
     https://api.yourcompany.com/products
```

#### 3.3 ทดสอบ Push Data

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -H "X-Terminal-ID: POS-01" \
     -d '{"docInfo":[...],"skuMove":[...]}' \
     https://api.yourcompany.com/sync/sales
```

---

## 🔐 Security

### 1. HTTPS Only
```typescript
// ✅ Good
apiBaseUrl: "https://api.yourcompany.com"

// ❌ Bad
apiBaseUrl: "http://api.yourcompany.com"
```

### 2. API Key
```typescript
// Generate secure API key
const apiKey = crypto.randomBytes(32).toString('hex');

// Store securely (ไม่ hardcode ในโค้ด)
await Configuration.upsert({ key: 'api_key', value: apiKey });
```

### 3. Rate Limiting
```typescript
// Server side
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each terminal to 100 requests per windowMs
}));
```

---

## 📊 Monitoring

### 1. Sync Logs

```typescript
// ดู sync history
const logs = await SyncLog.findAll({
  order: [['startTime', 'DESC']],
  limit: 10
});

logs.forEach(log => {
  console.log(`${log.type} - ${log.status} - ${log.recordsAffected} records`);
});
```

### 2. Unsent Transactions

```typescript
// ดูจำนวนบิลที่ยังไม่ sync
const unsentCount = await Transaction.count({
  where: { isSynced: false, status: 'COMPLETED' }
});

console.log(`Unsent transactions: ${unsentCount}`);
```

---

## 🚨 Error Handling

### 1. Network Error

```typescript
try {
  await syncManager.syncFromServer();
} catch (error) {
  if (error.code === 'ENOTFOUND') {
    alert('❌ ไม่สามารถเชื่อมต่อ Server ได้\nกรุณาตรวจสอบ internet');
  } else if (error.code === 'ETIMEDOUT') {
    alert('❌ การเชื่อมต่อหมดเวลา\nกรุณาลองใหม่อีกครั้ง');
  }
}
```

### 2. Authentication Error

```typescript
if (error.response?.status === 401) {
  alert('❌ API Key ไม่ถูกต้อง\nกรุณาตรวจสอบการตั้งค่า');
}
```

### 3. Retry Logic

```typescript
async function syncWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncManager.syncFromServer();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 📝 ตัวอย่างการใช้งาน

### ในโค้ด:

```typescript
// 1. Configure API (ทำครั้งเดียวตอนเปิดโปรแกรม)
const apiClient = APIClient.getInstance();
apiClient.configure(
  'https://api.yourcompany.com',
  'your-api-key',
  'POS-01'
);

// 2. Pull data from server
const syncManager = SyncManager.getInstance();
const pullResult = await syncManager.syncFromServer();
console.log(`Updated: ${pullResult.productsUpdated} products`);

// 3. Push data to server
const pushResult = await syncManager.sendSalesToServer();
console.log(`Sent: ${pushResult.transactionsSent} transactions`);
```

### ใน UI:

```typescript
// ปุ่ม "⬇ ดึงข้อมูล"
<button onClick={async () => {
  setLoading(true);
  const result = await window.electron.syncFromServer();
  setLoading(false);
  
  if (result.success) {
    alert(`✅ ดึงข้อมูลสำเร็จ\n` +
          `สินค้า: ${result.productsUpdated}\n` +
          `ลูกค้า: ${result.customersUpdated}`);
  } else {
    alert(`❌ ดึงข้อมูลไม่สำเร็จ\n${result.errors.join('\n')}`);
  }
}}>
  ⬇ ดึงข้อมูล
</button>

// ปุ่ม "⬆ ส่งข้อมูล"
<button onClick={async () => {
  setLoading(true);
  const result = await window.electron.sendToServer();
  setLoading(false);
  
  if (result.success) {
    alert(`✅ ส่งข้อมูลสำเร็จ\nบิลขาย: ${result.transactionsSent}`);
  } else {
    alert(`❌ ส่งข้อมูลไม่สำเร็จ\n${result.errors.join('\n')}`);
  }
}}>
  ⬆ ส่งข้อมูล
</button>
```

---

## 🎯 Checklist การตั้งค่า

- [ ] มี Server API พร้อมใช้งาน
- [ ] มี HTTPS/SSL certificate
- [ ] สร้าง API Key สำหรับแต่ละ Terminal
- [ ] ตั้งค่า CORS (ถ้าจำเป็น)
- [ ] ทดสอบ endpoints ทั้งหมด
- [ ] สร้าง UI Settings ในโปรแกรม
- [ ] เพิ่ม IPC handlers
- [ ] ทดสอบ Pull data
- [ ] ทดสอบ Push data
- [ ] ตั้งค่า Auto sync (optional)
- [ ] ทดสอบ Error handling
- [ ] เตรียม User manual

---

**เอกสารนี้สร้างโดย:** Kiro AI Assistant  
**วันที่:** 17 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.0.0
