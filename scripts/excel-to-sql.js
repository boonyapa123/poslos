/**
 * อ่านข้อมูลจาก Excel และสร้างไฟล์ SQL
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = 'ส่งข้อมูลPOS.xlsx';
const outputPath = 'data/seed.sql';

console.log('📊 Reading Excel file...');
const workbook = XLSX.readFile(excelPath);

// สร้างโฟลเดอร์ data ถ้ายังไม่มี
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}

let sql = `-- Generated from ${excelPath}
-- Date: ${new Date().toISOString()}
-- Complete database with schema and data

-- ============================================
-- CREATE TABLES
-- ============================================

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nameEn TEXT,
  nameLo TEXT,
  category TEXT,
  description TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Product Units
CREATE TABLE IF NOT EXISTS product_units (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  unitCode TEXT NOT NULL,
  unitName TEXT NOT NULL,
  unitNameEn TEXT,
  unitNameLo TEXT,
  conversionRate REAL DEFAULT 1,
  barcode TEXT,
  isBaseUnit INTEGER DEFAULT 1,
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Product Prices
CREATE TABLE IF NOT EXISTS product_prices (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  unitId TEXT NOT NULL,
  priceLevel INTEGER DEFAULT 1,
  price REAL NOT NULL,
  effectiveDate TEXT,
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (unitId) REFERENCES product_units(id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  priceLevel INTEGER DEFAULT 1,
  creditLimit REAL DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'CASHIER',
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  bankName TEXT NOT NULL,
  accountNumber TEXT,
  accountName TEXT,
  branchName TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  transactionNumber TEXT UNIQUE NOT NULL,
  terminalId TEXT,
  shiftId TEXT,
  customerId TEXT,
  transactionDate TEXT NOT NULL,
  subtotal REAL NOT NULL,
  vatAmount REAL DEFAULT 0,
  vatType TEXT DEFAULT 'INCLUSIVE',
  vatRate REAL DEFAULT 7,
  discount REAL DEFAULT 0,
  grandTotal REAL NOT NULL,
  paymentMethod TEXT,
  status TEXT DEFAULT 'COMPLETED',
  isSynced INTEGER DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);

-- Transaction Items
CREATE TABLE IF NOT EXISTS transaction_items (
  id TEXT PRIMARY KEY,
  transactionId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productSku TEXT NOT NULL,
  productName TEXT NOT NULL,
  productNameEn TEXT,
  productNameLo TEXT,
  unitId TEXT NOT NULL,
  unitName TEXT NOT NULL,
  quantity REAL NOT NULL,
  unitPrice REAL NOT NULL,
  lineTotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  lineNumber INTEGER NOT NULL,
  FOREIGN KEY (transactionId) REFERENCES transactions(id)
);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  shiftNumber TEXT UNIQUE NOT NULL,
  terminalId TEXT,
  startTime TEXT NOT NULL,
  endTime TEXT,
  openingCash REAL DEFAULT 0,
  closingCash REAL DEFAULT 0,
  totalSales REAL DEFAULT 0,
  status TEXT DEFAULT 'OPEN',
  createdAt TEXT,
  updatedAt TEXT
);

-- Configuration
CREATE TABLE IF NOT EXISTS configurations (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Sync Logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  syncType TEXT NOT NULL,
  status TEXT NOT NULL,
  recordCount INTEGER DEFAULT 0,
  errorMessage TEXT,
  syncedAt TEXT NOT NULL
);

-- ============================================
-- INSERT DATA
-- ============================================

`;

// Helper function
function getSheetData(sheetName, headerRow = 2, startRow = 3) {
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

function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

console.log('\n🔄 Processing sheets...\n');

// Clear all tables first
sql += `-- Clear existing data\n`;
sql += `DELETE FROM categories;\n`;
sql += `DELETE FROM branches;\n`;
sql += `\n`;

// 1. BRANCH
console.log('📦 Processing BRANCH...');
const branches = getSheetData('BRANCH', 2, 3);
sql += `-- BRANCH (${branches.length} records)\n`;
branches.forEach(row => {
  if (!row.BRANCH_CODE) return;
  sql += `INSERT INTO branches (id, code, name, address, phone, isActive, createdAt, updatedAt) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(row.BRANCH_CODE)}, ${escapeSQL(row.BRANCH_NAME)}, ${escapeSQL(row.Branch_address)}, ${escapeSQL(row.Branch_TEL)}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 2. ICCAT
console.log('📦 Processing ICCAT...');
const categories = getSheetData('ICCAT', 1, 2);
sql += `-- ICCAT (${categories.length} records)\n`;
categories.forEach(row => {
  if (!row.ICCAT_CODE) return;
  sql += `INSERT INTO categories (id, code, name, isActive, createdAt, updatedAt) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(row.ICCAT_CODE)}, ${escapeSQL(row.ICCAT_NAME)}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 3. SKUMASTER
console.log('📦 Processing SKUMASTER...');
const products = getSheetData('SKUMASTER', 3, 4);
sql += `-- SKUMASTER (${products.length} records)\n`;

const productMap = new Map();
const skuSet = new Set();

products.forEach(row => {
  if (!row.SKU_CODE || skuSet.has(row.SKU_CODE)) return;
  skuSet.add(row.SKU_CODE);
  
  const productId = generateUUID();
  const skuKey = parseInt(String(row.SKU_KEY).trim());
  if (!isNaN(skuKey)) {
    productMap.set(skuKey, productId);
  }
  
  sql += `INSERT INTO products (id, sku, name, nameEn, nameLo, category, description, isActive, createdAt, updatedAt) VALUES (${escapeSQL(productId)}, ${escapeSQL(row.SKU_CODE)}, ${escapeSQL(row.SKU_NAME)}, ${escapeSQL(row.SKU_NAME_EN || row.SKU_NAME)}, ${escapeSQL(row.SKU_NAME_LO || row.SKU_NAME)}, ${escapeSQL(row.SKU_ICCAT)}, ${escapeSQL(row.SKU_ICDEPT)}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 4. UOFQTY
console.log('📦 Processing UOFQTY...');
const units = getSheetData('UOFQTY', 2, 3);
const unitMap = new Map();

units.forEach(row => {
  if (!row.UTQ_NAME) return;
  unitMap.set(row.UTQ_KEY, {
    name: row.UTQ_NAME,
    qty: parseFloat(row.UTQ_QTY) || 1
  });
});

// 5. GOODSMASTER
console.log('📦 Processing GOODSMASTER...');
const goods = getSheetData('GOODSMASTER', 3, 4);
sql += `-- GOODSMASTER (${goods.length} records)\n`;

const goodsMap = new Map();

goods.forEach(row => {
  if (!row.GOODS_CODE || !row.GOODS_SKU) return;
  
  const skuKey = parseInt(String(row.GOODS_SKU).trim());
  const productId = productMap.get(skuKey);
  if (!productId) return;
  
  const utqKey = parseInt(String(row.GOODS_UTQ).trim());
  const unitInfo = unitMap.get(utqKey) || { name: 'อัน', qty: 1 };
  const unitId = generateUUID();
  const goodsKey = parseInt(String(row.GOODS_KEY).trim());
  goodsMap.set(goodsKey, { unitId, productId });
  
  sql += `INSERT INTO product_units (id, productId, unitCode, unitName, unitNameEn, unitNameLo, conversionRate, barcode, isBaseUnit) VALUES (${escapeSQL(unitId)}, ${escapeSQL(productId)}, ${escapeSQL(row.GOODS_CODE)}, ${escapeSQL(unitInfo.name)}, ${escapeSQL(unitInfo.name)}, ${escapeSQL(unitInfo.name)}, ${unitInfo.qty}, ${escapeSQL(row.GOODS_CODE)}, 1);\n`;
});
sql += '\n';

// 6. ARPLU
console.log('📦 Processing ARPLU...');
const prices = getSheetData('ARPLU', 2, 3);
sql += `-- ARPLU (${prices.length} records)\n`;

prices.forEach(row => {
  if (!row.ARPLU_GOODS) return;
  
  const goodsKey = parseInt(String(row.ARPLU_GOODS).trim());
  const goodsInfo = goodsMap.get(goodsKey);
  if (!goodsInfo) return;
  
  let priceStr = row.ARPLU_PRC_K;
  if (!priceStr) return;
  
  priceStr = priceStr.toString().replace(/,/g, '').trim();
  const price = parseFloat(priceStr);
  
  if (isNaN(price) || price <= 0) return;
  
  const priceLevel = row.ARPLU_ARPRB ? parseInt(row.ARPLU_ARPRB) : 1;
  sql += `INSERT INTO product_prices (id, productId, unitId, priceLevel, price, effectiveDate) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(goodsInfo.productId)}, ${escapeSQL(goodsInfo.unitId)}, ${priceLevel}, ${price}, datetime('now'));\n`;
});

// 7. ICDEPT - แผนก
console.log('📦 Processing ICDEPT...');
const departments = getSheetData('ICDEPT', 1, 2);
sql += `-- ICDEPT (${departments.length} records)\n`;
departments.forEach(row => {
  if (!row.ICDEPT_CODE) return;
  sql += `INSERT INTO departments (id, code, name, isActive, createdAt, updatedAt) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(row.ICDEPT_CODE)}, ${escapeSQL(row.ICDEPT_NAME)}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 8. WARELOCATION - คลังสินค้า
console.log('📦 Processing WARELOCATION...');
const warehouses = getSheetData('WARELOCATION', 1, 2);
sql += `-- WARELOCATION (${warehouses.length} records)\n`;
warehouses.forEach(row => {
  if (!row.WARE_CODE) return;
  sql += `INSERT INTO warehouses (id, code, name, location, isActive, createdAt, updatedAt) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(row.WARE_CODE)}, ${escapeSQL(row.WARE_NAME)}, ${escapeSQL(row.WARE_LOCATION)}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 9. ARFILE - ลูกค้า
console.log('📦 Processing ARFILE...');
const customers = getSheetData('ARFILE', 1, 2);
sql += `-- ARFILE (${customers.length} records)\n`;
customers.forEach(row => {
  if (!row.AR_CODE) return;
  sql += `INSERT INTO customers (id, code, name, address, phone, email, priceLevel, creditLimit, isActive, createdAt, updatedAt) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(row.AR_CODE)}, ${escapeSQL(row.AR_NAME)}, ${escapeSQL(row.AR_ADD1)}, ${escapeSQL(row.AR_TEL)}, ${escapeSQL(row.AR_EMAIL)}, ${escapeSQL(row.AR_ARPRB || 1)}, ${escapeSQL(row.AR_CREDIT || 0)}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 10. USER - ผู้ใช้
console.log('📦 Processing USER...');
const users = getSheetData('USER', 2, 3);
sql += `-- USER (${users.length} records)\n`;
users.forEach(row => {
  if (!row.USER_CODE) return;
  sql += `INSERT INTO employees (id, code, name, username, password, role, isActive, createdAt, updatedAt) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(row.USER_CODE)}, ${escapeSQL(row.USER_NAME)}, ${escapeSQL(row.USER_LOGIN)}, ${escapeSQL(row.USER_PASSWORD)}, ${escapeSQL(row.USER_LEVEL || 'CASHIER')}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 11. BANK - ธนาคาร
console.log('📦 Processing BANK...');
const banks = getSheetData('BANK', 2, 3);
sql += `-- BANK (${banks.length} records)\n`;
banks.forEach(row => {
  if (!row.BANK_CODE) return;
  sql += `INSERT INTO bank_accounts (id, code, bankName, accountNumber, accountName, branchName, isActive, createdAt, updatedAt) VALUES (${escapeSQL(generateUUID())}, ${escapeSQL(row.BANK_CODE)}, ${escapeSQL(row.BANK_NAME)}, ${escapeSQL(row.BANK_ACCOUNT)}, ${escapeSQL(row.BANK_ACC_NAME)}, ${escapeSQL(row.BANK_BRANCH)}, 1, datetime('now'), datetime('now'));\n`;
});
sql += '\n';

// 12. ARPRB - ระดับราคา (ถ้ามี)
console.log('📦 Processing ARPRB...');
try {
  const priceLevels = getSheetData('ARPRB', 2, 3);
  if (priceLevels.length > 0) {
    sql += `-- ARPRB (${priceLevels.length} records)\n`;
    sql += `-- Price levels data\n`;
    priceLevels.forEach(row => {
      if (row.ARPRB_CODE) {
        sql += `-- Price Level: ${row.ARPRB_CODE} - ${row.ARPRB_NAME}\n`;
      }
    });
    sql += '\n';
  }
} catch (e) {
  console.log('   ⚠️  ARPRB sheet not found or empty');
}

// 13. SERVICE - บริการ (ถ้ามี)
console.log('📦 Processing SERVICE...');
try {
  const services = getSheetData('SERVICE', 2, 3);
  if (services.length > 0) {
    sql += `-- SERVICE (${services.length} records)\n`;
    sql += `-- Services data\n`;
    services.forEach(row => {
      if (row.SERVICE_CODE) {
        sql += `-- Service: ${row.SERVICE_CODE} - ${row.SERVICE_NAME}\n`;
      }
    });
    sql += '\n';
  }
} catch (e) {
  console.log('   ⚠️  SERVICE sheet not found or empty');
}

// 14. DOCINFO - ข้อมูลเอกสาร (ถ้ามี)
console.log('📦 Processing DOCINFO...');
try {
  const docInfo = getSheetData('DOCINFO', 2, 3);
  if (docInfo.length > 0) {
    sql += `-- DOCINFO (${docInfo.length} records)\n`;
    sql += `-- Document info data\n`;
    docInfo.forEach(row => {
      if (row.DOC_CODE) {
        sql += `-- Document: ${row.DOC_CODE}\n`;
      }
    });
    sql += '\n';
  }
} catch (e) {
  console.log('   ⚠️  DOCINFO sheet not found or empty');
}

// 15. SKUMOVE - การเคลื่อนไหวสินค้า (ข้ามไปเพราะเป็นประวัติ)
console.log('📦 Processing SKUMOVE...');
console.log('   ⏭️  Skipping SKUMOVE (transaction history)');

console.log('\n✅ Writing SQL file...');
fs.writeFileSync(outputPath, sql);

const stats = fs.statSync(outputPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`✅ SQL file created: ${outputPath} (${sizeMB} MB)`);
console.log('\n📊 Summary:');
console.log(`   Branches: ${branches.length}`);
console.log(`   Categories: ${categories.length}`);
console.log(`   Departments: ${departments.length}`);
console.log(`   Warehouses: ${warehouses.length}`);
console.log(`   Products: ${products.length}`);
console.log(`   Product Units: ${goods.length}`);
console.log(`   Prices: ${prices.length}`);
console.log(`   Customers: ${customers.length}`);
console.log(`   Users: ${users.length}`);
console.log(`   Banks: ${banks.length}`);
