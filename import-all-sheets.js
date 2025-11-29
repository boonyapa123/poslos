/**
 * Import ข้อมูลจาก Excel ทั้ง 15 ชีทเข้า Database
 */

const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const excelPath = 'ส่งข้อมูลPOS.xlsx';
const dbPath = path.join(
  process.env.HOME,
  'Library/Application Support/poslos/pos.db'
);

console.log('📊 Starting import from Excel...');
console.log('📁 Excel:', excelPath);
console.log('📁 Database:', dbPath);

const db = new sqlite3.Database(dbPath);
db.run('PRAGMA journal_mode = WAL'); // Enable WAL mode
db.run('PRAGMA synchronous = NORMAL'); // Faster writes

// อ่านไฟล์ Excel
const workbook = XLSX.readFile(excelPath);
console.log('✅ Excel file loaded');
console.log('📋 Sheets:', workbook.SheetNames.join(', '));

// Helper function
function getSheetData(sheetName, headerRow = 2, startRow = 3) {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { 
    header: 1, 
    defval: null,
    raw: false 
  });
  
  if (data.length <= headerRow) return [];
  
  const headers = data[headerRow];
  const rows = [];
  
  for (let i = startRow; i < data.length; i++) {
    if (!data[i] || data[i].every(cell => cell === null || cell === '')) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      if (header) {
        row[header] = data[i][index];
      }
    });
    rows.push(row);
  }
  
  return rows;
}

async function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function importData() {
  try {
    // 1. BRANCH - สาขา
    console.log('\n📦 Importing BRANCH...');
    const branches = getSheetData('BRANCH', 2, 3);
    await runAsync('DELETE FROM branches');
    
    for (const row of branches) {
      if (!row.BRANCH_CODE) continue;
      await runAsync(
        `INSERT INTO branches (id, code, name, address, phone, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [uuidv4(), row.BRANCH_CODE, row.BRANCH_NAME, row.Branch_address, row.Branch_TEL]
      );
    }
    console.log(`✅ Imported ${branches.length} branches`);

    // 2. ICCAT - หมวดหมู่หลัก
    console.log('\n📦 Importing ICCAT (Categories)...');
    const categories = getSheetData('ICCAT', 0, 1);
    await runAsync('DELETE FROM categories');
    
    for (const row of categories) {
      if (!row.ICCAT_CODE || row.ICCAT_CODE === 0) continue;
      await runAsync(
        `INSERT INTO categories (id, code, name, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [uuidv4(), row.ICCAT_CODE, row.ICCAT_NAME]
      );
    }
    console.log(`✅ Imported ${categories.length} categories`);

    // 3. ICDEPT - หมวดหมู่ย่อย/แผนก
    console.log('\n📦 Importing ICDEPT (Departments)...');
    const departments = getSheetData('ICDEPT', 3, 4);
    await runAsync('DELETE FROM departments');
    
    let deptCount = 0;
    const deptCodeSet = new Set();
    for (const row of departments) {
      if (!row.ICDEPT_NAME) continue;
      
      // สร้าง code ไม่ซ้ำ
      let code = row.ICDEPT_KEY || `DEPT${deptCount}`;
      while (deptCodeSet.has(code)) {
        deptCount++;
        code = `DEPT${deptCount}`;
      }
      deptCodeSet.add(code);
      
      await runAsync(
        `INSERT INTO departments (id, code, name, level, categoryCode, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [uuidv4(), code, row.ICDEPT_NAME, row.ICDEPT_LEVEL, row.ICDEPT_ICCAT]
      );
      deptCount++;
    }
    console.log(`✅ Imported ${deptCount} departments`);

    // 4. WARELOCATION - คลังสินค้า
    console.log('\n📦 Importing WARELOCATION (Warehouses)...');
    const warehouses = getSheetData('WARELOCATION', 2, 3);
    await runAsync('DELETE FROM warehouses');
    
    for (const row of warehouses) {
      if (!row.WL_NAME) continue;
      await runAsync(
        `INSERT INTO warehouses (id, name, branchCode, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [uuidv4(), row.WL_NAME, row.WL_BRANCH]
      );
    }
    console.log(`✅ Imported ${warehouses.length} warehouses`);

    // 5. ARFILE - ลูกค้า
    console.log('\n📦 Importing ARFILE (Customers)...');
    const customers = getSheetData('ARFILE', 2, 3);
    await runAsync('DELETE FROM customers');
    
    for (const row of customers) {
      if (!row.AR_CODE) continue;
      await runAsync(
        `INSERT INTO customers (id, code, name, priceLevel, branch, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [uuidv4(), row.AR_CODE, row.AR_NAME, row.AR_ARPRB || 1, row.AR_BRANCH]
      );
    }
    console.log(`✅ Imported ${customers.length} customers`);

    // 6. USER - พนักงานขาย
    console.log('\n📦 Importing USER (Employees)...');
    const employees = getSheetData('USER', 2, 3);
    await runAsync('DELETE FROM employees');
    
    for (const row of employees) {
      if (!row.USER_CODE) continue;
      await runAsync(
        `INSERT INTO employees (id, code, name, type, branchCode, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, 'SALES', ?, 1, datetime('now'), datetime('now'))`,
        [uuidv4(), row.USER_CODE, row.USER_NAME, row.USER_BRANCH]
      );
    }
    console.log(`✅ Imported ${employees.length} employees`);

    // 7. BANK - บัญชีธนาคาร
    console.log('\n📦 Importing BANK...');
    const banks = getSheetData('BANK', 2, 3);
    await runAsync('DELETE FROM bank_accounts');
    
    for (const row of banks) {
      if (!row.BANK_CODE) continue;
      await runAsync(
        `INSERT INTO bank_accounts (id, code, name, branchCode, bankCode, bankName, currency, accountNumber, accountName, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [uuidv4(), row.BANK_CODE, row.BANK_NAME, row.BRANCH, row.BANK_CODE, row.BANK_NAME, row['BANK_Ccy'], row['BANK_A/C_No'], row['BANK_A/C_NAME']]
      );
    }
    console.log(`✅ Imported ${banks.length} bank accounts`);

    // 8. SKUMASTER - สินค้าหลัก
    console.log('\n📦 Importing SKUMASTER (Products)...');
    const products = getSheetData('SKUMASTER', 2, 3);
    await runAsync('DELETE FROM products');
    
    const productMap = new Map(); // เก็บ SKU_KEY -> product id
    const skuSet = new Set(); // ตรวจสอบ SKU ซ้ำ
    let skipped = 0;
    
    for (const row of products) {
      if (!row.SKU_CODE) continue;
      
      // ข้าม SKU ซ้ำ
      if (skuSet.has(row.SKU_CODE)) {
        skipped++;
        continue;
      }
      skuSet.add(row.SKU_CODE);
      
      const productId = uuidv4();
      const skuKey = parseInt(String(row.SKU_KEY).trim());
      productMap.set(skuKey, productId);
      
      await runAsync(
        `INSERT INTO products (id, sku, name, nameEn, nameLo, category, description, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
        [productId, row.SKU_CODE, row.SKU_NAME, row.SKU_NAME, row.SKU_NAME, row.SKU_ICCAT, row.SKU_ICDEPT]
      );
    }
    console.log(`✅ Imported ${products.length - skipped} products (skipped ${skipped} duplicates)`);

    // 9. UOFQTY - หน่วยนับ (ต้อง import ก่อน GOODSMASTER)
    console.log('\n📦 Importing UOFQTY (Units)...');
    const units = getSheetData('UOFQTY', 2, 3);
    const unitMap = new Map(); // เก็บ UTQ_KEY -> unit info
    
    for (const row of units) {
      if (!row.UTQ_NAME) continue;
      unitMap.set(row.UTQ_KEY, {
        name: row.UTQ_NAME,
        qty: parseFloat(row.UTQ_QTY) || 1
      });
    }
    console.log(`✅ Loaded ${units.length} unit definitions`);

    // 10. GOODSMASTER - รหัสซื้อขาย (Product Units)
    console.log('\n📦 Importing GOODSMASTER (Product Units)...');
    const goods = getSheetData('GOODSMASTER', 2, 3);
    await runAsync('DELETE FROM product_units');
    
    const goodsMap = new Map(); // เก็บ GOODS_KEY -> unit id
    let goodsInserted = 0;
    let goodsSkipped = 0;
    
    for (const row of goods) {
      if (!row.GOODS_CODE || !row.GOODS_SKU) {
        goodsSkipped++;
        continue;
      }
      
      const skuKey = parseInt(String(row.GOODS_SKU).trim());
      const productId = productMap.get(skuKey);
      if (!productId) {
        goodsSkipped++;
        continue;
      }
      
      const utqKey = parseInt(String(row.GOODS_UTQ).trim());
      const unitInfo = unitMap.get(utqKey) || { name: 'อัน', qty: 1 };
      const unitId = uuidv4();
      const goodsKey = parseInt(String(row.GOODS_KEY).trim());
      goodsMap.set(goodsKey, unitId);
      
      try {
        await runAsync(
          `INSERT INTO product_units (id, productId, unitCode, unitName, unitNameEn, unitNameLo, conversionRate, barcode, isBaseUnit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [unitId, productId, row.GOODS_CODE, unitInfo.name, unitInfo.name, unitInfo.name, unitInfo.qty, row.GOODS_CODE]
        );
        goodsInserted++;
      } catch (err) {
        if (goodsSkipped < 5) {
          console.error(`  Error inserting goods ${row.GOODS_KEY}:`, err.message);
        }
        goodsSkipped++;
      }
    }
    console.log(`✅ Imported ${goodsInserted} product units (skipped ${goodsSkipped})`);

    // 11. ARPLU - ราคาสินค้า
    console.log('\n📦 Importing ARPLU (Prices)...');
    const prices = getSheetData('ARPLU', 2, 3);
    await runAsync('DELETE FROM product_prices');
    
    let priceCount = 0;
    let priceSkipped = 0;
    
    for (const row of prices) {
      if (!row.ARPLU_GOODS) continue;
      
      const goodsKey = parseInt(String(row.ARPLU_GOODS).trim());
      const unitId = goodsMap.get(goodsKey);
      if (!unitId) {
        priceSkipped++;
        continue;
      }
      
      // ทำความสะอาดราคา (ลบ comma และช่องว่าง)
      let priceStr = row.ARPLU_PRC_K;
      if (!priceStr) continue;
      
      priceStr = priceStr.toString().replace(/,/g, '').trim();
      const price = parseFloat(priceStr);
      
      if (isNaN(price) || price <= 0) continue;
      
      try {
        // ดึง productId จาก product_units
        const result = await new Promise((resolve, reject) => {
          db.get('SELECT productId FROM product_units WHERE id = ?', [unitId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (result && result.productId) {
          // ARPLU_ARPRB = 0 หรือ null ใช้ priceLevel = 1 (ราคาปกติ)
          const priceLevel = row.ARPLU_ARPRB ? parseInt(row.ARPLU_ARPRB) : 1;
          
          await runAsync(
            `INSERT INTO product_prices (id, productId, unitId, priceLevel, price, effectiveDate)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`,
            [uuidv4(), result.productId, unitId, priceLevel, price]
          );
          priceCount++;
        }
      } catch (err) {
        priceSkipped++;
      }
    }
    console.log(`✅ Imported ${priceCount} prices (skipped ${priceSkipped})`);
    
    // รอให้ commit เสร็จ
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // แสดงสถิติ
    console.log('\n📊 Database Statistics:');
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          (SELECT COUNT(*) FROM products) as products,
          (SELECT COUNT(*) FROM product_units) as units,
          (SELECT COUNT(*) FROM product_prices) as prices,
          (SELECT COUNT(*) FROM customers) as customers,
          (SELECT COUNT(*) FROM employees) as employees,
          (SELECT COUNT(*) FROM branches) as branches,
          (SELECT COUNT(*) FROM categories) as categories,
          (SELECT COUNT(*) FROM departments) as departments,
          (SELECT COUNT(*) FROM warehouses) as warehouses,
          (SELECT COUNT(*) FROM bank_accounts) as banks
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    console.log('\n✅ Import completed successfully!');
    
    console.log(`   Products: ${stats.products}`);
    console.log(`   Product Units: ${stats.units}`);
    console.log(`   Prices: ${stats.prices}`);
    console.log(`   Customers: ${stats.customers}`);
    console.log(`   Employees: ${stats.employees}`);
    console.log(`   Branches: ${stats.branches}`);
    console.log(`   Categories: ${stats.categories}`);
    console.log(`   Departments: ${stats.departments}`);
    console.log(`   Warehouses: ${stats.warehouses}`);
    console.log(`   Bank Accounts: ${stats.banks}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run import
importData()
  .then(() => {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error('Error closing database:', err);
        console.log('\n✅ Database closed');
        resolve();
      });
    });
  })
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    db.close(() => {
      process.exit(1);
    });
  });
