# โครงสร้างโปรเจค POS System

## ไฟล์หลัก

### Configuration Files
- `package.json` - Dependencies และ scripts
- `tsconfig.json` - TypeScript configuration
- `webpack.config.js` - Webpack configuration
- `electron-builder.json` - Build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Data Files
- `ส่งข้อมูลPOS.xlsx` - ไฟล์ Excel ข้อมูลต้นฉบับ (15 ชีท)
- `pos-template.db` - Database template (generated, 92 MB)

### Scripts
- `import-all-sheets.js` - Import ข้อมูลจาก Excel ทั้ง 15 ชีท
- `prepare-template.js` - เตรียม template database สำหรับ build

### Documentation
- `README.md` - คู่มือหลัก
- `BUILD_GUIDE.md` - คู่มือการ build และเตรียมข้อมูล
- `TESTING_GUIDE.md` - คู่มือการทดสอบ
- `DATABASE.md` - โครงสร้าง database
- `EXCEL_DATA_MAPPING.md` - การ map ข้อมูล Excel
- `TEMPLATE_DATABASE.md` - คู่มือ template database
- `MULTILINGUAL_SETUP.md` - การตั้งค่าหลายภาษา
- `EXCHANGE_RATE_SETUP.md` - การตั้งค่าอัตราแลกเปลี่ยน
- `DEPLOYMENT.md` - คู่มือการ deploy
- `INSTALLATION.md` - คู่มือการติดตั้ง
- `SERVER_SYNC_GUIDE.md` - คู่มือ sync กับ server
- `SYNC_FROM_SERVER_GUIDE.md` - คู่มือ sync จาก server
- `SERVER_REQUIREMENTS_CHECKLIST.md` - Checklist สำหรับ server
- `SYSTEM_NOTES.md` - บันทึกระบบ

## โครงสร้างโฟลเดอร์

### `/src`
โค้ดหลักของโปรแกรม

#### `/src/main`
- `main.ts` - Main process ของ Electron
- `database-init.ts` - การเริ่มต้น database
- `ipcHandlers.ts` - IPC handlers สำหรับสื่อสารระหว่าง main และ renderer
- `importExcel.ts` - Import ข้อมูลจาก Excel
- `seedData.ts` - Seed ข้อมูลเริ่มต้น

#### `/src/models`
Sequelize models สำหรับ database
- `Product.ts` - สินค้า
- `ProductUnit.ts` - หน่วยสินค้า
- `ProductPrice.ts` - ราคาสินค้า
- `Customer.ts` - ลูกค้า
- `Employee.ts` - พนักงาน
- `Branch.ts` - สาขา
- `Category.ts` - หมวดหมู่
- `Department.ts` - แผนก
- `Warehouse.ts` - คลังสินค้า
- `BankAccount.ts` - บัญชีธนาคาร
- `Transaction.ts` - ธุรกรรมการขาย
- `TransactionItem.ts` - รายการสินค้าในธุรกรรม
- `Shift.ts` - กะการทำงาน
- `SyncLog.ts` - Log การ sync
- `Configuration.ts` - การตั้งค่า
- `index.ts` - Export และ associations

#### `/src/renderer`
React UI components

##### `/src/renderer/components`
- `LanguageSwitcher.tsx` - สลับภาษา
- อื่นๆ...

##### `/src/renderer/context`
- `POSContext.tsx` - Context สำหรับ POS

##### `/src/renderer/utils`
- Utility functions

##### `/src/renderer/styles`
- CSS และ Tailwind styles

#### `/src/services`
- `DatabaseManager.ts` - จัดการ database
- `APIClient.ts` - เชื่อมต่อ API
- `SyncManager.ts` - จัดการ sync
- `PrinterService.ts` - จัดการเครื่องพิมพ์
- `HotkeyManager.ts` - จัดการ hotkeys

#### `/src/i18n`
- `config.ts` - i18n configuration
- `/locales` - ไฟล์แปลภาษา (th, en, lo)

#### `/src/types`
TypeScript type definitions
- `pos.ts` - Types สำหรับ POS
- `api.ts` - Types สำหรับ API
- `sync.ts` - Types สำหรับ sync

### `/scripts`
Scripts สำหรับ development
- `create-template-from-excel.ts` - สร้าง template จาก Excel (เก่า)
- `translate-and-create-template.ts` - สร้าง template พร้อมแปลภาษา (เก่า)

### `/build`
Build resources (icons, entitlements, etc.)

### `/dist`
Compiled JavaScript files (generated)

### `/dist-electron`
Built Electron app (generated)

## Workflow

### Development
```bash
npm run dev
```

### Import ข้อมูล
```bash
npm run import-data
```

### Build
```bash
npm run prepare-template
npm run build:mac
```

## ข้อมูลที่ Import

จากไฟล์ `ส่งข้อมูลPOS.xlsx` (15 ชีท):

1. **BRANCH** - สาขา (47 รายการ)
2. **ICCAT** - หมวดหมู่หลัก (28 รายการ)
3. **ICDEPT** - แผนก/หมวดหมู่ย่อย (12,047 รายการ)
4. **UOFQTY** - หน่วยนับ (337 รายการ)
5. **WARELOCATION** - คลังสินค้า (52 รายการ)
6. **SKUMASTER** - สินค้าหลัก (28,412 รายการ)
7. **GOODSMASTER** - รหัสซื้อขาย/หน่วยสินค้า (52,343 รายการ)
8. **ARPRB** - ตารางราคา
9. **ARFILE** - ลูกค้า (5,537 รายการ)
10. **ARPLU** - ราคาสินค้า (366,200 รายการ)
11. **USER** - พนักงานขาย (21 รายการ)
12. **SERVICE** - พนักงานบริการ
13. **BANK** - บัญชีธนาคาร (4 รายการ)
14. **DOCINFO** - ข้อมูลเอกสาร
15. **SKUMOVE** - การเคลื่อนไหวสินค้า

## Database

- **Development**: `~/Library/Application Support/poslos/pos.db`
- **Template**: `pos-template.db` (included in build)
- **Size**: ~92 MB

## Technologies

- **Electron** - Desktop app framework
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Sequelize** - ORM for SQLite
- **SQLite** - Database
- **Tailwind CSS** - CSS framework
- **i18next** - Internationalization (Thai, English, Lao)
- **Webpack** - Module bundler
