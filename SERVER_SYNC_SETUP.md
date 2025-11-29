# คู่มือตั้งค่าและส่งข้อมูลขึ้น Server

## ไฟล์ที่ต้องแก้ไข

### 1. ⚙️ **`src/services/APIClient.ts`** - ตั้งค่า URL และส่งข้อมูล

**หน้าที่**: จัดการการเชื่อมต่อกับ API Server

**ส่วนสำคัญ**:
```typescript
// บรรทัด 70-75: ตั้งค่า Server
public configure(baseURL: string, apiKey: string, terminalId: string): void {
  this.baseURL = baseURL;           // เช่น 'https://api.yourserver.com'
  this.apiKey = apiKey;             // API Key สำหรับ authentication
  this.terminalId = terminalId;     // รหัสเครื่อง POS
  this.axiosInstance.defaults.baseURL = baseURL;
}

// บรรทัด 77-84: ทดสอบการเชื่อมต่อ
public async testConnection(): Promise<boolean> {
  const response = await this.axiosInstance.get('/health');
  return response.data.success === true;
}

// บรรทัด 158-172: ส่งข้อมูลขาย (รูปแบบ DOCINFO + SKUMOVE)
public async sendTransactionsExcelFormat(docInfos: any[], skuMoves: any[]): Promise<void> {
  const response = await this.axiosInstance.post('/sync/sales', {
    docInfo: docInfos,    // ข้อมูล header ธุรกรรม
    skuMove: skuMoves,    // ข้อมูลรายการสินค้า
  });
}
```

**API Endpoints ที่ต้องมีใน Server**:
- `GET /health` - ทดสอบการเชื่อมต่อ
- `GET /products` - ดึงข้อมูลสินค้า
- `GET /customers` - ดึงข้อมูลลูกค้า
- `GET /employees` - ดึงข้อมูลพนักงาน
- `GET /bank-accounts` - ดึงข้อมูลบัญชีธนาคาร
- `POST /sync/sales` - ส่งข้อมูลการขาย

---

### 2. 🔄 **`src/services/SyncManager.ts`** - จัดการการ Sync

**หน้าที่**: จัดการการส่งและรับข้อมูลกับ Server

**ฟังก์ชันสำคัญ**:

```typescript
// บรรทัด 240-330: ส่งข้อมูลขาย
public async sendSalesToServer(): Promise<SendResult> {
  // 1. ดึงรายการที่ยังไม่ส่ง
  const unsentTransactions = await this.getUnsentTransactions();
  
  // 2. แปลงเป็นรูปแบบ DOCINFO + SKUMOVE
  const { docInfos, skuMoves } = await this.convertToExcelFormat(unsentTransactions);
  
  // 3. ส่งไปยัง Server
  await this.apiClient.sendTransactionsExcelFormat(docInfos, skuMoves);
  
  // 4. Mark เป็น synced
  for (const transaction of unsentTransactions) {
    transaction.isSynced = true;
    transaction.syncedAt = new Date();
    await transaction.save();
  }
}

// บรรทัด 332-340: ดูรายการที่ยังไม่ส่ง
public async getUnsentTransactions(): Promise<Transaction[]> {
  return await Transaction.findAll({
    where: {
      isSynced: false,      // ยังไม่ส่ง
      status: 'COMPLETED',  // สถานะสำเร็จ
    },
    order: [['transactionDate', 'ASC']],
  });
}

// บรรทัด 350-450: แปลงข้อมูลเป็นรูปแบบ Excel
private async convertToExcelFormat(transactions: Transaction[]): Promise<{
  docInfos: any[];
  skuMoves: any[];
}> {
  // แปลงเป็นรูปแบบที่ Server ต้องการ
  // ตามโครงสร้าง Excel ชีท DOCINFO และ SKUMOVE
}
```

**รูปแบบข้อมูลที่ส่ง**:

**DOCINFO** (Transaction Header):
```json
{
  "DI_DATE": 45000,                    // Excel date number
  "DI_BRANCH": "BRANCH-01",            // รหัสสาขา
  "DI_REF": "POS-2024-001",           // เลขที่ธุรกรรม
  "DI_CRE_BY": "EMP001",              // พนักงานขาย
  "DI_AMOUNT": 21400,                  // ยอดรวม (satang)
  "DI_PM_BY": "Cash",                  // วิธีชำระเงิน
  "DI_Ccy": "K",                       // สกุลเงิน (K=THB)
  "DI_DATE_TIME": "2024-11-25T10:30:00Z"
}
```

**SKUMOVE** (Transaction Items):
```json
{
  "SKM_DATE": 45000,                   // Excel date number
  "SKM_BCH": "BRANCH-01",              // รหัสสาขา
  "DI_REF": "POS-2024-001",           // เลขที่ธุรกรรม
  "SKM_No": 1,                         // ลำดับรายการ
  "SKU_CODE": "100001",                // รหัสสินค้า
  "GOODS_CODE": "100001",              // รหัสซื้อขาย
  "UTQ_NAME": "ชิ้น",                  // หน่วย
  "UTQ_QTY": 1,                        // อัตราแปลง
  "QTY": 2,                            // จำนวน
  "SKM_PRC": 10000,                    // ราคา (satang)
  "SKM_AMOUNT": 20000,                 // ยอดรวม (satang)
  "SKM_Ccy": "K",                      // สกุลเงิน
  "WL_KEY": 1,                         // คลังสินค้า
  "AR_CODE": "CUST001",                // รหัสลูกค้า
  "CRE_BY": "EMP001",                  // พนักงานขาย
  "SKM_DATE_TIME": "2024-11-25T10:30:00Z"
}
```

---

### 3. 🗄️ **`src/models/Configuration.ts`** - เก็บการตั้งค่า

**หน้าที่**: เก็บการตั้งค่าใน Database

**โครงสร้างตาราง `configurations`**:
```sql
CREATE TABLE configurations (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updatedAt DATETIME
);
```

**การตั้งค่าที่จำเป็น**:
```sql
INSERT INTO configurations (key, value, description) VALUES
  ('api_base_url', 'https://api.yourserver.com', 'API Server URL'),
  ('api_key', 'your-secret-api-key', 'API Authentication Key'),
  ('terminal_id', 'BRANCH-01', 'Terminal/Branch ID');
```

---

### 4. 🔌 **`src/main/ipcHandlers.ts`** - เชื่อมต่อ UI กับ Backend

**หน้าที่**: จัดการคำสั่งจาก UI

**ต้องเพิ่ม Handlers เหล่านี้**:

```typescript
import { ipcMain } from 'electron';
import Configuration from '../models/Configuration';
import APIClient from '../services/APIClient';
import SyncManager from '../services/SyncManager';

export function setupIpcHandlers() {
  // ... existing handlers ...

  // ========================================
  // Configuration Handlers
  // ========================================
  
  // บันทึกการตั้งค่า API
  ipcMain.handle('config:saveApi', async (event, config: {
    baseUrl: string;
    apiKey: string;
    terminalId: string;
  }) => {
    try {
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

  // ========================================
  // Sync Handlers
  // ========================================
  
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
      return { success: false, error: String(error) };
    }
  });

  // ส่งข้อมูลขึ้น Server
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

  // ดึงข้อมูลจาก Server
  ipcMain.handle('sync:pullFromServer', async () => {
    try {
      const syncManager = SyncManager.getInstance();
      const result = await syncManager.syncFromServer();
      return result;
    } catch (error) {
      return {
        success: false,
        errors: [String(error)]
      };
    }
  });
}
```

---

### 5. 🖥️ **`src/main/main.ts`** - โหลดการตั้งค่าตอนเริ่ม

**หน้าที่**: โหลดการตั้งค่า API เมื่อเปิดโปรแกรม

**ฟังก์ชันที่มีอยู่แล้ว** (บรรทัด 165-180):
```typescript
async function loadApiConfiguration() {
  try {
    const apiClient = APIClient.getInstance();
    
    const baseURLConfig = await Configuration.findByPk('api_base_url');
    const apiKeyConfig = await Configuration.findByPk('api_key');
    const terminalIdConfig = await Configuration.findByPk('terminal_id');
    
    if (baseURLConfig && apiKeyConfig && terminalIdConfig) {
      apiClient.configure(
        baseURLConfig.value,
        apiKeyConfig.value,
        terminalIdConfig.value
      );
      console.log('API client configured from database');
    } else {
      console.log('API configuration not found, please configure in settings');
    }
  } catch (error) {
    console.error('Error loading API configuration:', error);
  }
}
```

---

## วิธีใช้งาน

### 1. ตั้งค่า Server ครั้งแรก

#### วิธีที่ 1: ผ่าน Database โดยตรง
```bash
sqlite3 ~/Library/Application\ Support/poslos/pos.db
```

```sql
INSERT OR REPLACE INTO configurations (key, value, description, updatedAt) VALUES
  ('api_base_url', 'https://api.yourserver.com', 'API Server URL', datetime('now')),
  ('api_key', 'your-secret-key-here', 'API Authentication Key', datetime('now')),
  ('terminal_id', 'BRANCH-01', 'Terminal/Branch ID', datetime('now'));
```

#### วิธีที่ 2: ผ่าน UI (ต้องสร้างหน้า Settings ก่อน)
```typescript
// ใน Settings component
await window.electron.ipcRenderer.invoke('config:saveApi', {
  baseUrl: 'https://api.yourserver.com',
  apiKey: 'your-secret-key',
  terminalId: 'BRANCH-01'
});
```

### 2. ทดสอบการเชื่อมต่อ
```typescript
const result = await window.electron.ipcRenderer.invoke('config:testConnection');
if (result.success) {
  console.log('✅ เชื่อมต่อสำเร็จ');
} else {
  console.log('❌ เชื่อมต่อไม่สำเร็จ');
}
```

### 3. ดูรายการที่ยังไม่ส่ง
```typescript
const result = await window.electron.ipcRenderer.invoke('sync:getUnsent');
console.log(`มี ${result.count} รายการรอส่ง`);
```

### 4. ส่งข้อมูลขึ้น Server
```typescript
const result = await window.electron.ipcRenderer.invoke('sync:sendToServer');
if (result.success) {
  console.log(`✅ ส่งสำเร็จ ${result.transactionsSent} รายการ`);
} else {
  console.log('❌ ส่งไม่สำเร็จ:', result.errors);
}
```

---

## สรุปไฟล์ที่ต้องแก้

| ไฟล์ | หน้าที่ | ต้องแก้ไข |
|------|---------|-----------|
| `src/services/APIClient.ts` | ตั้งค่า URL และส่งข้อมูล | ✅ พร้อมใช้ |
| `src/services/SyncManager.ts` | จัดการ Sync | ✅ พร้อมใช้ |
| `src/models/Configuration.ts` | เก็บการตั้งค่า | ✅ พร้อมใช้ |
| `src/main/ipcHandlers.ts` | เชื่อมต่อ UI | ⚠️ ต้องเพิ่ม handlers |
| `src/main/main.ts` | โหลดการตั้งค่า | ✅ มีอยู่แล้ว |

---

## ข้อมูลเพิ่มเติม

### Format ข้อมูลที่ส่ง
- ใช้รูปแบบ **DOCINFO + SKUMOVE** (ตามโครงสร้าง Excel)
- ราคาเป็น **satang** (คูณ 100)
- วันที่เป็น **Excel date number**
- สกุลเงิน: **K** = THB (บาท)

### การ Debug
```typescript
// ดู URL ที่ตั้งค่า
const apiClient = APIClient.getInstance();
console.log('Base URL:', apiClient.getBaseURL());
console.log('Is configured:', apiClient.isConfigured());

// ดูรายการที่ยังไม่ส่ง
const syncManager = SyncManager.getInstance();
const unsent = await syncManager.getUnsentTransactions();
console.log('Unsent:', unsent.length);
```

### Server Requirements
Server ต้องมี API endpoints:
- `GET /health` - health check
- `POST /sync/sales` - รับข้อมูลการขาย
- รับ JSON format: `{ docInfo: [], skuMove: [] }`
