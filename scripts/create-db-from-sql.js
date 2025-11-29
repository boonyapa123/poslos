/**
 * สร้าง database จากไฟล์ SQL
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const sqlPath = 'data/seed.sql';
const dbPath = 'pos-template.db';

console.log('📊 Creating database from SQL...');
console.log('📁 SQL file:', sqlPath);
console.log('📁 Database:', dbPath);

if (!fs.existsSync(sqlPath)) {
  console.error('❌ SQL file not found!');
  process.exit(1);
}

// ลบ database เก่า (ถ้ามี)
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Removed old database');
}

// สร้าง database ใหม่
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('📖 Reading SQL file...');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('⚙️  Executing SQL statements...');
const statements = sql.split(';\n').filter(s => s.trim());

let executed = 0;
let errors = 0;

statements.forEach((statement, index) => {
  if (!statement.trim()) return;
  
  try {
    db.exec(statement + ';');
    executed++;
    
    if (executed % 10000 === 0) {
      console.log(`   Executed ${executed.toLocaleString()} statements...`);
    }
  } catch (error) {
    errors++;
    if (errors < 10) {
      console.error(`   ⚠️  Error at statement ${index + 1}:`, error.message);
    }
  }
});

db.close();

const stats = fs.statSync(dbPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log('\n✅ Database created successfully!');
console.log(`📊 Statistics:`);
console.log(`   Executed: ${executed.toLocaleString()} statements`);
console.log(`   Errors: ${errors}`);
console.log(`   Database size: ${sizeMB} MB`);
