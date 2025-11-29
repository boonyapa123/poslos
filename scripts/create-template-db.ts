/**
 * สคริปต์สำหรับสร้าง Database Template
 * รันก่อน build เพื่อสร้าง pos-template.db ที่มีข้อมูลเริ่มต้นพร้อมใช้งาน
 * 
 * วิธีใช้:
 * npm run create-template
 */

import { Sequelize, DataTypes, Model } from 'sequelize';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATE_DB_PATH = path.join(__dirname, '..', 'pos-template.db');
const EXCEL_PATH = path.join(__dirname, '..', 'ส่งข้อมูลPOS.xlsx');

// Define models inline (เพื่อไม่ต้อง depend on DatabaseManager)
function defineModels(sequelize: Sequelize) {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    syncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'products',
    timestamps: true,
  });

  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priceLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    syncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'customers',
    timestamps: true,
  });

  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('SALES', 'SERVICE'),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    syncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'employees',
    timestamps: true,
  });

  const ProductUnit = sequelize.define('ProductUnit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    syncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'product_units',
    timestamps: true,
  });

  const BankAccount = sequelize.define('BankAccount', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    syncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'bank_accounts',
    timestamps: true,
  });

  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    syncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
  });

  const TransactionItem = sequelize.define('TransactionItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    syncedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'transaction_items',
    timestamps: true,
  });

  return { Product, Customer, Employee, ProductUnit, BankAccount, Transaction, TransactionItem };
}

async function createTemplateDatabase() {
  console.log('🚀 Starting template database creation...');
  
  // ลบไฟล์เก่า (ถ้ามี)
  if (fs.existsSync(TEMPLATE_DB_PATH)) {
    fs.unlinkSync(TEMPLATE_DB_PATH);
    console.log('✅ Removed old template database');
  }
  
  // สร้าง database ใหม่
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: TEMPLATE_DB_PATH,
    logging: false
  });
  
  console.log('📦 Initializing models...');
  
  // Define models
  const { Product, Customer, Employee, ProductUnit, BankAccount } = defineModels(sequelize);
  
  // สร้าง tables
  await sequelize.sync({ force: true });
  console.log('✅ Database schema created');
  
  // ตรวจสอบว่ามีไฟล์ Excel หรือไม่
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ Excel file not found:', EXCEL_PATH);
    process.exit(1);
  }
  
  console.log('📊 Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  
  // รายการ sheets ที่ต้องการ import (Master Data เท่านั้น)
  const sheetsToImport = [
    { name: 'BRANCH', description: 'Branches', model: null },
    { name: 'ICCAT', description: 'Product Categories', model: null },
    { name: 'ICDEPT', description: 'Product Departments', model: null },
    { name: 'UOFQTY', description: 'Product Units', model: ProductUnit },
    { name: 'WARELOCATION', description: 'Warehouse Locations', model: null },
    { name: 'SKUMASTER', description: 'Products', model: Product },
    { name: 'GOODSMASTER', description: 'Goods Master', model: null },
    { name: 'ARPRB', description: 'Price Levels', model: null },
    { name: 'ARFILE', description: 'Customers', model: Customer },
    { name: 'USER', description: 'Users', model: Employee },
    { name: 'SERVICE', description: 'Service Staff', model: null },
    { name: 'BANK', description: 'Bank Accounts', model: BankAccount },
    { name: 'DOCINFO', description: 'Document Info', model: null },
  ];
  
  // Sheets ที่ไม่ควร import (Transaction Data)
  const excludedSheets = ['ARPLU', 'SKUMOVE'];
  
  console.log('');
  console.log('📋 Master Data Sheets:');
  sheetsToImport.forEach(s => console.log(`   - ${s.name}: ${s.description}`));
  console.log('');
  console.log('⚠️  Excluded Sheets (Transaction Data):');
  excludedSheets.forEach(s => console.log(`   - ${s}`));
  console.log('');
  
  let totalImported = 0;
  
  // Import แต่ละ sheet
  for (const sheetInfo of sheetsToImport) {
    if (!workbook.SheetNames.includes(sheetInfo.name)) {
      console.log(`⏭️  Skipping ${sheetInfo.name} (not found)`);
      continue;
    }
    
    console.log(`📥 Importing ${sheetInfo.description} (${sheetInfo.name})...`);
    const sheet = workbook.Sheets[sheetInfo.name];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    if (data.length === 0) {
      console.log(`   ⚠️  No data found`);
      continue;
    }
    
    // ถ้ามี model ให้ import เข้า database
    if (sheetInfo.model) {
      try {
        await sheetInfo.model.bulkCreate(data as any[], { 
          ignoreDuplicates: true,
          validate: false // ข้ามการ validate เพื่อความเร็ว
        });
        console.log(`   ✅ Imported ${data.length} rows`);
        totalImported += data.length;
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    } else {
      // ถ้าไม่มี model ให้ insert ด้วย raw SQL
      try {
        const tableName = sheetInfo.name.toLowerCase();
        
        // สร้าง table ถ้ายังไม่มี
        const firstRow = data[0] as Record<string, any>;
        const columns = Object.keys(firstRow);
        const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
        await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs})`);
        
        // Insert ข้อมูล
        for (const row of data) {
          const rowData = row as Record<string, any>;
          const values = columns.map(col => {
            const val = rowData[col];
            return val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ');
          
          await sequelize.query(
            `INSERT OR IGNORE INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values})`
          );
        }
        
        console.log(`   ✅ Imported ${data.length} rows`);
        totalImported += data.length;
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }
  
  console.log('');
  console.log(`📊 Total imported: ${totalImported} rows`);
  console.log('');
  
  // Optimize database
  console.log('🔧 Optimizing database...');
  await sequelize.query('VACUUM');
  await sequelize.query('ANALYZE');
  
  await sequelize.close();
  
  // แสดงขนาดไฟล์
  const stats = fs.statSync(TEMPLATE_DB_PATH);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('');
  console.log('✨ Template database created successfully!');
  console.log(`📁 Location: ${TEMPLATE_DB_PATH}`);
  console.log(`📊 Size: ${fileSizeMB} MB`);
  console.log('');
  console.log('💡 This file will be included in the build and copied to user data folder on first run.');
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
