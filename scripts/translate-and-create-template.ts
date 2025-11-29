/**
 * แปลข้อมูลด้วย Google Translate และสร้าง Template Database
 * รองรับ 3 ภาษา: ไทย, อังกฤษ, ลาว
 */

import { Sequelize } from 'sequelize';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMPLATE_DB_PATH = path.join(__dirname, '..', 'pos-template.db');
const EXCEL_PATH = path.join(__dirname, '..', 'ส่งข้อมูลPOS.xlsx');

// Google Translate (ใช้ free translation library แทน)
const translate = require('@vitalets/google-translate-api');

// Cache สำหรับการแปล
const translationCache: { [key: string]: { en: string; lo: string } } = {};

// Mapping สำหรับคำที่แปลบ่อย
const commonTranslations: { [key: string]: { en: string; lo: string } } = {
  // หน่วย
  'ชิ้น': { en: 'Piece', lo: 'ຊິ້ນ' },
  'ผืน': { en: 'Sheet', lo: 'ຜືນ' },
  'กล่อง': { en: 'Box', lo: 'ກ່ອງ' },
  'ถุง': { en: 'Bag', lo: 'ຖົງ' },
  'แพ็ค': { en: 'Pack', lo: 'ແພັກ' },
  'ลัง': { en: 'Carton', lo: 'ລັງ' },
  'เมตร': { en: 'Meter', lo: 'ແມັດ' },
  'กิโลกรัม': { en: 'Kilogram', lo: 'ກິໂລກຣາມ' },
  'ลิตร': { en: 'Liter', lo: 'ລິດ' },
  'ม้วน': { en: 'Roll', lo: 'ມ້ວນ' },
  'แผ่น': { en: 'Sheet', lo: 'ແຜ່ນ' },
  'ขวด': { en: 'Bottle', lo: 'ຂວດ' },
  'กระป๋อง': { en: 'Can', lo: 'ກະປ໋ອງ' },
  'ห่อ': { en: 'Pack', lo: 'ຫໍ່' },
  'คู่': { en: 'Pair', lo: 'ຄູ່' },
  'ตัว': { en: 'Unit', lo: 'ຕົວ' },
  'อัน': { en: 'Piece', lo: 'ອັນ' },
  'เส้น': { en: 'Line', lo: 'ເສັ້ນ' },
  'ห่อ': { en: 'Pack', lo: 'ຫໍ່' },
  'ชุด': { en: 'Set', lo: 'ຊຸດ' },
};

async function translateText(text: string, targetLang: 'en' | 'lo'): Promise<string> {
  if (!text || text.trim() === '') return text;
  
  // ตรวจสอบ cache
  const cacheKey = text.trim();
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey][targetLang];
  }
  
  // ตรวจสอบ common translations
  if (commonTranslations[cacheKey]) {
    translationCache[cacheKey] = commonTranslations[cacheKey];
    return commonTranslations[cacheKey][targetLang];
  }
  
  try {
    // แปลด้วย Google Translate
    const result = await translate(text, { from: 'th', to: targetLang });
    
    // เก็บใน cache
    if (!translationCache[cacheKey]) {
      translationCache[cacheKey] = { en: '', lo: '' };
    }
    translationCache[cacheKey][targetLang] = result.text;
    
    // Delay เล็กน้อยเพื่อไม่ให้ถูก rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return result.text;
  } catch (error) {
    console.error(`   ⚠️  Translation error for "${text}":`, error);
    return text; // Return original if translation fails
  }
}

async function translateBatch(texts: string[]): Promise<{ en: string[]; lo: string[] }> {
  const results = { en: [] as string[], lo: [] as string[] };
  
  for (const text of texts) {
    try {
      const en = await translateText(text, 'en');
      const lo = await translateText(text, 'lo');
      results.en.push(en);
      results.lo.push(lo);
    } catch (error) {
      results.en.push(text);
      results.lo.push(text);
    }
  }
  
  return results;
}

function readSheetWithHeader(sheet: XLSX.WorkSheet, headerRow: number): any[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const data: any[] = [];
  
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: C });
    const cell = sheet[cellAddress];
    headers.push(cell ? String(cell.v) : `COL_${C}`);
  }
  
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

async function createMultilingualTemplate() {
  console.log('🌍 Creating multilingual template database...');
  console.log('');
  
  // ลบไฟล์เก่า
  if (fs.existsSync(TEMPLATE_DB_PATH)) {
    fs.unlinkSync(TEMPLATE_DB_PATH);
    console.log('✅ Removed old template');
  }
  
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
  
  console.log('📦 Creating database schema...');
  
  // Import models dynamically
  const Product = (await import('../src/models/Product')).default;
  const ProductUnit = (await import('../src/models/ProductUnit')).default;
  const ProductPrice = (await import('../src/models/ProductPrice')).default;
  const Customer = (await import('../src/models/Customer')).default;
  const Employee = (await import('../src/models/Employee')).default;
  const BankAccount = (await import('../src/models/BankAccount')).default;
  const Branch = (await import('../src/models/Branch')).default;
  const Category = (await import('../src/models/Category')).default;
  const Department = (await import('../src/models/Department')).default;
  const Warehouse = (await import('../src/models/Warehouse')).default;
  
  await sequelize.sync({ force: true });
  console.log('✅ Schema created');
  console.log('');
  
  // อ่าน Excel
  console.log('📊 Reading Excel...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log('');
  
  let totalRecords = 0;
  
  // Import และแปลข้อมูล
  console.log('🔄 Importing and translating data...');
  console.log('   (This may take a while...)');
  console.log('');
  
  // 1. Branches
  try {
    console.log('📥 Branches...');
    const data = readSheetWithHeader(workbook.Sheets['BRANCH'], 3);
    const records = [];
    
    for (const row of data) {
      if (!row.BRANCH_CODE || !row.BRANCH_NAME) continue;
      records.push({
        code: String(row.BRANCH_CODE),
        name: String(row.BRANCH_NAME),
        address: row.Branch_address ? String(row.Branch_address) : undefined,
        phone: row.Branch_TEL ? String(row.Branch_TEL) : undefined,
        isActive: true,
      });
    }
    
    if (records.length > 0) {
      await Branch.bulkCreate(records, { ignoreDuplicates: true });
      console.log(`   ✅ ${records.length} branches`);
      totalRecords += records.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // 2. Categories
  try {
    console.log('📥 Categories...');
    const data = readSheetWithHeader(workbook.Sheets['ICCAT'], 3);
    const records = [];
    
    for (const row of data) {
      if (!row.ICCAT_CODE || !row.ICCAT_NAME) continue;
      records.push({
        code: String(row.ICCAT_CODE),
        name: String(row.ICCAT_NAME),
        isActive: true,
      });
    }
    
    if (records.length > 0) {
      await Category.bulkCreate(records, { ignoreDuplicates: true });
      console.log(`   ✅ ${records.length} categories`);
      totalRecords += records.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // 3. Product Units (แปลภาษา)
  try {
    console.log('📥 Product Units (translating...)');
    const data = readSheetWithHeader(workbook.Sheets['UOFQTY'], 3);
    const records = [];
    
    // รวบรวมชื่อหน่วยที่ไม่ซ้ำ
    const uniqueUnits = new Set<string>();
    data.forEach(row => {
      if (row.UTQ_NAME) uniqueUnits.add(String(row.UTQ_NAME));
    });
    
    // แปลทีละชุด
    const unitNames = Array.from(uniqueUnits);
    console.log(`   Translating ${unitNames.length} unique units...`);
    
    const translations: { [key: string]: { en: string; lo: string } } = {};
    for (let i = 0; i < unitNames.length; i++) {
      const name = unitNames[i];
      translations[name] = {
        en: await translateText(name, 'en'),
        lo: await translateText(name, 'lo')
      };
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${unitNames.length}`);
      }
    }
    
    // สร้าง records
    for (const row of data) {
      if (!row.UTQ_NAME) continue;
      const name = String(row.UTQ_NAME);
      records.push({
        unitCode: String(row.UTQ_KEY || row.UTQ_CODE || name),
        unitName: name,
        unitNameEn: translations[name]?.en || name,
        unitNameLo: translations[name]?.lo || name,
        conversionRate: Number(row.UTQ_QTY || 1),
        isBaseUnit: false,
      });
    }
    
    if (records.length > 0) {
      await ProductUnit.bulkCreate(records, { ignoreDuplicates: true });
      console.log(`   ✅ ${records.length} units (translated)`);
      totalRecords += records.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // 4. Products (แปลภาษา - ตัวอย่าง 100 รายการแรก)
  try {
    console.log('📥 Products (translating sample...)');
    const data = readSheetWithHeader(workbook.Sheets['SKUMASTER'], 3);
    const sampleSize = Math.min(100, data.length); // แปลแค่ 100 รายการแรกเพื่อทดสอบ
    const records = [];
    
    console.log(`   Translating ${sampleSize} products...`);
    
    for (let i = 0; i < sampleSize; i++) {
      const row = data[i];
      if (!row.SKU_CODE || !row.SKU_NAME) continue;
      
      const name = String(row.SKU_NAME);
      const nameEn = await translateText(name, 'en');
      const nameLo = await translateText(name, 'lo');
      
      records.push({
        sku: String(row.SKU_CODE),
        name: name,
        nameEn: nameEn,
        nameLo: nameLo,
        category: row.SKU_ICCAT ? String(row.SKU_ICCAT) : undefined,
        isActive: true,
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${sampleSize}`);
      }
    }
    
    // เพิ่มสินค้าที่เหลือโดยไม่แปล
    console.log(`   Adding remaining ${data.length - sampleSize} products...`);
    for (let i = sampleSize; i < data.length; i++) {
      const row = data[i];
      if (!row.SKU_CODE || !row.SKU_NAME) continue;
      
      records.push({
        sku: String(row.SKU_CODE),
        name: String(row.SKU_NAME),
        nameEn: null,
        nameLo: null,
        category: row.SKU_ICCAT ? String(row.SKU_ICCAT) : undefined,
        isActive: true,
      });
    }
    
    if (records.length > 0) {
      await Product.bulkCreate(records, { ignoreDuplicates: true });
      console.log(`   ✅ ${records.length} products (${sampleSize} translated)`);
      totalRecords += records.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // 5. Customers
  try {
    console.log('📥 Customers...');
    const data = readSheetWithHeader(workbook.Sheets['ARFILE'], 3);
    const records = [];
    
    for (const row of data) {
      if (!row.AR_CODE || !row.AR_NAME) continue;
      records.push({
        code: String(row.AR_CODE),
        name: String(row.AR_NAME),
        priceLevel: Number(row.AR_ARPRB || 1),
        isActive: true,
      });
    }
    
    if (records.length > 0) {
      await Customer.bulkCreate(records, { ignoreDuplicates: true });
      console.log(`   ✅ ${records.length} customers`);
      totalRecords += records.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // 6. Employees
  try {
    console.log('📥 Employees...');
    const userData = readSheetWithHeader(workbook.Sheets['USER'], 3);
    const records = [];
    
    for (const row of userData) {
      if (!row.USER_CODE || !row.USER_NAME) continue;
      records.push({
        code: String(row.USER_CODE),
        name: String(row.USER_NAME),
        type: 'SALES',
        isActive: true,
      });
    }
    
    if (records.length > 0) {
      await Employee.bulkCreate(records, { ignoreDuplicates: true });
      console.log(`   ✅ ${records.length} employees`);
      totalRecords += records.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  // 7. Banks
  try {
    console.log('📥 Banks...');
    const data = readSheetWithHeader(workbook.Sheets['BANK'], 3);
    const records = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row.BANK_CODE || !row.BANK_NAME) continue;
      records.push({
        bankName: String(row.BANK_NAME),
        accountNumber: row['BANK_A/C_No'] ? String(row['BANK_A/C_No']) : '',
        accountName: row['BANK_A/C_NAME'] ? String(row['BANK_A/C_NAME']) : '',
        qrCodeData: row['BANK_QR '] ? String(row['BANK_QR ']) : '',
        isActive: true,
        displayOrder: i,
      });
    }
    
    if (records.length > 0) {
      await BankAccount.bulkCreate(records, { ignoreDuplicates: true });
      console.log(`   ✅ ${records.length} banks`);
      totalRecords += records.length;
    }
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
  
  console.log('');
  console.log('🔧 Optimizing database...');
  await sequelize.query('VACUUM');
  await sequelize.query('ANALYZE');
  
  await sequelize.close();
  
  const stats = fs.statSync(TEMPLATE_DB_PATH);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('');
  console.log('✨ Multilingual template created!');
  console.log(`📁 Location: ${TEMPLATE_DB_PATH}`);
  console.log(`📊 Size: ${fileSizeMB} MB`);
  console.log(`📦 Total records: ${totalRecords}`);
  console.log('');
  console.log('🌍 Languages: Thai, English, Lao');
  console.log('💡 Ready to bundle with application!');
}

createMultilingualTemplate()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
