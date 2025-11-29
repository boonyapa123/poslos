# คู่มือการ Build โปรแกรม POS

## ขั้นตอนการเตรียมข้อมูล

### 1. Import ข้อมูลจาก Excel
```bash
npm run import-data
```
หรือ
```bash
node import-all-sheets.js
```

สคริปต์นี้จะ:
- อ่านข้อมูลจากไฟล์ `ส่งข้อมูลPOS.xlsx` (15 ชีท)
- Import เข้า database ที่ `~/Library/Application Support/poslos/pos.db`
- Import ข้อมูล:
  - สินค้า 28,000+ รายการ
  - หน่วยสินค้า 52,000+ รายการ
  - ราคา 366,000+ รายการ
  - ลูกค้า 5,500+ ราย
  - พนักงาน, สาขา, คลังสินค้า, ธนาคาร

### 2. เตรียม Template Database
```bash
npm run prepare-template
```

สคริปต์นี้จะ:
- Copy database ที่ import แล้วมาเป็น `pos-template.db`
- ไฟล์นี้จะถูก include ใน build

## การ Build โปรแกรม

### Build สำหรับ macOS
```bash
npm run build:mac
```

### Build สำหรับ Windows
```bash
npm run build:win
```

### Build สำหรับ Linux
```bash
npm run build:linux
```

### Build ทุก Platform
```bash
npm run build:all
```

## หมายเหตุสำคัญ

### ข้อมูลใน Build
- ไฟล์ `pos-template.db` จะถูก include ใน build
- เมื่อผู้ใช้เปิดโปรแกรมครั้งแรก จะ copy template ไปที่ user data folder
- ข้อมูลของแต่ละผู้ใช้จะแยกกันอยู่ใน:
  - **macOS**: `~/Library/Application Support/poslos/pos.db`
  - **Windows**: `%APPDATA%/poslos/pos.db`
  - **Linux**: `~/.config/poslos/pos.db`

### การอัพเดทข้อมูล
ถ้าต้องการอัพเดทข้อมูลใน build ใหม่:
1. แก้ไขไฟล์ Excel `ส่งข้อมูลPOS.xlsx`
2. รัน `npm run import-data`
3. รัน `npm run prepare-template`
4. Build ใหม่

### ขนาดไฟล์
- Database template: ~92 MB
- ไฟล์ build จะใหญ่ขึ้นตามขนาดของ database

## Workflow แนะนำ

### Development
```bash
# 1. Import ข้อมูลครั้งแรก
npm run import-data

# 2. รันโปรแกรม
npm run dev
```

### Production Build
```bash
# 1. Import ข้อมูลล่าสุด
npm run import-data

# 2. เตรียม template
npm run prepare-template

# 3. Build
npm run build:mac  # หรือ platform ที่ต้องการ
```

## ไฟล์สำคัญ

- `ส่งข้อมูลPOS.xlsx` - ไฟล์ Excel ต้นฉบับ (15 ชีท)
- `import-all-sheets.js` - สคริปต์ import ข้อมูล
- `prepare-template.js` - สคริปต์เตรียม template
- `pos-template.db` - Database template สำหรับ build
- `electron-builder.json` - Config การ build

## Troubleshooting

### ถ้า import ข้อมูลไม่สำเร็จ
```bash
# ลบ database เดิม
rm ~/Library/Application\ Support/poslos/pos.db

# Import ใหม่
npm run import-data
```

### ถ้า build ไม่มีข้อมูล
```bash
# ตรวจสอบว่ามีไฟล์ template
ls -lh pos-template.db

# ถ้าไม่มี ให้รัน
npm run prepare-template
```

### ถ้าต้องการ reset ข้อมูลผู้ใช้
ลบไฟล์ database ใน user data folder:
- macOS: `rm ~/Library/Application\ Support/poslos/pos.db`
- Windows: ลบไฟล์ใน `%APPDATA%/poslos/`
- Linux: `rm ~/.config/poslos/pos.db`

จากนั้นเปิดโปรแกรมใหม่ จะ copy จาก template อัตโนมัติ
