/**
 * สร้าง Template Database จาก Excel
 * อ่านข้อมูลจาก Excel ทั้ง 15 sheets และ transform ให้ตรงกับ Models
 */

import { Sequelize, DataTypes } from 'sequelize';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMPLATE_DB_PATH = path.join(__dirname, '..', 'pos-template.db');
const EXCEL_PATH = path.join(__dirname, '..', 'ส่งข้อมูลPOS.xlsx');

// ฟังก์ชันอ่าน sheet โดยข้าม header
function readSheetWithHeader(sheet: XLSX.WorkSheet, headerRow: number): any[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const data: any[] = [];
  
  // อ่าน header
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: C });
    const cell = sheet[cellAddress];
    headers.push(cell ? String(cell.v) : `COL_${C}`);
  }
  
  // อ่านข้อมูล
  for (let R = headerRow + 1; R <= range.e.r; R++) {
    const row: any = {};
    let hasData = false;
    
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];
      const value = cell ? cell.v : '';
      row[headers[C - range.s.c]] = value;
      if (value !== '' && value !== null && value !== undefined) {
        hasData = true;
      }
    }
    
    if (hasData) {
      data.push(row);
    }
  }
  
  return data;
}

// Define models
function defineModels(sequelize: Sequelize) {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    unit: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    syncedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'products', timestamps: true });

  const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    priceLevel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    branch: { type: DataTypes.STRING, allowNull: true },
    creditLimit: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    syncedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'customers', timestamps: true });

  const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'SALES' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    syncedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'employees', timestamps: true });

  const ProductUnit = sequelize.define('ProductUnit', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    syncedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'product_units', timestamps: true });

  const BankAccount = sequelize.define('BankAccount', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    accountNumber: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    syncedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'bank_accounts', timestamps: true });

  const Branch = sequelize.define('Branch', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'branches', timestamps: true });

  const Category = sequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'categories', timestamps: true });

  const Department = sequelize.define('Department', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    categoryCode: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'departments', timestamps: true });

  const PriceLevel = sequelize.define('PriceLevel', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    level: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'price_levels', timestamps: true });

  const WarehouseLocation = sequelize.define('WarehouseLocation', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'warehouse_locations', timestamps: true });

  return {
    Product,
    Customer,
    Employee,
    ProductUnit,
    BankAccount,
    Branch,
    Category,
    Department,
    PriceLevel,
    WarehouseLocation,
  };
}

async function createTemplateDatabase() {
  console.log('🚀 Starting template database creation from Excel...');
  console.log('');
  
  // ลบไฟล์เก่า
  if (fs.existsSync(TEMPLATE_DB_PATH)) {
    fs.unlinkSync(TEMPLATE_DB_PATH);
    console.log('✅ Removed old template database');
  }
  
  // ตรวจสอบไฟล์ Excel
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ Excel file not found:', EXCEL_PATH);
    process.exit(1);
  }
  
  // สร้าง database
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: TEMPLATE_DB_PATH,
    logging: false
  });
  
  console.log('📦 Initializing models...');
  const models = defineModels(sequelize);
  
  // สร้าง tables
  await sequelize.sync({ force: true });
  console.log('✅ Database schema created');
  console.log('');
  
  // อ่าน Excel
  console.log('📊 Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log(`   Found ${workbook.SheetNames.length} sheets`);
  console.log('');
  
  let totalImported = 0;
  
  // 1. Import BRANCH
  try {
    console.log('📥 Importing Branches (BRANCH)...');
    const branchData = readSheetWithHeader(workbook.Sheets['BRANCH'], 3);
    const branches = branchData.map(row => ({
      id: uuidv4(),
      code: String(row.BRANCH_KEY || row.BRANCH_CODE || ''),
      name: String(row.BRANCH_NAME || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })).filter(b => b.code && b.name);
    
    if (branches.length > 0) {
      await models.Branch.bulkCreate(branches, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${branches.length} branches`);
      totalImported += branches.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 2. Import ICCAT (Categories)
  try {
    console.log('📥 Importing Categories (ICCAT)...');
    const catData = readSheetWithHeader(workbook.Sheets['ICCAT'], 3);
    const categories = catData.map(row => ({
      id: uuidv4(),
      code: String(row.ICCAT_KEY || row.ICCAT_CODE || ''),
      name: String(row.ICCAT_NAME || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })).filter(c => c.code && c.name);
    
    if (categories.length > 0) {
      await models.Category.bulkCreate(categories, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${categories.length} categories`);
      totalImported += categories.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 3. Import ICDEPT (Departments)
  try {
    console.log('📥 Importing Departments (ICDEPT)...');
    const deptData = readSheetWithHeader(workbook.Sheets['ICDEPT'], 3);
    const departments = deptData.map(row => ({
      id: uuidv4(),
      code: String(row.ICDEPT_KEY || row.ICDEPT_CODE || ''),
      name: String(row.ICDEPT_NAME || ''),
      categoryCode: String(row.ICDEPT_ICCAT || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })).filter(d => d.code && d.name);
    
    if (departments.length > 0) {
      await models.Department.bulkCreate(departments, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${departments.length} departments`);
      totalImported += departments.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 4. Import UOFQTY (Product Units)
  try {
    console.log('📥 Importing Product Units (UOFQTY)...');
    const unitData = readSheetWithHeader(workbook.Sheets['UOFQTY'], 3);
    const units = unitData.map(row => ({
      id: uuidv4(),
      code: String(row.UTQ_KEY || row.UTQ_CODE || row.UTQ_NAME || ''),
      name: String(row.UTQ_NAME || ''),
      quantity: Number(row.UTQ_QTY || 1),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date(),
    })).filter(u => u.code && u.name);
    
    if (units.length > 0) {
      await models.ProductUnit.bulkCreate(units, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${units.length} product units`);
      totalImported += units.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 5. Import WARELOCATION
  try {
    console.log('📥 Importing Warehouse Locations (WARELOCATION)...');
    const wareData = readSheetWithHeader(workbook.Sheets['WARELOCATION'], 3);
    const locations = wareData.map(row => ({
      id: uuidv4(),
      code: String(row.WARELOCATION_KEY || row.WARELOCATION_CODE || ''),
      name: String(row.WARELOCATION_NAME || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })).filter(l => l.code && l.name);
    
    if (locations.length > 0) {
      await models.WarehouseLocation.bulkCreate(locations, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${locations.length} warehouse locations`);
      totalImported += locations.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 6. Import SKUMASTER (Products)
  try {
    console.log('📥 Importing Products (SKUMASTER)...');
    const productData = readSheetWithHeader(workbook.Sheets['SKUMASTER'], 3);
    const products = productData.map(row => ({
      id: uuidv4(),
      sku: String(row.SKU_CODE || ''),
      name: String(row.SKU_NAME || ''),
      description: String(row.SKU_NAME || ''),
      category: String(row.SKU_ICCAT || ''),
      department: String(row.SKU_ICDEPT || ''),
      unit: String(row.SKU_K_UTQ || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date(),
    })).filter(p => p.sku && p.name);
    
    if (products.length > 0) {
      await models.Product.bulkCreate(products, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${products.length} products`);
      totalImported += products.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 7. Import ARPRB (Price Levels)
  try {
    console.log('📥 Importing Price Levels (ARPRB)...');
    const priceData = readSheetWithHeader(workbook.Sheets['ARPRB'], 3);
    const priceLevels = priceData.map((row, index) => ({
      id: uuidv4(),
      code: String(row.ARPRB_KEY || row.ARPRB_CODE || index + 1),
      name: String(row.ARPRB_NAME || `Level ${index + 1}`),
      level: Number(row.ARPRB_LEVEL || index + 1),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })).filter(p => p.code && p.name);
    
    if (priceLevels.length > 0) {
      await models.PriceLevel.bulkCreate(priceLevels, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${priceLevels.length} price levels`);
      totalImported += priceLevels.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 8. Import ARFILE (Customers)
  try {
    console.log('📥 Importing Customers (ARFILE)...');
    const customerData = readSheetWithHeader(workbook.Sheets['ARFILE'], 3);
    const customers = customerData.map(row => ({
      id: uuidv4(),
      code: String(row.AR_CODE || ''),
      name: String(row.AR_NAME || ''),
      priceLevel: Number(row.AR_ARPRB || 1),
      branch: String(row.AR_BRANCH || ''),
      phone: null,
      email: null,
      address: null,
      creditLimit: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date(),
    })).filter(c => c.code && c.name);
    
    if (customers.length > 0) {
      await models.Customer.bulkCreate(customers, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${customers.length} customers`);
      totalImported += customers.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 9. Import USER (Employees)
  try {
    console.log('📥 Importing Employees (USER)...');
    const userData = readSheetWithHeader(workbook.Sheets['USER'], 3);
    const employees = userData.map(row => ({
      id: uuidv4(),
      code: String(row.USER_KEY || row.USER_CODE || ''),
      name: String(row.USER_NAME || ''),
      type: 'SALES',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date(),
    })).filter(e => e.code && e.name);
    
    if (employees.length > 0) {
      await models.Employee.bulkCreate(employees, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${employees.length} employees`);
      totalImported += employees.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 10. Import SERVICE (Service Staff)
  try {
    console.log('📥 Importing Service Staff (SERVICE)...');
    const serviceData = readSheetWithHeader(workbook.Sheets['SERVICE'], 3);
    const serviceStaff = serviceData.map(row => ({
      id: uuidv4(),
      code: String(row.SERVICE_KEY || row.SERVICE_CODE || ''),
      name: String(row.SERVICE_NAME || ''),
      type: 'SERVICE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date(),
    })).filter(s => s.code && s.name);
    
    if (serviceStaff.length > 0) {
      await models.Employee.bulkCreate(serviceStaff, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${serviceStaff.length} service staff`);
      totalImported += serviceStaff.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // 11. Import BANK
  try {
    console.log('📥 Importing Bank Accounts (BANK)...');
    const bankData = readSheetWithHeader(workbook.Sheets['BANK'], 3);
    const banks = bankData.map(row => ({
      id: uuidv4(),
      code: String(row.BANK_KEY || row.BANK_CODE || ''),
      name: String(row.BANK_NAME || ''),
      accountNumber: String(row.BANK_ACCOUNT || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: new Date(),
    })).filter(b => b.code && b.name);
    
    if (banks.length > 0) {
      await models.BankAccount.bulkCreate(banks, { ignoreDuplicates: true });
      console.log(`   ✅ Imported ${banks.length} bank accounts`);
      totalImported += banks.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  console.log('');
  
  // Optimize database
  console.log('🔧 Optimizing database...');
  await sequelize.query('VACUUM');
  await sequelize.query('ANALYZE');
  
  await sequelize.close();
  
  // แสดงสถิติ
  const stats = fs.statSync(TEMPLATE_DB_PATH);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('');
  console.log('✨ Template database created successfully!');
  console.log(`📁 Location: ${TEMPLATE_DB_PATH}`);
  console.log(`📊 Size: ${fileSizeMB} MB`);
  console.log(`📦 Total records: ${totalImported}`);
  console.log('');
  console.log('💡 This database is ready to be bundled with the application!');
}

// Run
createTemplateDatabase()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
