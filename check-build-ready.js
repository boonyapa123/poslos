/**
 * ตรวจสอบว่าพร้อม build สำหรับ Windows หรือไม่
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('🔍 ตรวจสอบความพร้อมในการ Build สำหรับ Windows\n');

// 1. ตรวจสอบ Platform
console.log('1. Platform:');
console.log(`   OS: ${os.platform()}`);
console.log(`   Arch: ${os.arch()}`);

if (os.platform() !== 'win32') {
  console.log('   ⚠️  คุณกำลัง build บน ${os.platform()}');
  console.log('   ⚠️  Native modules (sqlite3) จะไม่ทำงานบน Windows!');
  console.log('   ✅ แนะนำ: Build บน Windows โดยตรง หรือใช้ GitHub Actions\n');
} else {
  console.log('   ✅ กำลัง build บน Windows - ถูกต้อง!\n');
}

// 2. ตรวจสอบ Node.js version
console.log('2. Node.js:');
console.log(`   Version: ${process.version}`);
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
if (nodeVersion < 18) {
  console.log(`   ⚠️  Node.js version ต่ำเกินไป (ต้องการ >= 18)`);
} else {
  console.log(`   ✅ Node.js version เหมาะสม\n`);
}

// 3. ตรวจสอบ Electron version
console.log('3. Electron:');
try {
  const pkg = require('./package.json');
  const electronVersion = pkg.devDependencies.electron;
  console.log(`   Version: ${electronVersion}`);
  console.log(`   ✅ Electron ติดตั้งแล้ว\n`);
} catch (error) {
  console.log(`   ❌ ไม่พบ package.json\n`);
}

// 4. ตรวจสอบ node_modules
console.log('4. Dependencies:');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ node_modules มีอยู่แล้ว');
  
  // ตรวจสอบ sqlite3
  if (fs.existsSync('node_modules/sqlite3')) {
    console.log('   ✅ sqlite3 ติดตั้งแล้ว');
  } else {
    console.log('   ⚠️  sqlite3 ยังไม่ได้ติดตั้ง');
  }
  
  // ตรวจสอบ better-sqlite3
  if (fs.existsSync('node_modules/better-sqlite3')) {
    console.log('   ✅ better-sqlite3 ติดตั้งแล้ว');
  } else {
    console.log('   ⚠️  better-sqlite3 ยังไม่ได้ติดตั้ง');
  }
  console.log('');
} else {
  console.log('   ❌ node_modules ไม่มี - ต้องรัน npm install ก่อน\n');
}

// 5. ตรวจสอบ database template
console.log('5. Database Template:');
if (fs.existsSync('pos-template.db')) {
  const stats = fs.statSync('pos-template.db');
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ pos-template.db มีอยู่แล้ว (${sizeMB} MB)`);
  
  if (stats.size < 1024 * 1024) {
    console.log(`   ⚠️  ไฟล์เล็กเกินไป อาจยังไม่มีข้อมูล`);
    console.log(`   💡 รัน: node import-excel-sync.js && node prepare-template.js`);
  }
  console.log('');
} else {
  console.log('   ❌ pos-template.db ไม่มี');
  console.log('   💡 รัน: node import-excel-sync.js && node prepare-template.js\n');
}

// 6. ตรวจสอบ Excel file
console.log('6. Excel Data File:');
if (fs.existsSync('ส่งข้อมูลPOS.xlsx')) {
  const stats = fs.statSync('ส่งข้อมูลPOS.xlsx');
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ ส่งข้อมูลPOS.xlsx มีอยู่แล้ว (${sizeMB} MB)\n`);
} else {
  console.log('   ⚠️  ส่งข้อมูลPOS.xlsx ไม่มี');
  console.log('   💡 วางไฟล์ Excel ในโฟลเดอร์โปรเจค\n');
}

// 7. ตรวจสอบ dist folder
console.log('7. Build Output:');
if (fs.existsSync('dist')) {
  console.log('   ✅ dist/ มีอยู่แล้ว (code ถูก build แล้ว)\n');
} else {
  console.log('   ⚠️  dist/ ไม่มี - ต้องรัน npm run build ก่อน\n');
}

// สรุป
console.log('═'.repeat(60));
console.log('สรุป:');
console.log('═'.repeat(60));

if (os.platform() === 'win32') {
  console.log('✅ พร้อม build บน Windows!');
  console.log('\nขั้นตอนต่อไป:');
  console.log('1. npm install (ถ้ายังไม่ได้รัน)');
  console.log('2. node import-excel-sync.js (import ข้อมูล)');
  console.log('3. npm run build:win (build โปรแกรม)');
} else {
  console.log('⚠️  กำลัง build บน ' + os.platform());
  console.log('\n⚠️  คำเตือน: Native modules จะไม่ทำงานบน Windows!');
  console.log('\nแนวทางแก้ไข:');
  console.log('1. Build บนเครื่อง Windows โดยตรง (แนะนำ)');
  console.log('2. ใช้ GitHub Actions (ดูคู่มือ GITHUB_BUILD_GUIDE.md)');
  console.log('3. ใช้ Docker/VM Windows');
}

console.log('');
