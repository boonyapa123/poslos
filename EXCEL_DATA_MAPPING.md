# 📊 Excel Data Mapping Guide

## ปัญหาที่พบ

Excel file (`ส่งข้อมูลPOS.xlsx`) มี format ที่ซับซ้อน:
- มี merged cells
- มี headers ซ้อนกัน
- มี formatting พิเศษ
- **ไม่ตรงกับ schema ของ Models**

## แนวทางแก้ไข

### ✅ แนวทางที่แนะนำ: Hybrid Approach

1. **Template Database = Schema เปล่า**
   - มีแค่ table structure
   - ไม่มีข้อมูล master data
   - ขนาดเล็ก (~100 KB)

2. **Import ข้อมูลตอนรันครั้งแรก**
   - ตรวจสอบว่ามีไฟล์ Excel หรือไม่
   - Import และ transform ข้อมูล
   - Validate ก่อน insert

3. **หรือ Sync จาก Server**
   - ดึงข้อมูลจาก API
   - ข้อมูลเป็น format ที่ถูกต้อง
   - มี validation แล้ว

## Data Mapping

### SKUMASTER → Products

```typescript
// Excel columns (ตัวอย่าง - ต้องตรวจสอบจริง)
{
  SKUCODE: string,
  SKUNAME: string,
  SKUDESC: string,
  CATEGORY: string,
  PRICE1: number,
  PRICE2: number,
  // ...
}

// Transform to Product model
{
  id: UUID (generate),
  sku: SKUCODE,
  name: SKUNAME,
  description: SKUDESC,
  category: CATEGORY,
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
  syncedAt: NOW
}

// Prices → separate table
{
  productId: UUID,
  level: 1,
  price: PRICE1
}
```

### ARFILE → Customers

```typescript
// Excel columns
{
  ARCODE: string,
  ARNAME: string,
  ARTEL: string,
  AREMAIL: string,
  ARADDR: string,
  PRICELEVEL: number,
  CREDITLIMIT: number
}

// Transform to Customer model
{
  id: UUID (generate),
  code: ARCODE,
  name: ARNAME,
  phone: ARTEL,
  email: AREMAIL,
  address: ARADDR,
  priceLevel: PRICELEVEL,
  creditLimit: CREDITLIMIT,
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
  syncedAt: NOW
}
```

## Implementation

### 1. สร้าง Empty Template

```bash
# แก้ไข scripts/create-template-db.ts
# ให้สร้างแค่ schema ไม่ import ข้อมูล
npm run create-template
```

### 2. Import Service

```typescript
// src/services/ExcelImportService.ts
export class ExcelImportService {
  async importFromExcel(filePath: string) {
    const workbook = XLSX.readFile(filePath);
    
    // Import Products
    await this.importProducts(workbook);
    
    // Import Customers
    await this.importCustomers(workbook);
    
    // Import other data...
  }
  
  private async importProducts(workbook: XLSX.WorkBook) {
    const sheet = workbook.Sheets['SKUMASTER'];
    const rawData = XLSX.utils.sheet_to_json(sheet);
    
    // Transform data
    const products = rawData.map(row => ({
      id: uuidv4(),
      sku: row.SKUCODE,
      name: row.SKUNAME,
      description: row.SKUDESC,
      category: row.CATEGORY,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date()
    }));
    
    // Validate and insert
    await Product.bulkCreate(products, { validate: true });
  }
}
```

### 3. Auto Import on First Run

```typescript
// src/main/database-init.ts
export async function initDatabase(): Promise<Sequelize> {
  // ... existing code ...
  
  // Check if database is empty
  const productCount = await Product.count();
  
  if (productCount === 0) {
    console.log('📊 Database is empty, importing from Excel...');
    
    const excelPath = path.join(process.resourcesPath, 'ส่งข้อมูลPOS.xlsx');
    if (fs.existsSync(excelPath)) {
      const importService = new ExcelImportService();
      await importService.importFromExcel(excelPath);
      console.log('✅ Import completed');
    }
  }
  
  return sequelize;
}
```

## ข้อดี/ข้อเสีย

### Template with Data (ปัจจุบัน)
- ✅ เร็ว (ไม่ต้อง import)
- ❌ ข้อมูลไม่ตรง schema
- ❌ ไม่มี validation
- ❌ ไม่มี UUID, timestamps

### Empty Template + Import
- ✅ ข้อมูลตรง schema
- ✅ มี validation
- ✅ มี UUID, timestamps
- ✅ ยืดหยุ่น (แก้ Excel format ได้)
- ❌ ช้ากว่า (ต้อง import 5-10 นาที)

### Sync from Server
- ✅ ข้อมูลถูกต้องแน่นอน
- ✅ ข้อมูลล่าสุดเสมอ
- ✅ มี validation แล้ว
- ❌ ต้องมี internet
- ❌ ต้องมี server

## คำแนะนำ

**สำหรับ Production:**
1. ใช้ **Empty Template** (schema เท่านั้น)
2. **Import จาก Excel** ตอนรันครั้งแรก (auto)
3. หรือ **Sync จาก Server** (ถ้ามี)

**สำหรับ Development:**
1. ใช้ **Template with Sample Data** (ข้อมูลทดสอบ)
2. สร้างด้วย script ที่ generate ข้อมูลถูกต้อง

---

**เอกสารนี้สร้างโดย:** Kiro AI Assistant  
**วันที่:** 17 พฤศจิกายน 2025
