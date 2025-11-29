/**
 * Migration: Add multilingual product names to transaction_items
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(
  process.env.HOME,
  'Library/Application Support/poslos/pos.db'
);

console.log('📦 Adding multilingual fields to transaction_items...');
console.log('📁 Database:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try {
  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(transaction_items)").all();
  const hasNameEn = tableInfo.some(col => col.name === 'productNameEn');
  const hasNameLo = tableInfo.some(col => col.name === 'productNameLo');

  if (!hasNameEn) {
    console.log('Adding productNameEn column...');
    db.prepare('ALTER TABLE transaction_items ADD COLUMN productNameEn TEXT').run();
    console.log('✅ Added productNameEn');
  } else {
    console.log('⏭️  productNameEn already exists');
  }

  if (!hasNameLo) {
    console.log('Adding productNameLo column...');
    db.prepare('ALTER TABLE transaction_items ADD COLUMN productNameLo TEXT').run();
    console.log('✅ Added productNameLo');
  } else {
    console.log('⏭️  productNameLo already exists');
  }

  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} finally {
  db.close();
}
