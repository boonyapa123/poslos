# 💾 คู่มือการจัดการ Database

## 📋 สารบัญ

1. [ภาพรวม Database](#ภาพรวม-database)
2. [ตำแหน่งไฟล์ Database](#ตำแหน่งไฟล์-database)
3. [Database ใน Build](#database-ใน-build)
4. [การสร้าง Database ครั้งแรก](#การสร้าง-database-ครั้งแรก)
5. [การ Backup และ Restore](#การ-backup-และ-restore)
6. [การย้ายข้อมูล](#การย้ายข้อมูล)
7. [Database Maintenance](#database-maintenance)

---

## ภาพรวม Database

### เทคโนโลยี:
- **SQLite** - ฐานข้อมูลแบบ file-based
- **Sequelize** - ORM สำหรับจัดการ database

### ข้อดี:
- ✅ ไม่ต้องติดตั้ง database server
- ✅ ทำงาน offline ได้ 100%
- ✅ เร็วและเบา
- ✅ Backup ง่าย (แค่ copy ไฟล์)
- ✅ Portable (ย้ายเครื่องได้)

### ข้อจำกัด:
- ⚠️ ไม่เหมาะกับ concurrent writes จำนวนมาก
- ⚠️ ไม่มี user management
- ⚠️ ต้อง backup manually

---

## ตำแหน่งไฟล์ Database

### Windows:
```
%APPDATA%\POS System\pos.db

ตัวอย่าง:
C:\Users\YourName\AppData\Roaming\POS System\pos.db
```

### macOS:
```
~/Library/Application Support/POS System/pos.db

ตัวอย่าง:
/Users/YourName/Library/Application Support/POS System/pos.db
```

### Linux:
```
~/.config/POS System/pos.db

ตัวอย่าง:
/home/yourname/.config/POS System/pos.db
```

### ไฟล์เสริม:
```
pos.db          # ไฟล์ database หลัก
pos.db-shm      # Shared memory file (ใช้ขณะทำงาน)
pos.db-wal      # Write-Ahead Log (ใช้ขณะทำงาน)
```

---

## Database ใน Build

### ❌ Database ไม่ติดไปกับ Build

เมื่อ build โปรแกรม **database จะไม่ถูก bundle ไปด้วย** เพราะ:

1. **แต่ละเครื่องมีข้อมูลคนละชุด**
   - สาขา A มีข้อมูลการขายของสาขา A
   - สาขา B มีข้อมูลการขายของสาขา B
   - ไม่ควรแชร์ database เดียวกัน

2. **Database เป็นข้อมูลของผู้ใช้**
   - ข้อมูลการขาย
   - ข้อมูลสต็อก
   - ข้อมูลลูกค้า
   - ไม่ควร hardcode ใน installer

3. **ขนาดไฟล์**
   - Database อาจมีขนาดใหญ่ (หลาย GB)
   - จะทำให้ installer ใหญ่เกินไป

### ✅ สิ่งที่ติดไปกับ Build:

```json
{
  "extraResources": [
    {
      "from": "ส่งข้อมูลPOS.xlsx",
      "to": "ส่งข้อมูลPOS.xlsx"
    }
  ]
}
```

- **ไฟล์ Excel** (`ส่งข้อมูลPOS.xlsx`) - สำหรับ import ข้อมูลเริ่มต้น
- **Schema/Models** - โครงสร้าง database
- **Migration scripts** - สำหรับอัพเดท schema

---

## การสร้าง Database ครั้งแรก

### Flow การทำงาน:

```
1. ติดตั้งโปรแกรม
   ↓
2. เปิดโปรแกรมครั้งแรก
   ↓
3. ตรวจสอบว่ามี pos.db หรือไม่
   ↓
4. ถ้าไม่มี → สร้าง database ใหม่
   ↓
5. สร้าง tables ตาม models
   ↓
6. ตรวจสอบว่ามีไฟล์ Excel หรือไม่
   ↓
7. ถ้ามี → Import ข้อมูลจาก Excel
   ↓
8. พร้อมใช้งาน!
```

### Code สำหรับสร้าง Database:

```typescript
// src/main/database.ts
import { Sequelize } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export async function initDatabase() {
  // กำหนดตำแหน่งไฟล์ database
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos.db');
  
  console.log('Database path:', dbPath);
  
  // สร้าง directory ถ้ายังไม่มี
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  // เชื่อมต่อ database
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
  
  // ทดสอบการเชื่อมต่อ
  await sequelize.authenticate();
  console.log('Database connected');
  
  // สร้าง tables (ถ้ายังไม่มี)
  await sequelize.sync({ alter: false });
  console.log('Database synced');
  
  // ตรวจสอบว่ามีข้อมูลหรือยัง
  const isEmpty = await checkIfDatabaseEmpty(sequelize);
  
  if (isEmpty) {
    console.log('Database is empty, importing from Excel...');
    await importFromExcel(sequelize);
  }
  
  return sequelize;
}

async function checkIfDatabaseEmpty(sequelize: Sequelize): Promise<boolean> {
  const [results] = await sequelize.query(
    "SELECT COUNT(*) as count FROM products"
  );
  return results[0].count === 0;
}

async function importFromExcel(sequelize: Sequelize) {
  // ตำแหน่งไฟล์ Excel
  const excelPath = path.join(
    process.resourcesPath,
    'ส่งข้อมูลPOS.xlsx'
  );
  
  if (!fs.existsSync(excelPath)) {
    console.warn('Excel file not found:', excelPath);
    return;
  }
  
  // Import ข้อมูล
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(excelPath);
  
  // Import Products
  const productsSheet = workbook.Sheets['Products'];
  const products = XLSX.utils.sheet_to_json(productsSheet);
  await sequelize.models.Product.bulkCreate(products);
  
  // Import Customers
  const customersSheet = workbook.Sheets['Customers'];
  const customers = XLSX.utils.sheet_to_json(customersSheet);
  await sequelize.models.Customer.bulkCreate(customers);
  
  // ... import ข้อมูลอื่นๆ
  
  console.log('Import completed');
}
```

---

## การ Backup และ Restore

### 1. Manual Backup

#### Windows:
```bash
# Backup
copy "%APPDATA%\POS System\pos.db" "D:\Backup\pos_backup_%date%.db"

# Restore
copy "D:\Backup\pos_backup_20251117.db" "%APPDATA%\POS System\pos.db"
```

#### macOS:
```bash
# Backup
cp ~/Library/Application\ Support/POS\ System/pos.db \
   ~/Desktop/pos_backup_$(date +%Y%m%d).db

# Restore
cp ~/Desktop/pos_backup_20251117.db \
   ~/Library/Application\ Support/POS\ System/pos.db
```

#### Linux:
```bash
# Backup
cp ~/.config/POS\ System/pos.db \
   ~/backup/pos_backup_$(date +%Y%m%d).db

# Restore
cp ~/backup/pos_backup_20251117.db \
   ~/.config/POS\ System/pos.db
```

### 2. Auto Backup (ในโปรแกรม)

```typescript
// src/main/backup.ts
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export async function autoBackup() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos.db');
  const backupDir = path.join(userDataPath, 'backups');
  
  // สร้าง backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // สร้างชื่อไฟล์ backup
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(backupDir, `pos_backup_${timestamp}.db`);
  
  // Copy ไฟล์
  fs.copyFileSync(dbPath, backupPath);
  console.log('Backup created:', backupPath);
  
  // ลบ backup เก่า (เก็บไว้ 30 วัน)
  cleanOldBackups(backupDir, 30);
}

function cleanOldBackups(backupDir: string, daysToKeep: number) {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;
    
    if (age > maxAge) {
      fs.unlinkSync(filePath);
      console.log('Deleted old backup:', file);
    }
  });
}

// เรียกใช้ทุกวันเวลา 23:00
import * as schedule from 'node-schedule';

schedule.scheduleJob('0 23 * * *', () => {
  autoBackup();
});
```

### 3. Export/Import ผ่าน UI

```typescript
// src/renderer/components/BackupDialog.tsx
import React from 'react';
import { ipcRenderer } from 'electron';

export function BackupDialog() {
  const handleBackup = async () => {
    const result = await ipcRenderer.invoke('backup-database');
    if (result.success) {
      alert(`Backup สำเร็จ: ${result.path}`);
    }
  };
  
  const handleRestore = async () => {
    const result = await ipcRenderer.invoke('restore-database');
    if (result.success) {
      alert('Restore สำเร็จ กรุณา restart โปรแกรม');
    }
  };
  
  return (
    <div>
      <button onClick={handleBackup}>Backup ข้อมูล</button>
      <button onClick={handleRestore}>Restore ข้อมูล</button>
    </div>
  );
}
```

---

## การย้ายข้อมูล

### สถานการณ์ที่ 1: ย้ายเครื่องใหม่

```bash
# 1. Backup จากเครื่องเก่า
# 2. ติดตั้งโปรแกรมบนเครื่องใหม่
# 3. ปิดโปรแกรม
# 4. Copy pos.db จากเครื่องเก่าไปวางที่เครื่องใหม่
# 5. เปิดโปรแกรม
```

### สถานการณ์ที่ 2: ย้ายจาก POS เครื่องหนึ่งไปอีกเครื่อง

```bash
# 1. Backup pos.db จาก POS-01
# 2. Copy ไปยัง POS-02
# 3. ปิดโปรแกรมบน POS-02
# 4. Restore pos.db
# 5. เปิดโปรแกรม
# 6. เปลี่ยน Terminal ID ใน Settings
```

### สถานการณ์ที่ 3: Merge ข้อมูลหลายเครื่อง

```typescript
// src/main/merge-databases.ts
import { Sequelize } from 'sequelize';

export async function mergeDatabases(
  mainDb: Sequelize,
  otherDbPath: string
) {
  // เชื่อมต่อ database ที่ 2
  const otherDb = new Sequelize({
    dialect: 'sqlite',
    storage: otherDbPath
  });
  
  // Attach database ที่ 2
  await mainDb.query(`ATTACH DATABASE '${otherDbPath}' AS other`);
  
  // Merge transactions (ที่ยังไม่ sync)
  await mainDb.query(`
    INSERT INTO transactions 
    SELECT * FROM other.transactions 
    WHERE synced = 0
  `);
  
  // Detach
  await mainDb.query(`DETACH DATABASE other`);
  
  console.log('Merge completed');
}
```

---

## Database Maintenance

### 1. Vacuum (ลดขนาดไฟล์)

```typescript
// src/main/maintenance.ts
export async function vacuumDatabase(sequelize: Sequelize) {
  console.log('Running VACUUM...');
  await sequelize.query('VACUUM');
  console.log('VACUUM completed');
}

// เรียกใช้ทุกสัปดาห์
import * as schedule from 'node-schedule';

schedule.scheduleJob('0 2 * * 0', async () => {
  await vacuumDatabase(sequelize);
});
```

### 2. Analyze (อัพเดท statistics)

```typescript
export async function analyzeDatabase(sequelize: Sequelize) {
  console.log('Running ANALYZE...');
  await sequelize.query('ANALYZE');
  console.log('ANALYZE completed');
}
```

### 3. ลบข้อมูลเก่า

```typescript
export async function cleanOldData(sequelize: Sequelize) {
  // ลบ transactions ที่ sync แล้ว และเก่ากว่า 90 วัน
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  await sequelize.models.Transaction.destroy({
    where: {
      synced: true,
      created_at: {
        [Op.lt]: ninetyDaysAgo
      }
    }
  });
  
  console.log('Old data cleaned');
}
```

### 4. ตรวจสอบความสมบูรณ์

```typescript
export async function checkIntegrity(sequelize: Sequelize) {
  const [results] = await sequelize.query('PRAGMA integrity_check');
  
  if (results[0].integrity_check === 'ok') {
    console.log('Database integrity: OK');
    return true;
  } else {
    console.error('Database integrity: FAILED', results);
    return false;
  }
}
```

---

## Database Schema

### Tables:

```sql
-- Products
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit_id INTEGER,
  price_level_1 REAL,
  price_level_2 REAL,
  price_level_3 REAL,
  price_level_4 REAL,
  price_level_5 REAL,
  created_at DATETIME,
  updated_at DATETIME
);

-- Customers
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_level INTEGER DEFAULT 1,
  credit_limit REAL DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);

-- Transactions
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER,
  total_amount REAL,
  vat_amount REAL,
  grand_total REAL,
  payment_method TEXT,
  status TEXT,
  synced BOOLEAN DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);

-- Transaction Items
CREATE TABLE transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER,
  product_id INTEGER,
  quantity REAL,
  unit_price REAL,
  total_price REAL,
  created_at DATETIME,
  updated_at DATETIME
);

-- ... และ tables อื่นๆ
```

---

## Troubleshooting

### ปัญหา: Database locked

```typescript
// แก้ไข: เพิ่ม timeout
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  dialectOptions: {
    busyTimeout: 30000 // 30 seconds
  }
});
```

### ปัญหา: Database corrupted

```bash
# 1. ปิดโปรแกรม
# 2. Restore จาก backup
cp ~/backup/pos_backup_20251117.db ~/.config/POS\ System/pos.db
# 3. เปิดโปรแกรม
```

### ปัญหา: ไฟล์ใหญ่เกินไป

```bash
# 1. Vacuum database
sqlite3 pos.db "VACUUM;"

# 2. ลบข้อมูลเก่า
# 3. Export เฉพาะข้อมูลที่จำเป็น
```

### ปัญหา: ข้อมูลหาย

```bash
# 1. ตรวจสอบว่าไฟล์ pos.db ยังอยู่หรือไม่
# 2. ตรวจสอบ backup
# 3. Restore จาก backup
# 4. ถ้าไม่มี backup → Import จาก Excel ใหม่
```

---

## Best Practices

### 1. Backup เป็นประจำ
- ✅ Backup ทุกวัน (หลังปิดกะ)
- ✅ เก็บ backup ไว้ 30 วัน
- ✅ เก็บ backup ที่ external drive หรือ cloud

### 2. Maintenance เป็นระยะ
- ✅ VACUUM ทุกสัปดาห์
- ✅ ANALYZE ทุกเดือน
- ✅ ลบข้อมูลเก่าทุก 3 เดือน

### 3. Monitor ขนาดไฟล์
- ✅ ตรวจสอบขนาดไฟล์เป็นประจำ
- ✅ ถ้าใหญ่เกิน 1 GB → ลบข้อมูลเก่า
- ✅ ถ้าใหญ่เกิน 5 GB → พิจารณา archive

### 4. Security
- ✅ Backup ไว้ที่ปลอดภัย
- ✅ ไม่แชร์ database ระหว่างเครื่อง
- ✅ Encrypt backup (ถ้าจำเป็น)

---

## FAQ

**Q: Database จะติดไปกับ installer ไหม?**  
A: ไม่ครับ แต่ละเครื่องจะสร้าง database ของตัวเองจากไฟล์ Excel

**Q: ย้ายเครื่องใหม่ต้องทำยังไง?**  
A: Backup pos.db จากเครื่องเก่า → ติดตั้งโปรแกรมบนเครื่องใหม่ → Copy pos.db ไปวาง

**Q: ข้อมูลจะหายไหมถ้าอัพเดทโปรแกรม?**  
A: ไม่หายครับ เพราะ database อยู่คนละที่กับโปรแกรม

**Q: สามารถใช้ database ร่วมกันหลายเครื่องได้ไหม?**  
A: ไม่แนะนำครับ SQLite ไม่เหมาะกับ concurrent access ให้ใช้ sync ผ่าน API แทน

**Q: ต้อง backup บ่อยแค่ไหน?**  
A: แนะนำทุกวันหลังปิดกะ หรือใช้ auto backup

---

**เอกสารนี้สร้างโดย:** Kiro AI Assistant  
**วันที่:** 17 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.0.0
