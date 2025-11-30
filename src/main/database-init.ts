/**
 * Database Initialization
 * ตรวจสอบและสร้าง database จาก template ถ้ายังไม่มี
 */

import { Sequelize } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import Database from 'better-sqlite3';

export async function initDatabase(): Promise<Sequelize> {
  console.log('🚀 Initializing database...');
  
  // กำหนดตำแหน่งไฟล์ database
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos.db');
  
  console.log('📁 User data path:', userDataPath);
  console.log('📁 Database path:', dbPath);
  
  // สร้าง directory ถ้ายังไม่มี
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
    console.log('✅ Created user data directory');
  }
  
  // ตรวจสอบว่ามี database อยู่แล้วหรือไม่
  const dbExists = fs.existsSync(dbPath);
  
  if (!dbExists) {
    console.log('📦 Database not found, creating from template...');
    await createDatabaseFromTemplate(dbPath);
  } else {
    console.log('✅ Database already exists');
  }
  
  // เชื่อมต่อ database
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    dialectModule: Database,
    dialectOptions: {
      busyTimeout: 30000 // 30 seconds timeout
    }
  });
  
  // ทดสอบการเชื่อมต่อ
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    throw error;
  }
  
  // แสดงสถิติ
  await showDatabaseStats(sequelize);
  
  return sequelize;
}

async function createDatabaseFromTemplate(targetPath: string): Promise<void> {
  // ตำแหน่งไฟล์ template
  const templatePath = path.join(
    process.resourcesPath,
    'pos-template.db'
  );
  
  console.log('📁 Template path:', templatePath);
  
  // ตรวจสอบว่ามีไฟล์ template หรือไม่
  if (!fs.existsSync(templatePath)) {
    console.warn('⚠️  Template database not found, creating empty database...');
    
    // สร้าง database เปล่า (จะใช้ models จาก DatabaseManager)
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: targetPath,
      logging: false,
      dialectModule: Database
    });
    
    // Import models dynamically
    const Product = (await import('../models/Product')).default;
    const Customer = (await import('../models/Customer')).default;
    const Employee = (await import('../models/Employee')).default;
    const ProductUnit = (await import('../models/ProductUnit')).default;
    const BankAccount = (await import('../models/BankAccount')).default;
    const Transaction = (await import('../models/Transaction')).default;
    const TransactionItem = (await import('../models/TransactionItem')).default;
    
    // Note: Models are already initialized with their own sequelize instance
    // We just need to sync the schema
    await sequelize.sync({ force: true });
    await sequelize.close();
    
    console.log('✅ Created empty database');
    
    // ลอง import จาก Excel (fallback)
    await tryImportFromExcel(targetPath);
    
    return;
  }
  
  // Copy template database
  console.log('📋 Copying template database...');
  fs.copyFileSync(templatePath, targetPath);
  
  // แสดงขนาดไฟล์
  const stats = fs.statSync(targetPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Database created from template (${fileSizeMB} MB)`);
}

async function tryImportFromExcel(dbPath: string): Promise<void> {
  const excelPath = path.join(
    process.resourcesPath,
    'ส่งข้อมูลPOS.xlsx'
  );
  
  if (!fs.existsSync(excelPath)) {
    console.warn('⚠️  Excel file not found, skipping import');
    return;
  }
  
  console.log('📊 Importing from Excel...');
  
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false,
      dialectModule: Database
    });
    
    // Import models dynamically
    const Product = (await import('../models/Product')).default;
    const Customer = (await import('../models/Customer')).default;
    const Employee = (await import('../models/Employee')).default;
    const ProductUnit = (await import('../models/ProductUnit')).default;
    const BankAccount = (await import('../models/BankAccount')).default;
    
    // Import data
    if (workbook.SheetNames.includes('ProductUnits')) {
      const sheet = workbook.Sheets['ProductUnits'];
      const data = XLSX.utils.sheet_to_json(sheet);
      await ProductUnit.bulkCreate(data as any[]);
      console.log(`✅ Imported ${data.length} product units`);
    }
    
    if (workbook.SheetNames.includes('Products')) {
      const sheet = workbook.Sheets['Products'];
      const data = XLSX.utils.sheet_to_json(sheet);
      await Product.bulkCreate(data as any[]);
      console.log(`✅ Imported ${data.length} products`);
    }
    
    if (workbook.SheetNames.includes('Customers')) {
      const sheet = workbook.Sheets['Customers'];
      const data = XLSX.utils.sheet_to_json(sheet);
      await Customer.bulkCreate(data as any[]);
      console.log(`✅ Imported ${data.length} customers`);
    }
    
    if (workbook.SheetNames.includes('Employees')) {
      const sheet = workbook.Sheets['Employees'];
      const data = XLSX.utils.sheet_to_json(sheet);
      await Employee.bulkCreate(data as any[]);
      console.log(`✅ Imported ${data.length} employees`);
    }
    
    if (workbook.SheetNames.includes('BankAccounts')) {
      const sheet = workbook.Sheets['BankAccounts'];
      const data = XLSX.utils.sheet_to_json(sheet);
      await BankAccount.bulkCreate(data as any[]);
      console.log(`✅ Imported ${data.length} bank accounts`);
    }
    
    await sequelize.close();
    console.log('✅ Import from Excel completed');
    
  } catch (error) {
    console.error('❌ Error importing from Excel:', error);
  }
}

async function showDatabaseStats(sequelize: Sequelize): Promise<void> {
  try {
    const [productResult] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    const [customerResult] = await sequelize.query('SELECT COUNT(*) as count FROM customers');
    const [employeeResult] = await sequelize.query('SELECT COUNT(*) as count FROM employees');
    
    const productCount = (productResult as any)[0]?.count || 0;
    const customerCount = (customerResult as any)[0]?.count || 0;
    const employeeCount = (employeeResult as any)[0]?.count || 0;
    
    console.log('');
    console.log('📊 Database Statistics:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Employees: ${employeeCount}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
  }
}

/**
 * Reset database (ลบและสร้างใหม่จาก template)
 */
export async function resetDatabase(): Promise<void> {
  console.log('🔄 Resetting database...');
  
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos.db');
  
  // ลบไฟล์เก่า
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Removed old database');
  }
  
  // ลบ WAL files
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  
  // สร้างใหม่จาก template
  await createDatabaseFromTemplate(dbPath);
  
  console.log('✅ Database reset completed');
}
