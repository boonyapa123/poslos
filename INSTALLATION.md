# 📦 คู่มือการติดตั้งและ Deployment

## 🖥️ ระบบปฏิบัติการที่รองรับ

ระบบ POS นี้รองรับ 3 ระบบปฏิบัติการหลัก:

### ✅ **Windows**
- Windows 10 (64-bit) ขึ้นไป
- Windows 11
- ไฟล์ติดตั้ง: `.exe` (NSIS Installer)

### ✅ **macOS**
- macOS 10.13 (High Sierra) ขึ้นไป
- macOS 11 (Big Sur), 12 (Monterey), 13 (Ventura), 14 (Sonoma)
- ไฟล์ติดตั้ง: `.dmg` (Disk Image)

### ✅ **Linux**
- Ubuntu 18.04 ขึ้นไป
- Debian 10 ขึ้นไป
- Fedora, CentOS, openSUSE
- ไฟล์ติดตั้ง: `.AppImage`, `.deb`, `.rpm`

---

## 🛠️ การ Build โปรแกรม

### **1. ติดตั้ง Dependencies**

```bash
# Clone repository
git clone <repository-url>
cd pos-system

# ติดตั้ง Node.js packages
npm install
```

### **2. Build สำหรับ Development**

```bash
# Run in development mode
npm run dev

# หรือ
npm start
```

### **3. Build สำหรับ Production**

#### **Build สำหรับ Windows:**
```bash
npm run build:win
```
ผลลัพธ์: `dist/POS-System-Setup-1.0.0.exe`

#### **Build สำหรับ macOS:**
```bash
npm run build:mac
```
ผลลัพธ์: `dist/POS-System-1.0.0.dmg`

#### **Build สำหรับ Linux:**
```bash
npm run build:linux
```
ผลลัพธ์: 
- `dist/POS-System-1.0.0.AppImage`
- `dist/POS-System-1.0.0.deb`
- `dist/POS-System-1.0.0.rpm`

#### **Build ทุก Platform:**
```bash
npm run build:all
```

---

## ⚙️ Configuration สำหรับ Electron Builder

สร้างไฟล์ `electron-builder.json`:

```json
{
  "appId": "com.yourcompany.pos",
  "productName": "POS System",
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },
  "files": [
    "dist/**/*",
    "src/**/*",
    "package.json"
  ],
  "mac": {
    "category": "public.app-category.business",
    "icon": "build/icon.icns",
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      }
    ]
  },
  "win": {
    "icon": "build/icon.ico",
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ]
  },
  "linux": {
    "icon": "build/icon.png",
    "category": "Office",
    "target": [
      "AppImage",
      "deb",
      "rpm"
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

---

## 📝 อัพเดท package.json

เพิ่ม scripts สำหรับ build:

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux",
    "build:all": "electron-builder -mwl",
    "pack": "electron-builder --dir",
    "dist": "npm run build && electron-builder"
  }
}
```

---

## 📥 การติดตั้งสำหรับผู้ใช้งาน

### **Windows:**

1. ดาวน์โหลด `POS-System-Setup-1.0.0.exe`
2. Double-click เพื่อเริ่มติดตั้ง
3. เลือก folder ที่ต้องการติดตั้ง
4. คลิก "Install"
5. เสร็จแล้ว! เปิดโปรแกรมจาก Desktop shortcut

**ตำแหน่งไฟล์:**
- โปรแกรม: `C:\Program Files\POS System\`
- Database: `%APPDATA%\POS System\pos.db`
- Logs: `%APPDATA%\POS System\logs\`

### **macOS:**

1. ดาวน์โหลด `POS-System-1.0.0.dmg`
2. Double-click เพื่อ mount
3. ลาก icon ไปที่ Applications folder
4. เปิดโปรแกรมจาก Applications

**ตำแหน่งไฟล์:**
- โปรแกรม: `/Applications/POS System.app`
- Database: `~/Library/Application Support/POS System/pos.db`
- Logs: `~/Library/Logs/POS System/`

**หมายเหตุ:** ครั้งแรกอาจมี warning "App from unidentified developer"
- คลิกขวาที่ app → เลือก "Open"
- หรือไปที่ System Preferences → Security & Privacy → คลิก "Open Anyway"

### **Linux (Ubuntu/Debian):**

#### **วิธีที่ 1: AppImage (แนะนำ)**
```bash
# ดาวน์โหลด
wget https://example.com/POS-System-1.0.0.AppImage

# ให้สิทธิ์ execute
chmod +x POS-System-1.0.0.AppImage

# รัน
./POS-System-1.0.0.AppImage
```

#### **วิธีที่ 2: .deb Package**
```bash
# ติดตั้ง
sudo dpkg -i POS-System-1.0.0.deb

# แก้ dependencies (ถ้ามี error)
sudo apt-get install -f

# รัน
pos-system
```

**ตำแหน่งไฟล์:**
- โปรแกรม: `/opt/POS System/`
- Database: `~/.config/POS System/pos.db`
- Logs: `~/.config/POS System/logs/`

---

## 📋 System Requirements

### **ขั้นต่ำ:**
- **CPU**: Intel Core i3 หรือเทียบเท่า
- **RAM**: 4 GB
- **Storage**: 500 MB ว่าง
- **Display**: 1024x768 (หน้าจอหลัก)
- **Network**: ไม่จำเป็น (ทำงาน offline ได้)

### **แนะนำ:**
- **CPU**: Intel Core i5 หรือสูงกว่า
- **RAM**: 8 GB
- **Storage**: 2 GB ว่าง (สำหรับข้อมูลจำนวนมาก)
- **Display**: 1920x1080 (หน้าจอหลัก) + 800x600 (หน้าจอลูกค้า)
- **Network**: Broadband internet สำหรับ sync

### **อุปกรณ์เสริม:**
- ✅ Barcode Scanner (USB/Bluetooth)
- ✅ Receipt Printer (USB/Network)
- ✅ Cash Drawer (เชื่อมกับ printer)
- ✅ Customer Display (จอที่ 2)

---

## 🚀 การติดตั้งครั้งแรก

### **ขั้นตอนที่ 1: ติดตั้งโปรแกรม**
1. ดาวน์โหลดไฟล์ติดตั้งตามระบบปฏิบัติการ
2. ติดตั้งตามขั้นตอน
3. เปิดโปรแกรม

### **ขั้นตอนที่ 2: Import ข้อมูลเริ่มต้น**
1. วางไฟล์ `ส่งข้อมูลPOS.xlsx` ไว้ที่ root folder
2. เปิดโปรแกรม → จะ import อัตโนมัติ
3. รอจนกว่า import เสร็จ (~5-10 นาที)

### **ขั้นตอนที่ 3: ตั้งค่าระบบ**
1. คลิกปุ่ม ⚙️ (Settings)
2. ตั้งค่า:
   - Terminal ID: `POS-01`
   - API Base URL: `https://your-server.com/api`
   - API Key: `your-api-key`
   - VAT Rate: `7`
   - VAT Type: `INCLUSIVE`
3. คลิก "ทดสอบการเชื่อมต่อ"
4. คลิก "บันทึก"

### **ขั้นตอนที่ 4: Sync ข้อมูลครั้งแรก**
1. คลิกปุ่ม "⬇ ดึงข้อมูล"
2. รอจนกว่าดึงข้อมูลเสร็จ
3. ตรวจสอบว่าข้อมูลครบถ้วน

### **ขั้นตอนที่ 5: เริ่มใช้งาน**
1. คลิกปุ่ม 🕐 (Shift)
2. ใส่เงินสดเปิดกะ
3. คลิก "เริ่มกะ"
4. พร้อมขาย! 🎉

---

## 🔄 การอัพเดทโปรแกรม

### **Manual Update:**
1. ดาวน์โหลดเวอร์ชันใหม่
2. ปิดโปรแกรมเดิม
3. ติดตั้งเวอร์ชันใหม่ทับ
4. ข้อมูลใน database จะยังคงอยู่

### **Auto Update (ถ้ามี):**
1. โปรแกรมจะแจ้งเตือนเมื่อมีเวอร์ชันใหม่
2. คลิก "Update"
3. โปรแกรมจะดาวน์โหลดและติดตั้งอัตโนมัติ
4. Restart โปรแกรม

---

## 💾 การ Backup ข้อมูล

### **Windows:**
```bash
# Backup database
copy "%APPDATA%\POS System\pos.db" "D:\Backup\pos_backup_%date%.db"
```

### **macOS:**
```bash
# Backup database
cp ~/Library/Application\ Support/POS\ System/pos.db ~/Desktop/pos_backup_$(date +%Y%m%d).db
```

### **Linux:**
```bash
# Backup database
cp ~/.config/POS\ System/pos.db ~/backup/pos_backup_$(date +%Y%m%d).db
```

### **แนะนำ:**
- Backup ทุกวัน (หลังปิดกะ)
- เก็บ backup ไว้ 30 วัน
- เก็บ backup ที่ external drive หรือ cloud

---

## 🔧 การแก้ปัญหา

### **โปรแกรมเปิดไม่ได้:**
1. ตรวจสอบว่าติดตั้งถูกต้อง
2. ลอง restart เครื่อง
3. ตรวจสอบ system requirements
4. ดู error logs

### **ข้อมูลหาย:**
1. ตรวจสอบว่าไฟล์ `pos.db` ยังอยู่หรือไม่
2. Restore จาก backup
3. Import จาก Excel ใหม่

### **Sync ไม่ได้:**
1. ตรวจสอบ internet connection
2. ตรวจสอบ Settings (API URL, API Key)
3. คลิก "ทดสอบการเชื่อมต่อ"
4. ติดต่อ IT support

### **หน้าจอลูกค้าไม่แสดง:**
1. ตรวจสอบว่าเชื่อมต่อจอที่ 2
2. ตั้งค่า Display settings ของ OS
3. Restart โปรแกรม

### **Printer ไม่ทำงาน:**
1. ตรวจสอบว่าเชื่อมต่อ printer
2. ติดตั้ง printer driver
3. ตั้งค่า default printer
4. ทดสอบพิมพ์จาก OS

---

## 🏗️ การ Build จาก Source Code

### **Prerequisites:**
```bash
# ติดตั้ง Node.js (v18 ขึ้นไป)
node --version  # ควรเป็น v18.x หรือสูงกว่า
npm --version   # ควรเป็น v9.x หรือสูงกว่า
```

### **ขั้นตอน:**

```bash
# 1. Clone repository
git clone <repository-url>
cd pos-system

# 2. ติดตั้ง dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Build Electron app
npm run dist

# 5. ไฟล์ติดตั้งจะอยู่ใน dist/
ls dist/
```

---

## 📦 Electron Builder Configuration

สร้างไฟล์ `electron-builder.json`:

```json
{
  "appId": "com.yourcompany.pos",
  "productName": "POS System",
  "copyright": "Copyright © 2025 Your Company",
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },
  "files": [
    "dist/**/*",
    "src/**/*",
    "package.json",
    "ส่งข้อมูลPOS.xlsx"
  ],
  "extraResources": [
    {
      "from": "ส่งข้อมูลPOS.xlsx",
      "to": "ส่งข้อมูลPOS.xlsx"
    }
  ],
  "mac": {
    "category": "public.app-category.business",
    "icon": "build/icon.icns",
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      }
    ],
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "dmg": {
    "contents": [
      {
        "x": 130,
        "y": 220
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ]
  },
  "win": {
    "icon": "build/icon.ico",
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "allowElevation": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "POS System",
    "installerIcon": "build/icon.ico",
    "uninstallerIcon": "build/icon.ico",
    "installerHeaderIcon": "build/icon.ico"
  },
  "linux": {
    "icon": "build/icons",
    "category": "Office",
    "target": [
      "AppImage",
      "deb",
      "rpm"
    ],
    "desktop": {
      "Name": "POS System",
      "Comment": "Point of Sale System",
      "Categories": "Office;Finance;"
    }
  },
  "deb": {
    "depends": [
      "gconf2",
      "gconf-service",
      "libnotify4",
      "libappindicator1",
      "libxtst6",
      "libnss3"
    ]
  }
}
```

---

## 🎨 สร้าง Icons

### **ขนาด Icons ที่ต้องการ:**

**Windows (.ico):**
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

**macOS (.icns):**
- 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024

**Linux (.png):**
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512

### **วิธีสร้าง:**
```bash
# ใช้ ImageMagick
convert icon.png -resize 256x256 build/icon.png

# หรือใช้ online tools:
# - https://iconverticons.com/online/
# - https://cloudconvert.com/png-to-ico
```

---

## 🚢 Deployment Checklist

### **ก่อน Release:**
- [ ] ทดสอบบนทุก platform (Windows, macOS, Linux)
- [ ] ทดสอบ installation process
- [ ] ทดสอบ uninstallation
- [ ] ทดสอบ auto-update (ถ้ามี)
- [ ] ตรวจสอบ icons และ branding
- [ ] ตรวจสอบ version number
- [ ] เตรียม release notes
- [ ] เตรียม user manual
- [ ] ทดสอบกับ hardware จริง (printer, scanner)
- [ ] ทดสอบ dual monitor setup

### **หลัง Release:**
- [ ] Upload installers ไปยัง download server
- [ ] แจ้งผู้ใช้งาน
- [ ] เตรียม support channel
- [ ] Monitor error reports
- [ ] เก็บ backup ของ installers

---

## 📞 Support & Maintenance

### **การอัพเดทข้อมูล:**
1. อัพเดทไฟล์ Excel ใหม่
2. วางทับไฟล์เดิม
3. ลบ `pos.db`
4. Restart โปรแกรม → จะ import ใหม่

### **การย้ายเครื่อง:**
1. Backup `pos.db` จากเครื่องเก่า
2. ติดตั้งโปรแกรมบนเครื่องใหม่
3. Copy `pos.db` ไปวางที่เครื่องใหม่
4. Restart โปรแกรม

### **การ Reset ระบบ:**
1. ปิดโปรแกรม
2. ลบ `pos.db`
3. ลบ configuration files
4. เปิดโปรแกรม → ตั้งค่าใหม่

---

## 🔐 Security Considerations

### **สำหรับ Production:**
1. เปลี่ยน API Key เป็นของจริง
2. ใช้ HTTPS สำหรับ API calls
3. Encrypt database (ถ้าต้องการ)
4. ตั้งค่า firewall
5. จำกัดสิทธิ์การเข้าถึง

### **Best Practices:**
- อย่าเก็บ API Key ใน source code
- ใช้ environment variables
- Backup ข้อมูลเป็นประจำ
- อัพเดท dependencies เป็นระยะ

---

## 📊 Performance Tips

### **สำหรับข้อมูลจำนวนมาก:**
1. เพิ่ม RAM (8 GB ขึ้นไป)
2. ใช้ SSD แทน HDD
3. Vacuum database เป็นระยะ:
   ```sql
   VACUUM;
   ```
4. ลบ transaction เก่าที่ sync แล้ว (เก็บไว้ 90 วัน)

### **สำหรับ Sync:**
1. Sync ในช่วงที่ไม่มีลูกค้า
2. ใช้ internet ความเร็วสูง
3. Sync เป็นระยะ (ไม่ต้องรอปิดกะ)

---

## 📱 Multi-Store Setup

### **สำหรับหลายสาขา:**
1. ติดตั้งแยกแต่ละสาขา
2. ตั้ง Terminal ID ไม่ซ้ำกัน:
   - สาขา 1: `POS-01`, `POS-02`, `POS-03`
   - สาขา 2: `POS-11`, `POS-12`, `POS-13`
3. ใช้ API Server เดียวกัน
4. Sync ข้อมูลจาก server กลาง

---

## 🎓 Training Guide

### **สำหรับพนักงานใหม่:**
1. แนะนำ UI และ layout
2. สอนการสแกนสินค้า
3. สอนการค้นหาสินค้า (F6)
4. สอนการเลือกลูกค้า (Delete)
5. สอนการชำระเงิน (End)
6. สอนการพักบิล (F9)
7. ฝึกใช้ keyboard shortcuts

### **สำหรับผู้จัดการ:**
1. การเปิด/ปิดกะ
2. การ sync ข้อมูล
3. การตั้งค่าระบบ
4. การดู reports
5. การแก้ปัญหาเบื้องต้น

---

## 📞 Contact & Support

**Technical Support:**
- Email: support@yourcompany.com
- Phone: 02-XXX-XXXX
- Line: @yourcompany

**Documentation:**
- User Manual: `USER_MANUAL.md`
- System Notes: `SYSTEM_NOTES.md`
- API Documentation: `API_DOCS.md`

---

**เอกสารนี้สร้างโดย:** Kiro AI Assistant  
**วันที่:** 17 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.0.0
