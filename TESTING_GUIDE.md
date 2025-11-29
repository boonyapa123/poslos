# 🧪 คู่มือการทดสอบโปรแกรม (Stand-alone Mode)

## ✅ สถานะปัจจุบัน

```
✅ Build สำเร็จ
✅ Template database พร้อม (14 MB, 37,373 records)
✅ พร้อมทดสอบ Stand-alone mode
```

---

## 🚀 วิธีทดสอบ

### 1. รันโปรแกรมในโหมด Development

```bash
npm start
```

**ควรเห็น:**
```
🚀 Initializing database...
📁 User data path: /Users/xxx/Library/Application Support/poslos
📁 Database path: /Users/xxx/Library/Application Support/poslos/pos.db
📦 Database not found, creating from template...
📁 Template path: /Users/xxx/Poslos/pos-template.db
📋 Copying template database...
✅ Database created from template (13.77 MB)
✅ Database connected successfully

📊 Database Statistics:
   Products: 28412
   Customers: 5537
   Employees: 21
```

### 2. ตรวจสอบหน้าจอ

**ควรเห็น:**
- ✅ หน้าต่างหลัก (Main Window) - 1200x800
- ✅ หน้าจอลูกค้า (Customer Display) - 800x600
- ✅ UI โหลดขึ้นมาปกติ

### 3. ทดสอบข้อมูล

#### 3.1 ทดสอบดึงข้อมูลสินค้า

เปิด DevTools (Cmd+Option+I หรือ F12) แล้วรันใน Console:

```javascript
// ทดสอบดึงสินค้า
const { Product } = require('./src/models/Product');
const products = await Product.findAll({ limit: 10 });
console.log('Products:', products.length);
console.log('Sample:', products[0].toJSON());
```

**ควรเห็น:**
```javascript
Products: 10
Sample: {
  id: "uuid",
  sku: "100001",
  name: "เทปพันกิ่งสีขาว 3cmx100m G2 BD-58 ic",
  category: "K",
  isActive: true
}
```

#### 3.2 ทดสอบดึงข้อมูลลูกค้า

```javascript
const { Customer } = require('./src/models/Customer');
const customers = await Customer.findAll({ limit: 10 });
console.log('Customers:', customers.length);
console.log('Sample:', customers[0].toJSON());
```

**ควรเห็น:**
```javascript
Customers: 10
Sample: {
  id: "uuid",
  code: "54787",
  name: "ANT_พนักงาน ANT ติดหนี้",
  priceLevel: 1004
}
```

---

## 🧪 Test Cases

### Test 1: Database Initialization ✅

**วัตถุประสงค์:** ตรวจสอบว่า database ถูกสร้างจาก template

**ขั้นตอน:**
1. ลบ database เก่า (ถ้ามี)
   ```bash
   rm -rf ~/Library/Application\ Support/poslos/pos.db
   ```
2. รันโปรแกรม `npm start`
3. ตรวจสอบ log

**ผลลัพธ์ที่คาดหวัง:**
- ✅ เห็น "📋 Copying template database..."
- ✅ เห็น "✅ Database created from template"
- ✅ เห็นจำนวน records ถูกต้อง

---

### Test 2: Data Integrity ✅

**วัตถุประสงค์:** ตรวจสอบว่าข้อมูลครบถ้วนถูกต้อง

**ขั้นตอน:**
```bash
# เปิด Terminal ใหม่
sqlite3 ~/Library/Application\ Support/poslos/pos.db

# รัน SQL
SELECT 'Products:', COUNT(*) FROM products;
SELECT 'Customers:', COUNT(*) FROM customers;
SELECT 'Employees:', COUNT(*) FROM employees;
SELECT 'Units:', COUNT(*) FROM product_units;
SELECT 'Branches:', COUNT(*) FROM branches;
SELECT 'Departments:', COUNT(*) FROM departments;
```

**ผลลัพธ์ที่คาดหวัง:**
```
Products: 28412
Customers: 5537
Employees: 21
Units: 337
Branches: 47
Departments: 3009
```

---

### Test 3: Product Search ✅

**วัตถุประสงค์:** ทดสอบค้นหาสินค้า

**ขั้นตอน:**
```javascript
// ค้นหาด้วย SKU
const product = await Product.findOne({ where: { sku: '100001' } });
console.log('Found:', product.name);

// ค้นหาด้วยชื่อ (LIKE)
const { Op } = require('sequelize');
const products = await Product.findAll({
  where: {
    name: { [Op.like]: '%เทป%' }
  },
  limit: 5
});
console.log('Found:', products.length, 'products');
```

**ผลลัพธ์ที่คาดหวัง:**
- ✅ หาสินค้าเจอ
- ✅ ข้อมูลถูกต้อง

---

### Test 4: Customer Lookup ✅

**วัตถุประสงค์:** ทดสอบค้นหาลูกค้า

**ขั้นตอน:**
```javascript
// ค้นหาด้วย code
const customer = await Customer.findOne({ where: { code: '54787' } });
console.log('Found:', customer.name, 'Price Level:', customer.priceLevel);

// ค้นหาตาม price level
const vipCustomers = await Customer.findAll({
  where: { priceLevel: 1 },
  limit: 10
});
console.log('VIP Customers:', vipCustomers.length);
```

**ผลลัพธ์ที่คาดหวัง:**
- ✅ หาลูกค้าเจอ
- ✅ Price level ถูกต้อง

---

### Test 5: Transaction Creation ✅

**วัตถุประสงค์:** ทดสอบสร้างบิลขาย

**ขั้นตอน:**
```javascript
const { Transaction, TransactionItem } = require('./src/models');
const { v4: uuidv4 } = require('uuid');

// สร้าง transaction
const transaction = await Transaction.create({
  id: uuidv4(),
  transactionNumber: 'TEST-001',
  terminalId: 'POS-01',
  customerId: null,
  subtotal: 1000,
  vatAmount: 70,
  grandTotal: 1070,
  paymentMethod: 'CASH',
  status: 'COMPLETED',
  transactionDate: new Date()
});

// สร้าง items
await TransactionItem.create({
  id: uuidv4(),
  transactionId: transaction.id,
  productId: 'xxx',
  productSku: '100001',
  productName: 'Test Product',
  quantity: 2,
  unitPrice: 500,
  lineTotal: 1000,
  lineNumber: 1
});

console.log('Transaction created:', transaction.transactionNumber);
```

**ผลลัพธ์ที่คาดหวัง:**
- ✅ สร้าง transaction สำเร็จ
- ✅ สร้าง items สำเร็จ
- ✅ ข้อมูลถูกบันทึกใน database

---

### Test 6: Offline Mode ✅

**วัตถุประสงค์:** ตรวจสอบว่าทำงาน offline ได้

**ขั้นตอน:**
1. ปิด WiFi/Internet
2. รันโปรแกรม
3. ทดสอบฟังก์ชันต่างๆ

**ผลลัพธ์ที่คาดหวัง:**
- ✅ โปรแกรมเปิดได้ปกติ
- ✅ ดึงข้อมูลจาก local database ได้
- ✅ สร้างบิลขายได้
- ✅ ไม่มี error เกี่ยวกับ network

---

### Test 7: Performance ✅

**วัตถุประสงค์:** ทดสอบความเร็ว

**ขั้นตอน:**
```javascript
// ทดสอบความเร็วในการดึงข้อมูล
console.time('Load 1000 products');
const products = await Product.findAll({ limit: 1000 });
console.timeEnd('Load 1000 products');

console.time('Search products');
const results = await Product.findAll({
  where: { name: { [Op.like]: '%เทป%' } },
  limit: 100
});
console.timeEnd('Search products');
```

**ผลลัพธ์ที่คาดหวัง:**
- ✅ Load 1000 products: < 500ms
- ✅ Search: < 100ms

---

## 🐛 Common Issues & Solutions

### Issue 1: Database not found

**อาการ:**
```
⚠️  Template database not found
✅ Created empty database
```

**สาเหตุ:** ไฟล์ `pos-template.db` ไม่อยู่ที่ root folder

**แก้ไข:**
```bash
# ตรวจสอบว่ามีไฟล์
ls -lh pos-template.db

# ถ้าไม่มี ให้สร้างใหม่
npm run create-template
```

---

### Issue 2: Empty database

**อาการ:**
```
Products: 0
Customers: 0
```

**สาเหตุ:** Template database เป็นไฟล์เปล่า

**แก้ไข:**
```bash
# ลบ database เก่า
rm pos-template.db

# สร้างใหม่
npm run create-template

# ลบ database ในเครื่อง
rm -rf ~/Library/Application\ Support/poslos/pos.db

# รันโปรแกรมใหม่
npm start
```

---

### Issue 3: Cannot open database

**อาการ:**
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**สาเหตุ:** ไม่มีสิทธิ์เขียนไฟล์

**แก้ไข:**
```bash
# ตรวจสอบ permissions
ls -la ~/Library/Application\ Support/poslos/

# ให้สิทธิ์
chmod 755 ~/Library/Application\ Support/poslos/
```

---

### Issue 4: Slow performance

**อาการ:** โปรแกรมช้า

**สาเหตุ:** Database ไม่มี index

**แก้ไข:**
```sql
-- เพิ่ม indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_transactions_number ON transactions(transactionNumber);
```

---

## 📊 Test Report Template

```markdown
# Test Report - Stand-alone Mode

**วันที่:** 17 พฤศจิกายน 2025
**ผู้ทดสอบ:** [ชื่อ]
**เวอร์ชัน:** 1.0.0
**Platform:** macOS / Windows / Linux

## Test Results

| Test Case | Status | Note |
|-----------|--------|------|
| Database Initialization | ✅ Pass | |
| Data Integrity | ✅ Pass | |
| Product Search | ✅ Pass | |
| Customer Lookup | ✅ Pass | |
| Transaction Creation | ✅ Pass | |
| Offline Mode | ✅ Pass | |
| Performance | ✅ Pass | |

## Issues Found

1. [ถ้ามี]

## Recommendations

1. [ถ้ามี]

## Conclusion

โปรแกรมพร้อมใช้งานแบบ Stand-alone ✅
```

---

## 🎯 Checklist ก่อน Deploy

- [ ] ทดสอบทุก Test Cases ผ่าน
- [ ] ไม่มี Error ใน Console
- [ ] Performance ดี (< 500ms)
- [ ] ทำงาน Offline ได้
- [ ] Database มีข้อมูลครบ
- [ ] UI แสดงผลถูกต้อง
- [ ] Keyboard shortcuts ทำงาน
- [ ] พิมพ์บิลได้ (ถ้ามี printer)
- [ ] Customer display ทำงาน

---

**พร้อมทดสอบแล้วครับ! 🚀**

รัน: `npm start`
