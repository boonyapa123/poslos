/**
 * เตรียม template database สำหรับ build
 * Copy database ที่ import แล้วมาเป็น template
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Cross-platform database path
let sourcePath;

if (process.platform === 'win32') {
  // Windows: %APPDATA%/poslos/pos.db
  sourcePath = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'poslos', 'pos.db');
} else if (process.platform === 'darwin') {
  // macOS: ~/Library/Application Support/poslos/pos.db
  sourcePath = path.join(os.homedir(), 'Library', 'Application Support', 'poslos', 'pos.db');
} else {
  // Linux: ~/.config/poslos/pos.db
  sourcePath = path.join(os.homedir(), '.config', 'poslos', 'pos.db');
}

const targetPath = 'pos-template.db';

console.log('📦 Preparing template database for build...');
console.log('📁 Source:', sourcePath);
console.log('📁 Target:', targetPath);

if (!fs.existsSync(sourcePath)) {
  console.error('❌ Source database not found!');
  console.error('   Please run: node import-all-sheets.js first');
  process.exit(1);
}

// Copy file
fs.copyFileSync(sourcePath, targetPath);

// Check size
const stats = fs.statSync(targetPath);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`✅ Template created: ${sizeMB} MB`);
console.log('');
console.log('📊 Template will be included in the build and copied to:');
console.log('   - macOS: ~/Library/Application Support/poslos/pos.db');
console.log('   - Windows: %APPDATA%/poslos/pos.db');
console.log('   - Linux: ~/.config/poslos/pos.db');
console.log('');
console.log('✅ Ready to build!');
