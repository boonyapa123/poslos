# 🚀 คู่มือการ Deployment และ Distribution

## 📋 สารบัญ

1. [การเตรียมพร้อมก่อน Deploy](#การเตรียมพร้อมก่อน-deploy)
2. [การ Build สำหรับ Production](#การ-build-สำหรับ-production)
3. [การ Distribution](#การ-distribution)
4. [การ Update และ Maintenance](#การ-update-และ-maintenance)
5. [Monitoring และ Support](#monitoring-และ-support)

---

## การเตรียมพร้อมก่อน Deploy

### 1. ตรวจสอบ Version

```bash
# อัพเดท version ใน package.json
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 2. อัพเดท CHANGELOG

สร้างไฟล์ `CHANGELOG.md`:

```markdown
# Changelog

## [1.0.0] - 2025-11-17

### Added
- ระบบขายสินค้าพร้อมราคาหลายระดับ
- ระบบพักบิลและเรียกบิลคืน
- แสดงผลสองหน้าจอ (พนักงาน + ลูกค้า)
- Keyboard shortcuts ครบทุกปุ่ม
- คำนวณ VAT แบบ In/Out
- รองรับหลายกะต่อวัน
- ซิงค์ข้อมูลกับ Server

### Fixed
- แก้ไขปัญหา...

### Changed
- ปรับปรุง...
```

### 3. ทดสอบทุก Platform

```bash
# Windows
npm run build:win
# ทดสอบติดตั้งและใช้งาน

# macOS
npm run build:mac
# ทดสอบติดตั้งและใช้งาน

# Linux
npm run build:linux
# ทดสอบติดตั้งและใช้งาน
```

### 4. ตรวจสอบ Configuration

```typescript
// src/main/config.ts
export const config = {
  version: '1.0.0',
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.production.com',
  environment: 'production',
  debug: false,
  autoUpdate: true
};
```

---

## การ Build สำหรับ Production

### 1. Clean Build

```bash
# ลบไฟล์เก่า
rm -rf dist/
rm -rf dist-electron/
rm -rf node_modules/

# ติดตั้งใหม่
npm install

# Build
npm run build
```

### 2. Build แต่ละ Platform

#### Windows:

```bash
# Build Windows installer
npm run build:win

# ผลลัพธ์:
# dist-electron/POS-System-Setup-1.0.0.exe
```

**ขนาดไฟล์:** ~150-200 MB

**ทดสอบ:**
1. ติดตั้งบน Windows 10/11
2. ทดสอบการเปิดโปรแกรม
3. ทดสอบ import ข้อมูล
4. ทดสอบการขาย
5. ทดสอบการ sync
6. ทดสอบการ uninstall

#### macOS:

```bash
# Build macOS installer
npm run build:mac

# ผลลัพธ์:
# dist-electron/POS-System-1.0.0.dmg
```

**ขนาดไฟล์:** ~150-200 MB

**ทดสอบ:**
1. Mount DMG
2. ลากไปที่ Applications
3. เปิดโปรแกรม (อาจมี Gatekeeper warning)
4. ทดสอบการใช้งาน

#### Linux:

```bash
# Build Linux packages
npm run build:linux

# ผลลัพธ์:
# dist-electron/POS-System-1.0.0.AppImage
# dist-electron/POS-System-1.0.0.deb
# dist-electron/POS-System-1.0.0.rpm
```

**ขนาดไฟล์:** ~150-200 MB แต่ละไฟล์

**ทดสอบ:**
1. ทดสอบ AppImage บน Ubuntu
2. ทดสอบ .deb บน Debian/Ubuntu
3. ทดสอบ .rpm บน Fedora/CentOS

### 3. Code Signing (Optional แต่แนะนำ)

#### Windows Code Signing:

```bash
# ต้องมี Code Signing Certificate (.pfx)
# ตั้งค่าใน electron-builder.json:
{
  "win": {
    "certificateFile": "cert.pfx",
    "certificatePassword": "password"
  }
}

# Build
npm run build:win
```

#### macOS Code Signing:

```bash
# ต้องมี Apple Developer Account
# ตั้งค่า identity:
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"

# Build และ sign
npm run build:mac

# Notarize (ส่งให้ Apple ตรวจสอบ)
xcrun notarytool submit dist-electron/POS-System-1.0.0.dmg \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait
```

---

## การ Distribution

### 1. การ Upload ไฟล์

#### Option A: GitHub Releases

```bash
# 1. Tag version
git tag v1.0.0
git push origin v1.0.0

# 2. สร้าง Release บน GitHub
# ไปที่ https://github.com/your-repo/releases/new

# 3. Upload ไฟล์:
# - POS-System-Setup-1.0.0.exe
# - POS-System-1.0.0.dmg
# - POS-System-1.0.0.AppImage
# - POS-System-1.0.0.deb
# - POS-System-1.0.0.rpm

# 4. เขียน Release Notes
```

#### Option B: Self-Hosted Server

```bash
# Upload ไปยัง server
scp dist-electron/* user@server:/var/www/downloads/

# สร้าง download page
# https://yoursite.com/downloads/
```

#### Option C: Cloud Storage

```bash
# AWS S3
aws s3 cp dist-electron/ s3://your-bucket/releases/v1.0.0/ --recursive

# Google Cloud Storage
gsutil cp dist-electron/* gs://your-bucket/releases/v1.0.0/

# Azure Blob Storage
az storage blob upload-batch -d releases/v1.0.0 -s dist-electron/
```

### 2. สร้าง Download Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>ดาวน์โหลด POS System</title>
</head>
<body>
  <h1>ดาวน์โหลด POS System v1.0.0</h1>
  
  <h2>Windows</h2>
  <a href="POS-System-Setup-1.0.0.exe">
    ดาวน์โหลดสำหรับ Windows (150 MB)
  </a>
  
  <h2>macOS</h2>
  <a href="POS-System-1.0.0.dmg">
    ดาวน์โหลดสำหรับ macOS (150 MB)
  </a>
  
  <h2>Linux</h2>
  <a href="POS-System-1.0.0.AppImage">
    ดาวน์โหลด AppImage (150 MB)
  </a>
  <a href="POS-System-1.0.0.deb">
    ดาวน์โหลด .deb (150 MB)
  </a>
  <a href="POS-System-1.0.0.rpm">
    ดาวน์โหลด .rpm (150 MB)
  </a>
  
  <h2>Release Notes</h2>
  <ul>
    <li>ระบบขายสินค้าพร้อมราคาหลายระดับ</li>
    <li>ระบบพักบิลและเรียกบิลคืน</li>
    <li>แสดงผลสองหน้าจอ</li>
  </ul>
</body>
</html>
```

### 3. สร้าง Update Server (สำหรับ Auto Update)

```javascript
// update-server.js
const express = require('express');
const app = express();

app.get('/update/:platform/:version', (req, res) => {
  const { platform, version } = req.params;
  
  // ตรวจสอบว่ามี version ใหม่หรือไม่
  const latestVersion = '1.0.0';
  
  if (version < latestVersion) {
    res.json({
      version: latestVersion,
      url: `https://yoursite.com/downloads/POS-System-${latestVersion}.${platform}`,
      releaseNotes: 'New features and bug fixes'
    });
  } else {
    res.status(204).send();
  }
});

app.listen(3000);
```

---

## การ Update และ Maintenance

### 1. Auto Update Configuration

#### ติดตั้ง electron-updater:

```bash
npm install electron-updater
```

#### เพิ่ม Auto Update Logic:

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater';
import { app, dialog } from 'electron';

export function setupAutoUpdater() {
  // ตั้งค่า update server
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://yoursite.com/updates'
  });

  // ตรวจสอบ update เมื่อเปิดโปรแกรม
  autoUpdater.checkForUpdatesAndNotify();

  // Event handlers
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'มี Update ใหม่',
      message: `เวอร์ชัน ${info.version} พร้อมให้ดาวน์โหลด`,
      buttons: ['ดาวน์โหลด', 'ภายหลัง']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update พร้อมติดตั้ง',
      message: 'จะติดตั้ง update เมื่อปิดโปรแกรม',
      buttons: ['Restart ตอนนี้', 'ภายหลัง']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}
```

#### เรียกใช้ใน main.ts:

```typescript
// src/main/main.ts
import { setupAutoUpdater } from './updater';

app.whenReady().then(() => {
  // ... other setup
  
  if (!app.isPackaged) {
    console.log('Development mode - auto update disabled');
  } else {
    setupAutoUpdater();
  }
});
```

### 2. Manual Update Process

#### สำหรับผู้ใช้:

1. ดาวน์โหลดเวอร์ชันใหม่
2. ปิดโปรแกรมเดิม
3. ติดตั้งเวอร์ชันใหม่ทับ
4. ข้อมูลใน database จะยังคงอยู่

#### สำหรับ Developer:

```bash
# 1. อัพเดท version
npm version patch

# 2. Build
npm run build:all

# 3. Upload ไฟล์ใหม่
# 4. แจ้งผู้ใช้งาน
```

### 3. Database Migration

```typescript
// src/main/migrations.ts
import { Sequelize } from 'sequelize';

export async function runMigrations(sequelize: Sequelize) {
  const currentVersion = await getCurrentVersion();
  
  if (currentVersion < '1.1.0') {
    // Migration สำหรับ v1.1.0
    await sequelize.query(`
      ALTER TABLE transactions 
      ADD COLUMN discount_amount REAL DEFAULT 0
    `);
  }
  
  if (currentVersion < '1.2.0') {
    // Migration สำหรับ v1.2.0
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        discount_percent REAL
      )
    `);
  }
  
  await updateVersion('1.2.0');
}
```

---

## Monitoring และ Support

### 1. Error Tracking

#### ติดตั้ง Sentry:

```bash
npm install @sentry/electron
```

#### ตั้งค่า:

```typescript
// src/main/main.ts
import * as Sentry from '@sentry/electron';

Sentry.init({
  dsn: 'https://your-sentry-dsn',
  environment: process.env.NODE_ENV || 'production'
});
```

### 2. Usage Analytics

```typescript
// src/main/analytics.ts
import axios from 'axios';

export async function trackEvent(event: string, data: any) {
  try {
    await axios.post('https://yoursite.com/analytics', {
      event,
      data,
      timestamp: new Date().toISOString(),
      version: app.getVersion()
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

// ใช้งาน:
trackEvent('app_started', { platform: process.platform });
trackEvent('transaction_completed', { amount: 1000 });
```

### 3. Logging

```typescript
// src/main/logger.ts
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const logDir = path.join(app.getPath('userData'), 'logs');
const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);

// สร้าง log directory
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
  
  // เขียนลง console
  console.log(logMessage);
  
  // เขียนลงไฟล์
  fs.appendFileSync(logFile, logMessage);
}

// ใช้งาน:
log('INFO', 'Application started');
log('ERROR', 'Failed to sync', { error: 'Network error' });
```

### 4. Remote Support

```typescript
// src/main/support.ts
import { ipcMain } from 'electron';
import axios from 'axios';

ipcMain.handle('send-support-request', async (event, data) => {
  try {
    const response = await axios.post('https://yoursite.com/support', {
      ...data,
      version: app.getVersion(),
      platform: process.platform,
      logs: getRecentLogs()
    });
    
    return { success: true, ticketId: response.data.ticketId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

---

## Deployment Checklist

### ก่อน Release:

- [ ] อัพเดท version number
- [ ] อัพเดท CHANGELOG.md
- [ ] ทดสอบบนทุก platform
- [ ] ทดสอบ installation/uninstallation
- [ ] ทดสอบ database migration
- [ ] ทดสอบ API integration
- [ ] ทดสอบกับ hardware จริง
- [ ] ตรวจสอบ icons และ branding
- [ ] Code signing (ถ้ามี)
- [ ] เตรียม release notes
- [ ] เตรียม user manual
- [ ] Backup source code
- [ ] Tag version ใน Git

### หลัง Release:

- [ ] Upload installers
- [ ] สร้าง GitHub Release
- [ ] อัพเดท download page
- [ ] แจ้งผู้ใช้งาน
- [ ] Monitor error reports
- [ ] เตรียม support channel
- [ ] เก็บ backup ของ installers
- [ ] อัพเดท documentation

---

## Multi-Store Deployment

### สำหรับหลายสาขา:

#### 1. Central Server Setup:

```bash
# API Server สำหรับ sync ข้อมูล
# - Products
# - Customers
# - Prices
# - Transactions
```

#### 2. POS Terminal Setup:

```bash
# แต่ละสาขาติดตั้งแยก
# ตั้ง Terminal ID ไม่ซ้ำกัน:

# สาขา 1:
Terminal ID: POS-01, POS-02, POS-03

# สาขา 2:
Terminal ID: POS-11, POS-12, POS-13

# สาขา 3:
Terminal ID: POS-21, POS-22, POS-23
```

#### 3. Sync Configuration:

```typescript
// config.ts
export const config = {
  terminalId: 'POS-01',
  branchId: 'BRANCH-01',
  apiBaseUrl: 'https://api.yourcompany.com',
  syncInterval: 300000, // 5 minutes
  autoSync: true
};
```

---

## Backup และ Recovery

### 1. Backup Strategy:

```bash
# Daily backup (หลังปิดกะ)
# Weekly backup (วันอาทิตย์)
# Monthly backup (วันที่ 1 ของเดือน)
```

### 2. Backup Script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="$HOME/pos-backups"
DB_PATH="$HOME/.config/POS System/pos.db"

# สร้าง backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
cp "$DB_PATH" "$BACKUP_DIR/pos_backup_$DATE.db"

# ลบ backup เก่า (เก็บไว้ 30 วัน)
find "$BACKUP_DIR" -name "pos_backup_*.db" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/pos_backup_$DATE.db"
```

### 3. Recovery Process:

```bash
# 1. ปิดโปรแกรม
# 2. Restore database
cp ~/pos-backups/pos_backup_20251117.db ~/.config/POS\ System/pos.db
# 3. เปิดโปรแกรม
```

---

## Performance Monitoring

### 1. System Requirements Check:

```typescript
// src/main/system-check.ts
import * as os from 'os';

export function checkSystemRequirements() {
  const totalMem = os.totalmem() / (1024 * 1024 * 1024); // GB
  const freeMem = os.freemem() / (1024 * 1024 * 1024); // GB
  const cpus = os.cpus();
  
  const warnings = [];
  
  if (totalMem < 4) {
    warnings.push('RAM น้อยกว่า 4 GB อาจทำงานช้า');
  }
  
  if (freeMem < 1) {
    warnings.push('RAM ว่างน้อยกว่า 1 GB');
  }
  
  if (cpus.length < 2) {
    warnings.push('CPU มีน้อยกว่า 2 cores');
  }
  
  return { ok: warnings.length === 0, warnings };
}
```

### 2. Performance Metrics:

```typescript
// src/main/metrics.ts
export class PerformanceMetrics {
  private startTime: number;
  
  start() {
    this.startTime = Date.now();
  }
  
  end(operation: string) {
    const duration = Date.now() - this.startTime;
    log('PERF', `${operation} took ${duration}ms`);
    
    if (duration > 1000) {
      log('WARN', `${operation} is slow (${duration}ms)`);
    }
  }
}

// ใช้งาน:
const metrics = new PerformanceMetrics();
metrics.start();
await syncData();
metrics.end('Data sync');
```

---

## Security Best Practices

### 1. API Key Management:

```typescript
// ไม่ควร hardcode API key
// ❌ Bad
const apiKey = 'sk_live_1234567890';

// ✅ Good
const apiKey = process.env.API_KEY || '';
```

### 2. Database Encryption:

```bash
# ใช้ SQLCipher สำหรับ encrypt database
npm install @journeyapps/sqlcipher
```

```typescript
// src/main/database.ts
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './pos.db',
  dialectOptions: {
    key: process.env.DB_ENCRYPTION_KEY
  }
});
```

### 3. HTTPS Only:

```typescript
// src/main/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.yourcompany.com', // HTTPS only
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}`
  }
});
```

---

## Support และ Maintenance Plan

### 1. Support Channels:

- **Email:** support@yourcompany.com
- **Phone:** 02-XXX-XXXX (จันทร์-ศุกร์ 9:00-18:00)
- **Line:** @yourcompany
- **Remote Support:** TeamViewer, AnyDesk

### 2. Maintenance Schedule:

- **Daily:** Backup ข้อมูล
- **Weekly:** ตรวจสอบ logs, error reports
- **Monthly:** อัพเดท dependencies, security patches
- **Quarterly:** Major updates, new features

### 3. SLA (Service Level Agreement):

- **Critical Issues:** แก้ไขภายใน 4 ชั่วโมง
- **High Priority:** แก้ไขภายใน 24 ชั่วโมง
- **Medium Priority:** แก้ไขภายใน 3 วัน
- **Low Priority:** แก้ไขภายใน 7 วัน

---

**เอกสารนี้สร้างโดย:** Kiro AI Assistant  
**วันที่:** 17 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.0.0
