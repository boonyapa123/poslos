/**
 * สร้าง pos-template.db จากไฟล์ Excel
 * ใช้ sqlite3 โดยตรง (ไม่ต้อง rebuild)
 */

const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const excelPath = 'ส่งข้อมูลPOS.xlsx';
const dbPath = 'pos-template.db';

// ลบไฟล์เก่าถ้ามี
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Removed old template database');
}

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  }

  console.log('📊 Creating template database from Excel...');

  try {
    await createTables();
    await importData();
    
    db.close(() => {
      const stats = fs.statSync(dbPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ Template database created: ${dbPath} (${sizeMB} MB)`);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});

function createTables() {
  return new Promise((resolve, reject) => {
    console.log('📦 Creating tables...');
    
    const sql = `
      CREATE TABLE branches (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, address TEXT, phone TEXT, isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE categories (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE departments (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE warehouses (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, location TEXT, isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE products (id TEXT PRIMARY KEY, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, nameEn TEXT, nameLo TEXT, category TEXT, description TEXT, isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE product_units (id TEXT PRIMARY KEY, productId TEXT NOT NULL, unitCode TEXT NOT NULL, unitName TEXT NOT NULL, unitNameEn TEXT, unitNameLo TEXT, conversionRate REAL DEFAULT 1, barcode TEXT, isBaseUnit INTEGER DEFAULT 1, FOREIGN KEY (productId) REFERENCES products(id));
      CREATE TABLE product_prices (id TEXT PRIMARY KEY, productId TEXT NOT NULL, unitId TEXT NOT NULL, priceLevel INTEGER DEFAULT 1, price REAL NOT NULL, effectiveDate TEXT, FOREIGN KEY (productId) REFERENCES products(id), FOREIGN KEY (unitId) REFERENCES product_units(id));
      CREATE TABLE customers (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, address TEXT, phone TEXT, email TEXT, priceLevel INTEGER DEFAULT 1, creditLimit REAL DEFAULT 0, isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE employees (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, username TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'CASHIER', isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE bank_accounts (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, bankName TEXT NOT NULL, accountNumber TEXT, accountName TEXT, branchName TEXT, isActive INTEGER DEFAULT 1, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE transactions (id TEXT PRIMARY KEY, transactionNumber TEXT UNIQUE NOT NULL, terminalId TEXT, shiftId TEXT, customerId TEXT, transactionDate TEXT NOT NULL, subtotal REAL NOT NULL, vatAmount REAL DEFAULT 0, vatType TEXT DEFAULT 'INCLUSIVE', vatRate REAL DEFAULT 7, discount REAL DEFAULT 0, grandTotal REAL NOT NULL, paymentMethod TEXT, status TEXT DEFAULT 'COMPLETED', isSynced INTEGER DEFAULT 0, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE transaction_items (id TEXT PRIMARY KEY, transactionId TEXT NOT NULL, productId TEXT NOT NULL, productSku TEXT NOT NULL, productName TEXT NOT NULL, productNameEn TEXT, productNameLo TEXT, unitId TEXT NOT NULL, unitName TEXT NOT NULL, quantity REAL NOT NULL, unitPrice REAL NOT NULL, lineTotal REAL NOT NULL, discount REAL DEFAULT 0, lineNumber INTEGER NOT NULL, FOREIGN KEY (transactionId) REFERENCES transactions(id));
      CREATE TABLE shifts (id TEXT PRIMARY KEY, shiftNumber TEXT UNIQUE NOT NULL, terminalId TEXT, startTime TEXT NOT NULL, endTime TEXT, openingCash REAL DEFAULT 0, closingCash REAL DEFAULT 0, totalSales REAL DEFAULT 0, status TEXT DEFAULT 'OPEN', createdAt TEXT, updatedAt TEXT);
      CREATE TABLE configurations (key TEXT PRIMARY KEY, value TEXT, description TEXT, createdAt TEXT, updatedAt TEXT);
      CREATE TABLE sync_logs (id TEXT PRIMARY KEY, syncType TEXT NOT NULL, status TEXT NOT NULL, recordCount INTEGER DEFAULT 0, errorMessage TEXT, syncedAt TEXT NOT NULL);
    `;

    db.exec(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('✅ Tables created');
        resolve();
      }
    });
  });
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getSheetData(workbook, sheetName, headerRow = 2, startRow = 3) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  
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

async function importData() {
  console.log('\n🔄 Importing data...\n');

  const workbook = XLSX.readFile(excelPath);

  // 1. BRANCH
  console.log('📦 Importing BRANCH...');
  const branches = getSheetData(workbook, 'BRANCH', 2, 3);
  for (const row of branches) {
    if (!row.BRANCH_CODE) continue;
    await runAsync(
      `INSERT INTO branches (id, code, name, address, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [generateUUID(), row.BRANCH_CODE, row.BRANCH_NAME, row.Branch_address || null, row.Branch_TEL || null]
    );
  }
  console.log(`   ✅ ${branches.length} branches`);

  // 2. ICCAT
  console.log('📦 Importing ICCAT...');
  const categories = getSheetData(workbook, 'ICCAT', 1, 2);
  for (const row of categories) {
    if (!row.ICCAT_CODE) continue;
    await runAsync(
      `INSERT INTO categories (id, code, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [generateUUID(), row.ICCAT_CODE, row.ICCAT_NAME]
    );
  }
  console.log(`   ✅ ${categories.length} categories`);

  // 3. ICDEPT
  console.log('📦 Importing ICDEPT...');
  const departments = getSheetData(workbook, 'ICDEPT', 1, 2);
  for (const row of departments) {
    if (!row.ICDEPT_CODE) continue;
    await runAsync(
      `INSERT INTO departments (id, code, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [generateUUID(), row.ICDEPT_CODE, row.ICDEPT_NAME]
    );
  }
  console.log(`   ✅ ${departments.length} departments`);

  // 4. WARELOCATION
  console.log('📦 Importing WARELOCATION...');
  const warehouses = getSheetData(workbook, 'WARELOCATION', 1, 2);
  for (const row of warehouses) {
    if (!row.WARE_CODE) continue;
    await runAsync(
      `INSERT INTO warehouses (id, code, name, location, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [generateUUID(), row.WARE_CODE, row.WARE_NAME, row.WARE_LOCATION || null]
    );
  }
  console.log(`   ✅ ${warehouses.length} warehouses`);

  // 5. SKUMASTER
  console.log('📦 Importing SKUMASTER...');
  const products = getSheetData(workbook, 'SKUMASTER', 3, 4);
  const productMap = new Map();
  const skuSet = new Set();

  for (const row of products) {
    if (!row.SKU_CODE || skuSet.has(row.SKU_CODE)) continue;
    skuSet.add(row.SKU_CODE);
    
    const productId = generateUUID();
    const skuKey = parseInt(String(row.SKU_KEY).trim());
    if (!isNaN(skuKey)) {
      productMap.set(skuKey, productId);
    }
    
    await runAsync(
      `INSERT INTO products (id, sku, name, nameEn, nameLo, category, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [productId, row.SKU_CODE, row.SKU_NAME, row.SKU_NAME_EN || row.SKU_NAME, row.SKU_NAME_LO || row.SKU_NAME, row.SKU_ICCAT || null, row.SKU_ICDEPT || null]
    );
  }
  console.log(`   ✅ ${skuSet.size} products`);

  // 6. UOFQTY
  console.log('📦 Processing UOFQTY...');
  const units = getSheetData(workbook, 'UOFQTY', 2, 3);
  const unitMap = new Map();

  for (const row of units) {
    if (!row.UTQ_NAME) continue;
    unitMap.set(row.UTQ_KEY, {
      name: row.UTQ_NAME,
      qty: parseFloat(row.UTQ_QTY) || 1
    });
  }
  console.log(`   ✅ ${units.length} unit types`);

  // 7. GOODSMASTER
  console.log('📦 Importing GOODSMASTER...');
  const goods = getSheetData(workbook, 'GOODSMASTER', 3, 4);
  const goodsMap = new Map();
  let goodsCount = 0;

  for (const row of goods) {
    if (!row.GOODS_CODE || !row.GOODS_SKU) continue;
    
    const skuKey = parseInt(String(row.GOODS_SKU).trim());
    const productId = productMap.get(skuKey);
    if (!productId) continue;
    
    const utqKey = parseInt(String(row.GOODS_UTQ).trim());
    const unitInfo = unitMap.get(utqKey) || { name: 'อัน', qty: 1 };
    const unitId = generateUUID();
    const goodsKey = parseInt(String(row.GOODS_KEY).trim());
    goodsMap.set(goodsKey, { unitId, productId });
    
    await runAsync(
      `INSERT INTO product_units (id, productId, unitCode, unitName, unitNameEn, unitNameLo, conversionRate, barcode, isBaseUnit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [unitId, productId, row.GOODS_CODE, unitInfo.name, unitInfo.name, unitInfo.name, unitInfo.qty, row.GOODS_CODE]
    );
    goodsCount++;
  }
  console.log(`   ✅ ${goodsCount} product units`);

  // 8. ARPLU
  console.log('📦 Importing ARPLU...');
  const prices = getSheetData(workbook, 'ARPLU', 2, 3);
  let priceCount = 0;

  for (const row of prices) {
    if (!row.ARPLU_GOODS) continue;
    
    const goodsKey = parseInt(String(row.ARPLU_GOODS).trim());
    const goodsInfo = goodsMap.get(goodsKey);
    if (!goodsInfo) continue;
    
    let priceStr = row.ARPLU_PRC_K;
    if (!priceStr) continue;
    
    priceStr = priceStr.toString().replace(/,/g, '').trim();
    const price = parseFloat(priceStr);
    
    if (isNaN(price) || price <= 0) continue;
    
    const priceLevel = row.ARPLU_ARPRB ? parseInt(row.ARPLU_ARPRB) : 1;
    await runAsync(
      `INSERT INTO product_prices (id, productId, unitId, priceLevel, price, effectiveDate) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [generateUUID(), goodsInfo.productId, goodsInfo.unitId, priceLevel, price]
    );
    priceCount++;
  }
  console.log(`   ✅ ${priceCount} prices`);

  // 9. ARFILE
  console.log('📦 Importing ARFILE...');
  const customers = getSheetData(workbook, 'ARFILE', 3, 4);
  for (const row of customers) {
    if (!row.AR_CODE) continue;
    await runAsync(
      `INSERT INTO customers (id, code, name, address, phone, email, priceLevel, creditLimit, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [generateUUID(), row.AR_CODE, row.AR_NAME, row.AR_ADD1 || null, row.AR_TEL || null, row.AR_EMAIL || null, row.AR_ARPRB || 1, row.AR_CREDIT || 0]
    );
  }
  console.log(`   ✅ ${customers.length} customers`);

  // 10. USER
  console.log('📦 Importing USER...');
  const users = getSheetData(workbook, 'USER', 2, 3);
  for (const row of users) {
    if (!row.USER_CODE) continue;
    await runAsync(
      `INSERT INTO employees (id, code, name, username, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [generateUUID(), row.USER_CODE, row.USER_NAME, row.USER_LOGIN || null, row.USER_PASSWORD || null, row.USER_LEVEL || 'CASHIER']
    );
  }
  console.log(`   ✅ ${users.length} employees`);

  // 11. BANK
  console.log('📦 Importing BANK...');
  const banks = getSheetData(workbook, 'BANK', 2, 3);
  for (const row of banks) {
    if (!row.BANK_CODE) continue;
    await runAsync(
      `INSERT INTO bank_accounts (id, code, bankName, accountNumber, accountName, branchName, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [generateUUID(), row.BANK_CODE, row.BANK_NAME, row.BANK_ACCOUNT || null, row.BANK_ACC_NAME || null, row.BANK_BRANCH || null]
    );
  }
  console.log(`   ✅ ${banks.length} banks`);

  console.log('\n📊 Summary:');
  console.log(`   Branches: ${branches.length}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Departments: ${departments.length}`);
  console.log(`   Warehouses: ${warehouses.length}`);
  console.log(`   Products: ${skuSet.size}`);
  console.log(`   Product Units: ${goodsCount}`);
  console.log(`   Prices: ${priceCount}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Employees: ${users.length}`);
  console.log(`   Banks: ${banks.length}`);
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}
