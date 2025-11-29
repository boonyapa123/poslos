# 📦 Template Database - คู่มือการใช้งาน

## ภาพรวม

ระบบใช้ **Template Database** เพื่อให้ข้อมูลเริ่มต้นพร้อมใช้งานทันทีหลังติดตั้ง โดยไม่ต้อง import จาก Excel อีก

## วิธีการทำงาน

```
1. ก่อน Build → สร้าง pos-template.db จาก Excel
2. Build → Bundle pos-template.db ไปกับ installer
3. ติดตั้งโปรแกรม → pos-template.db อยู่ใน resources/
4. เปิดโปรแกรมครั้งแรก → Copy pos-template.db ไปยัง user data folder
5. พร้อมใช้งาน! (มีข้อมูลเริ่มต้นครบแล้ว)
```

## ขั้นตอนการ Build

### 1. เตรียมข้อมูล

วางไฟล์ `ส่งข้อมูลPOS.xlsx` ที่ root folder พร้อมข้อมูล:
- Products (สินค้า)
- Customers (ลูกค้า)
- Employees (พนักงาน)
- ProductUnits (หน่วยสินค้า)
- BankAccounts (บัญชีธนาคาร)

### 2. สร้าง Template Database

```bash
# สร้าง pos-template.db จาก Excel
npm run create-template
```

**Output:**
```
🚀 Starting template database creation...
✅ Removed old template database
📦 Initializing models...
✅ Database schema created
📊 Reading Excel file...
📥 Importing Product Units...
✅ Imported 10 product units
📥 Importing Products...
✅ Imported 1000 products
📥 Importing Customers...
✅ Imported 500 customers
📥 Importing Employees...
✅ Imported 20 employees
📥 Importing Bank Accounts...
✅ Imported 5 bank accounts
🔧 Optimizing database...
✨ Template database created successfully!
📁 Location: /path/to/pos-template.db
📊 Size: 2.5 MB
```

### 3. Build โปรแกรม

```bash
# Build จะสร้าง template อัตโนมัติ
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
npm run build:all   # ทุก platform
```

**หมายเหตุ:** Build scripts จะรัน `create-template` อัตโนมัติก่อน build

## โครงสร้างไฟล์

```
pos-system/
├── ส่งข้อมูลPOS.xlsx          # ข้อมูลต้นฉบับ
├── pos-template.db             # Template database (generated)
├── scripts/
│   └── create-template-db.ts   # สคริปต์สร้าง template
├── src/
│   └── main/
│       └── database-init.ts    # โค้ดสำหรับ copy template
└── dist-electron/
    └── resources/
        └── pos-template.db     # Template ใน installer
```

## การใช้งานใน Code

### Main Process (src/main/main.ts)

```typescript
import { app } from 'electron';
import { initDatabase } from './database-init';

app.whenReady().then(async () => {
  // Initialize database (จะ copy จาก template ถ้ายังไม่มี)
  const sequelize = await initDatabase();
  
  // พร้อมใช้งาน!
  // ข้อมูลเริ่มต้นมีครบแล้ว
});
```

### Database Init Logic

```typescript
// src/main/database-init.ts

export async function initDatabase(): Promise<Sequelize> {
  const dbPath = path.join(app.getPath('userData'), 'pos.db');
  
  // ตรวจสอบว่ามี database หรือยัง
  if (!fs.existsSync(dbPath)) {
    // ยังไม่มี → Copy จาก template
    const templatePath = path.join(process.resourcesPath, 'pos-template.db');
    fs.copyFileSync(templatePath, dbPath);
    console.log('✅ Database created from template');
  }
  
  // เชื่อมต่อ database
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath
  });
  
  return sequelize;
}
```

## ข้อดี

### ✅ ไม่ต้อง Import ทุกครั้ง
- ติดตั้งเสร็จ → เปิดใช้งานได้เลย
- ไม่ต้องรอ import 5-10 นาที
- ประสบการณ์ผู้ใช้ดีขึ้น

### ✅ ข้อมูลสม่ำเสมอ
- ทุกเครื่องได้ข้อมูลเหมือนกัน
- ไม่มีปัญหา Excel version ต่างกัน
- ไม่มีปัญหา import ผิดพลาด

### ✅ Offline ได้ 100%
- ไม่ต้องดาวน์โหลดข้อมูล
- ไม่ต้องเชื่อมต่อ internet
- ติดตั้งที่ไหนก็ได้

### ✅ เร็วกว่า
- Copy ไฟล์ < 1 วินาที
- Import จาก Excel 5-10 นาที

## ข้อควรระวัง

### ⚠️ ขนาดไฟล์ Installer
- Template database จะทำให้ installer ใหญ่ขึ้น
- ถ้าข้อมูลมาก (10,000+ สินค้า) อาจใหญ่ 10-50 MB
- แต่ยังยอมรับได้เมื่อเทียบกับประโยชน์

### ⚠️ ต้อง Build Template ใหม่เมื่อข้อมูลเปลี่ยน
- ถ้าแก้ไข Excel → ต้องรัน `npm run create-template` ใหม่
- ถ้าแก้ไข schema → ต้องรัน `npm run create-template` ใหม่

### ⚠️ Template ไม่มีข้อมูล Transaction
- Template มีแค่ master data (สินค้า, ลูกค้า, พนักงาน)
- ไม่มีข้อมูลการขาย (transactions)
- แต่ละเครื่องจะมีข้อมูลการขายของตัวเอง

## การอัพเดทข้อมูล

### สถานการณ์ที่ 1: อัพเดทข้อมูลสินค้า

```bash
# 1. แก้ไข ส่งข้อมูลPOS.xlsx
# 2. สร้าง template ใหม่
npm run create-template

# 3. Build ใหม่
npm run build:win

# 4. ติดตั้งเวอร์ชันใหม่
# หมายเหตุ: เครื่องที่ติดตั้งแล้วจะไม่ได้ข้อมูลใหม่
# ต้อง sync จาก server หรือ import Excel ใหม่
```

### สถานการณ์ที่ 2: อัพเดทข้อมูลบนเครื่องที่ติดตั้งแล้ว

**Option A: Sync จาก Server**
```typescript
// ใช้ API sync
await syncProducts();
await syncCustomers();
```

**Option B: Import Excel ใหม่**
```typescript
// ให้ผู้ใช้ import Excel ใหม่ผ่าน UI
await importFromExcel('ส่งข้อมูลPOS.xlsx');
```

**Option C: Reset Database**
```typescript
// ลบ database เดิม และสร้างใหม่จาก template
await resetDatabase();
// หมายเหตุ: ข้อมูลการขายจะหายหมด!
```

## การทดสอบ

### ทดสอบการสร้าง Template

```bash
# สร้าง template
npm run create-template

# ตรวจสอบว่าสร้างสำเร็จ
ls -lh pos-template.db

# ตรวจสอบข้อมูลใน template
sqlite3 pos-template.db "SELECT COUNT(*) FROM products;"
sqlite3 pos-template.db "SELECT COUNT(*) FROM customers;"
```

### ทดสอบการ Copy Template

```bash
# Build แบบ unpacked
npm run pack

# รันโปรแกรม
npm start

# ตรวจสอบ log
# ควรเห็น: "✅ Database created from template"
```

## Troubleshooting

### ปัญหา: Template ไม่ถูกสร้าง

```bash
# ตรวจสอบว่ามีไฟล์ Excel
ls -la ส่งข้อมูลPOS.xlsx

# รัน create-template แบบ verbose
npm run create-template

# ตรวจสอบ error
```

### ปัญหา: Template ไม่ถูก bundle

```bash
# ตรวจสอบ electron-builder.json
cat electron-builder.json | grep "pos-template.db"

# ควรเห็น:
# "from": "pos-template.db",
# "to": "pos-template.db"
```

### ปัญหา: Database ไม่ถูก copy

```bash
# ตรวจสอบว่า template อยู่ใน resources
ls -la dist-electron/*/resources/pos-template.db

# ตรวจสอบ log ตอนเปิดโปรแกรม
# ควรเห็น: "📋 Copying template database..."
```

### ปัญหา: ข้อมูลไม่ครบ

```bash
# ตรวจสอบข้อมูลใน template
sqlite3 pos-template.db "SELECT COUNT(*) FROM products;"
sqlite3 pos-template.db "SELECT COUNT(*) FROM customers;"

# ถ้าไม่ครบ → สร้าง template ใหม่
npm run create-template
```

## Best Practices

### 1. Version Control

```bash
# ไม่ควร commit pos-template.db
# เพิ่มใน .gitignore
echo "pos-template.db" >> .gitignore

# Commit เฉพาะ Excel
git add ส่งข้อมูลPOS.xlsx
git commit -m "Update master data"
```

### 2. CI/CD

```yaml
# .github/workflows/build.yml
- name: Create template database
  run: npm run create-template

- name: Build application
  run: npm run build:all
```

### 3. Documentation

```markdown
# README.md

## การ Build

1. เตรียมข้อมูลใน ส่งข้อมูลPOS.xlsx
2. สร้าง template: `npm run create-template`
3. Build: `npm run build:win`
```

## เปรียบเทียบวิธีการ

| วิธีการ | ข้อดี | ข้อเสีย |
|---------|-------|---------|
| **Import จาก Excel ทุกครั้ง** | - Installer เล็ก<br>- ข้อมูลล่าสุดเสมอ | - ช้า (5-10 นาที)<br>- ต้องมี Excel<br>- อาจ import ผิด |
| **Template Database** ⭐ | - เร็ว (< 1 วินาที)<br>- ไม่ต้อง import<br>- ข้อมูลสม่ำเสมอ | - Installer ใหญ่ขึ้นเล็กน้อย<br>- ต้อง build template ใหม่เมื่อข้อมูลเปลี่ยน |
| **Download จาก Server** | - Installer เล็ก<br>- ข้อมูลล่าสุดเสมอ | - ต้องมี internet<br>- ต้องมี server<br>- ช้า (ขึ้นกับ network) |

## สรุป

Template Database เป็นวิธีที่ดีที่สุดสำหรับ POS System เพราะ:
- ✅ ติดตั้งเสร็จ → ใช้งานได้ทันที
- ✅ ไม่ต้องรอ import
- ✅ ทำงาน offline ได้ 100%
- ✅ ข้อมูลสม่ำเสมอทุกเครื่อง

**แนะนำให้ใช้วิธีนี้!** 🎉

---

**เอกสารนี้สร้างโดย:** Kiro AI Assistant  
**วันที่:** 17 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.0.0
