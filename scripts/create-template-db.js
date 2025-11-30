/**
 * สร้าง pos-template.db จากไฟล์ Excel
 * ใช้สำหรับ production build
 */

const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const excelPath = 'ส่งข้อมูลPOS.xlsx';
const dbPath = 'pos-template.db';

console.log('📊 Creating template database from Excel...');

// ลบไฟล์เก่าถ้ามี
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Removed old template database');
}

// สร้าง database
const db = new Database(dbPath);

console.log('📦 Creating tables...');

// สร้างตาราง
db.exec(`
-- Branches
CREATE TABLE branches (
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
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Departments
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Warehouses
CREATE TABLE warehouses (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Products
CREATE TABLE products (
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
CREATE TABLE product_units (
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
CREATE TABLE product_prices (
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
CREATE TABLE customers (
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
CREATE TABLE employees (
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
CREATE TABLE bank_accounts (
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
CREATE TABLE transactions (
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
CREATE TABLE transaction_items (
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
CREATE TABLE shifts (
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
CREATE TABLE configurations (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Sync Logs
CREATE TABLE sync_logs (
  id TEXT PRIMARY KEY,
  syncType TEXT NOT NULL,
  status TEXT NOT NULL,
  recordCount INTEGER DEFAULT 0,
  errorMessage TEXT,
  syncedAt TEXT NOT NULL
);
`);

console.log('✅ Tables created');

// Helper functions
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

// อ่าน Excel
console.log('📖 Reading Excel file...');
const workbook = XLSX.readFile(excelPath);

// Prepare statements
const insertBranch = db.prepare("INSERT INTO branches (id, code, name, address, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))");
const insertCategory = db.prepare("INSERT INTO categories (id, code, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))");
const insertDepartment = db.prepare("INSERT INTO departments (id, code, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))");
const insertWarehouse = db.prepare("INSERT INTO warehouses (id, code, name, location, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))");
const insertProduct = db.prepare("INSERT INTO products (id, sku, name, nameEn, nameLo, category, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))");
const insertUnit = db.prepare('INSERT INTO product_units (id, productId, unitCode, unitName, unitNameEn, unitNameLo, conversionRate, barcode, isBaseUnit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
const insertPrice = db.prepare("INSERT INTO product_prices (id, productId, unitId, priceLevel, price, effectiveDate) VALUES (?, ?, ?, ?, ?, datetime('now'))");
const insertCustomer = db.prepare("INSERT INTO customers (id, code, name, address, phone, email, priceLevel, creditLimit, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))");
const insertEmployee = db.prepare("INSERT INTO employees (id, code, name, username, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))");
const insertBank = db.prepare("INSERT INTO bank_accounts (id, code, bankName, accountNumber, accountName, branchName, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))");

console.log('\n🔄 Importing data...\n');

// 1. BRANCH
console.log('📦 Importing BRANCH...');
const branches = getSheetData(workbook, 'BRANCH', 2, 3);
branches.forEach(row => {
  if (!row.BRANCH_CODE) return;
  insertBranch.run(generateUUID(), row.BRANCH_CODE, row.BRANCH_NAME, row.Branch_address, row.Branch_TEL);
});
console.log(`   ✅ ${branches.length} branches`);

// 2. ICCAT
console.log('📦 Importing ICCAT...');
const categories = getSheetData(workbook, 'ICCAT', 1, 2);
categories.forEach(row => {
  if (!row.ICCAT_CODE) return;
  insertCategory.run(generateUUID(), row.ICCAT_CODE, row.ICCAT_NAME);
});
console.log(`   ✅ ${categories.length} categories`);

// 3. ICDEPT
console.log('📦 Importing ICDEPT...');
const departments = getSheetData(workbook, 'ICDEPT', 1, 2);
departments.forEach(row => {
  if (!row.ICDEPT_CODE) return;
  insertDepartment.run(generateUUID(), row.ICDEPT_CODE, row.ICDEPT_NAME);
});
console.log(`   ✅ ${departments.length} departments`);

// 4. WARELOCATION
console.log('📦 Importing WARELOCATION...');
const warehouses = getSheetData(workbook, 'WARELOCATION', 1, 2);
warehouses.forEach(row => {
  if (!row.WARE_CODE) return;
  insertWarehouse.run(generateUUID(), row.WARE_CODE, row.WARE_NAME, row.WARE_LOCATION);
});
console.log(`   ✅ ${warehouses.length} warehouses`);

// 5. SKUMASTER
console.log('📦 Importing SKUMASTER...');
const products = getSheetData(workbook, 'SKUMASTER', 3, 4);
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
  
  insertProduct.run(
    productId,
    row.SKU_CODE,
    row.SKU_NAME,
    row.SKU_NAME_EN || row.SKU_NAME,
    row.SKU_NAME_LO || row.SKU_NAME,
    row.SKU_ICCAT,
    row.SKU_ICDEPT
  );
});
console.log(`   ✅ ${skuSet.size} products`);

// 6. UOFQTY
console.log('📦 Processing UOFQTY...');
const units = getSheetData(workbook, 'UOFQTY', 2, 3);
const unitMap = new Map();

units.forEach(row => {
  if (!row.UTQ_NAME) return;
  unitMap.set(row.UTQ_KEY, {
    name: row.UTQ_NAME,
    qty: parseFloat(row.UTQ_QTY) || 1
  });
});
console.log(`   ✅ ${units.length} unit types`);

// 7. GOODSMASTER
console.log('📦 Importing GOODSMASTER...');
const goods = getSheetData(workbook, 'GOODSMASTER', 3, 4);
const goodsMap = new Map();
let goodsCount = 0;

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
  goodsCount++;
});
console.log(`   ✅ ${goodsCount} product units`);

// 8. ARPLU
console.log('📦 Importing ARPLU...');
const prices = getSheetData(workbook, 'ARPLU', 2, 3);
let priceCount = 0;

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
  insertPrice.run(generateUUID(), goodsInfo.productId, goodsInfo.unitId, priceLevel, price);
  priceCount++;
});
console.log(`   ✅ ${priceCount} prices`);

// 9. ARFILE
console.log('📦 Importing ARFILE...');
const customers = getSheetData(workbook, 'ARFILE', 3, 4);
customers.forEach(row => {
  if (!row.AR_CODE) return;
  insertCustomer.run(
    generateUUID(),
    row.AR_CODE,
    row.AR_NAME,
    row.AR_ADD1 || null,
    row.AR_TEL || null,
    row.AR_EMAIL || null,
    row.AR_ARPRB || 1,
    row.AR_CREDIT || 0
  );
});
console.log(`   ✅ ${customers.length} customers`);

// 10. USER
console.log('📦 Importing USER...');
const users = getSheetData(workbook, 'USER', 2, 3);
users.forEach(row => {
  if (!row.USER_CODE) return;
  insertEmployee.run(
    generateUUID(),
    row.USER_CODE,
    row.USER_NAME,
    row.USER_LOGIN,
    row.USER_PASSWORD,
    row.USER_LEVEL || 'CASHIER'
  );
});
console.log(`   ✅ ${users.length} employees`);

// 11. BANK
console.log('📦 Importing BANK...');
const banks = getSheetData(workbook, 'BANK', 2, 3);
banks.forEach(row => {
  if (!row.BANK_CODE) return;
  insertBank.run(
    generateUUID(),
    row.BANK_CODE,
    row.BANK_NAME,
    row.BANK_ACCOUNT,
    row.BANK_ACC_NAME,
    row.BANK_BRANCH
  );
});
console.log(`   ✅ ${banks.length} banks`);

db.close();

const stats = fs.statSync(dbPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n✅ Template database created: ${dbPath} (${sizeMB} MB)`);
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
