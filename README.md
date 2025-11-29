# ระบบ POS - Point of Sale System

ระบบ POS สำหรับร้านค้าวัสดุก่อสร้างและอุปกรณ์ทั่วไป ที่ทำงานแบบ Stand-alone บนเครื่อง POS แต่ละเครื่อง

## เทคโนโลยีที่ใช้

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **SQLite** - ฐานข้อมูลในเครื่อง
- **Sequelize** - ORM สำหรับจัดการฐานข้อมูล
- **Tailwind CSS** - CSS framework
- **Axios** - HTTP client
- **Hotkeys.js** - Keyboard shortcuts

## ฟีเจอร์หลัก

- ✅ ฐานข้อมูล SQL ในเครื่อง (Stand-alone)
- ✅ ซิงค์ข้อมูลกับ Server กลาง
- ✅ ขายสินค้าพร้อมระดับราคาหลายระดับ
- ✅ พักบิลและเรียกบิลคืน
- ✅ แสดงผลสองหน้าจอ (พนักงาน + ลูกค้า)
- ✅ Keyboard shortcuts ครบทุกปุ่ม
- ✅ คำนวณ VAT แบบ In/Out
- ✅ รองรับหลายกะต่อวัน
- ✅ ติดตั้งได้ไม่จำกัดเครื่อง

## การติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# Build โปรเจกต์
npm run build

# รันโปรแกรม
npm start
```

## การพัฒนา

```bash
# รันในโหมด development (auto-reload)
npm run dev
```

## Keyboard Shortcuts

| ปุ่ม | ฟังก์ชัน |
|------|---------|
| Delete | ใส่รหัสลูกค้า |
| F6 | ค้นหาสินค้า |
| ตัวเลข * | จำนวนสินค้า |
| F9 | ดูเลขที่บิลที่พักไว้ |
| End = | พักบิล หรือเรียกบิลที่พักไว้ |
| M | ลบรายการสินค้า |
| End M | ยกเลิกหมดบิล |
| End | ชำระบิล |
| Page Down | ออกบิลขาย |
| F10 | เครื่องคิดเลข |
| Insert | พิมพ์บิลซ้ำ |
| Home Home | ปิดโปรแกรมขาย |

## โครงสร้างโปรเจกต์

```
src/
├── main/           # Electron main process
├── renderer/       # React UI
│   ├── components/ # React components
│   └── styles/     # CSS files
├── models/         # Database models
├── services/       # Business logic services
└── types/          # TypeScript type definitions
```

## สถานะการพัฒนา

ดูรายละเอียดใน `.kiro/specs/pos-system/tasks.md`
