/**
 * Import ข้อมูลจาก Excel ด้วย better-sqlite3 (synchronous)
 */

const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const excelPath = 'ส่งข้อมูลPOS.xlsx';

// Cross-platform database path
const os = require('os');
let dbPath;

if (process.platform === 'win32') {
  // Windows: %APPDATA%/poslos/pos.db
  dbPath = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'poslos', 'pos.db');
} else if (process.platform === 'darwin') {
  // macOS: ~/Library/Application Support/poslos/pos.db
  dbPath = path.join(os.homedir(), 'Library', 'Application Support', 'poslos', 'pos.db');
} else {
  // Linux: ~/.config/poslos/pos.db
  dbPath = path.join(os.homedir(), '.config', 'poslos', 'pos.db');
}

// สร้าง directory ถ้ายังไม่มี
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('📊 Starting import from Excel...');
console.log('📁 Excel:', excelPath);
console.log('📁 Database:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

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

try {
  console.log('\n🔄 Starting import...\n');

  // 1. BRANCH
  console.log('📦 Importing BRANCH...');
  const branches = getSheetData('BRANCH', 2, 3);
  db.prepare('DELETE FROM branches').run();
  const insertBranch = db.prepare(`
    INSERT INTO branches (id, code, name, address, phone, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  for (const row of branches) {
    if (!row.BRANCH_CODE) continue;
    insertBranch.run(uuidv4(), row.BRANCH_CODE, row.BRANCH_NAME, row.Branch_address, row.Branch_TEL);
  }
  console.log(`✅ Imported ${branches.length} branches`);

  // 2. ICCAT
  console.log('\n📦 Importing ICCAT (Categories)...');
  const categories = getSheetData('ICCAT', 0, 1);
  db.prepare('DELETE FROM categories').run();
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, code, name, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  for (const row of categories) {
    if (!row.ICCAT_CODE || row.ICCAT_CODE === 0) continue;
    insertCategory.run(uuidv4(), row.ICCAT_CODE, row.ICCAT_NAME);
  }
  console.log(`✅ Imported ${categories.length} categories`);

  // 3. SKUMASTER - สินค้าหลัก
  console.log('\n📦 Importing SKUMASTER (Products)...');
  const products = getSheetData('SKUMASTER', 3, 4);
  db.prepare('DELETE FROM products').run();
  
  const productMap = new Map();
  const skuSet = new Set();
  let skipped = 0;
  
  const insertProduct = db.prepare(`
    INSERT INTO products (id, sku, name, nameEn, nameLo, category, description, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  
  // Debug first row
  if (products.length > 0) {
    console.log('   First product:', products[0]);
  }
  
  for (const row of products) {
    if (!row.SKU_CODE) continue;
    
    if (skuSet.has(row.SKU_CODE)) {
      skipped++;
      continue;
    }
    skuSet.add(row.SKU_CODE);
    
    const productId = uuidv4();
    const skuKey = parseInt(String(row.SKU_KEY).trim());
    if (!isNaN(skuKey)) {
      productMap.set(skuKey, productId);
    }
    
    insertProduct.run(
      productId,
      row.SKU_CODE,
      row.SKU_NAME,
      row.SKU_NAME_EN || row.SKU_NAME,
      row.SKU_NAME_LO || row.SKU_NAME,
      row.SKU_ICCAT,
      row.SKU_ICDEPT
    );
  }
  console.log(`✅ Imported ${products.length - skipped} products (skipped ${skipped} duplicates)`);
  console.log(`   ProductMap size: ${productMap.size}`);

  // 4. UOFQTY
  console.log('\n📦 Importing UOFQTY (Units)...');
  const units = getSheetData('UOFQTY', 2, 3);
  const unitMap = new Map();
  
  for (const row of units) {
    if (!row.UTQ_NAME) continue;
    unitMap.set(row.UTQ_KEY, {
      name: row.UTQ_NAME,
      qty: parseFloat(row.UTQ_QTY) || 1
    });
  }
  console.log(`✅ Loaded ${units.length} unit definitions`);

  // 5. GOODSMASTER
  console.log('\n📦 Importing GOODSMASTER (Product Units)...');
  const goods = getSheetData('GOODSMASTER', 3, 4);
  db.prepare('DELETE FROM product_units').run();
  
  const goodsMap = new Map();
  let goodsInserted = 0;
  let goodsSkipped = 0;
  
  const insertUnit = db.prepare(`
    INSERT INTO product_units (id, productId, unitCode, unitName, unitNameEn, unitNameLo, conversionRate, barcode, isBaseUnit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  
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
    
    insertUnit.run(
      unitId,
      productId,
      row.GOODS_CODE,
      unitInfo.name,
      unitInfo.name,
      unitInfo.name,
      unitInfo.qty,
      row.GOODS_CODE
    );
    goodsInserted++;
  }
  console.log(`✅ Imported ${goodsInserted} product units (skipped ${goodsSkipped})`);

  // 6. ARPLU - ราคา
  console.log('\n📦 Importing ARPLU (Prices)...');
  const prices = getSheetData('ARPLU', 2, 3);
  db.prepare('DELETE FROM product_prices').run();
  
  let priceCount = 0;
  let priceSkipped = 0;
  
  const insertPrice = db.prepare(`
    INSERT INTO product_prices (id, productId, unitId, priceLevel, price, effectiveDate)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  
  const getProductId = db.prepare('SELECT productId FROM product_units WHERE id = ?');
  
  for (const row of prices) {
    if (!row.ARPLU_GOODS) continue;
    
    const goodsKey = parseInt(String(row.ARPLU_GOODS).trim());
    const unitId = goodsMap.get(goodsKey);
    if (!unitId) {
      priceSkipped++;
      continue;
    }
    
    let priceStr = row.ARPLU_PRC_K;
    if (!priceStr) continue;
    
    priceStr = priceStr.toString().replace(/,/g, '').trim();
    const price = parseFloat(priceStr);
    
    if (isNaN(price) || price <= 0) continue;
    
    const result = getProductId.get(unitId);
    if (result && result.productId) {
      const priceLevel = row.ARPLU_ARPRB ? parseInt(row.ARPLU_ARPRB) : 1;
      insertPrice.run(uuidv4(), result.productId, unitId, priceLevel, price);
      priceCount++;
    } else {
      priceSkipped++;
    }
  }
  console.log(`✅ Imported ${priceCount} prices (skipped ${priceSkipped})`);

  // แสดงสถิติ
  console.log('\n📊 Database Statistics:');
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM products) as products,
      (SELECT COUNT(*) FROM product_units) as units,
      (SELECT COUNT(*) FROM product_prices) as prices
  `).get();
  
  console.log(`   Products: ${stats.products}`);
  console.log(`   Product Units: ${stats.units}`);
  console.log(`   Prices: ${stats.prices}`);
  
  console.log('\n✅ Import completed successfully!');
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} finally {
  db.close();
  console.log('\n✅ Database closed');
}
