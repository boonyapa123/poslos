# คู่มือ Build โปรแกรมบน Windows

## ข้อกำหนดเบื้องต้น

### 1. ติดตั้ง Node.js
1. ดาวน์โหลด Node.js จาก https://nodejs.org/
2. เลือก LTS version (แนะนำ v18 หรือ v20)
3. ติดตั้งตามขั้นตอน (เลือก "Automatically install necessary tools" ด้วย)
4. เปิด Command Prompt แล้วตรวจสอบ:
```bash
node --version
npm --version
```

### 2. ติดตั้ง Git (ถ้ายังไม่มี)
1. ดาวน์โหลดจาก https://git-scm.com/download/win
2. ติดตั้งตามขั้นตอน

### 3. ติดตั้ง Build Tools
เปิด PowerShell แบบ Administrator แล้วรัน:
```bash
npm install --global windows-build-tools
```

หรือติดตั้ง Visual Studio Build Tools:
- ดาวน์โหลดจาก https://visualstudio.microsoft.com/downloads/
- เลือก "Build Tools for Visual Studio"
- ติดตั้ง "Desktop development with C++"

---

## ขั้นตอนการ Build

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd Poslos
```

หรือถ้ามีโฟลเดอร์อยู่แล้ว ให้ copy ทั้งโฟลเดอร์มาที่เครื่อง Windows

### 2. ติดตั้ง Dependencies
เปิด Command Prompt หรือ PowerShell ในโฟลเดอร์โปรเจค:
```bash
npm install
```

รอจนเสร็จ (อาจใช้เวลา 5-10 นาที)

### 3. Import ข้อมูล
วางไฟล์ `ส่งข้อมูลPOS.xlsx` ในโฟลเดอร์โปรเจค แล้วรัน:
```bash
node import-excel-sync.js
```

รอจนเห็นข้อความ "✅ Import completed successfully!"

### 4. Build โปรแกรม
```bash
npm run build:win
```

รอจนเสร็จ (อาจใช้เวลา 5-10 นาที)

### 5. ผลลัพธ์
ไฟล์ที่ได้จะอยู่ในโฟลเดอร์ `dist-electron/`:
- `POS System 1.0.0.exe` - Portable version (ไม่ต้อง install)
- `POS System-1.0.0-win.zip` - ZIP version

---

## แก้ปัญหา

### ปัญหา: npm install ล้มเหลว
**แก้ไข:**
```bash
npm cache clean --force
npm install
```

### ปัญหา: Python not found
**แก้ไข:**
ติดตั้ง Python 3:
```bash
npm install --global --production windows-build-tools
```

### ปัญหา: node-gyp error
**แก้ไข:**
```bash
npm install --global node-gyp
npm config set msvs_version 2019
```

### ปัญหา: sqlite3 build failed
**แก้ไข:**
```bash
npm rebuild sqlite3 --build-from-source
npm rebuild better-sqlite3 --build-from-source
```

---

## Build เฉพาะส่วนที่ต้องการ

### Build เฉพาะ Code (ไม่ build installer)
```bash
npm run build
```

### Build Portable version อย่างเดียว
```bash
npm run prepare-template
npm run build
npx electron-builder --win portable
```

### Build ZIP version อย่างเดียว
```bash
npm run prepare-template
npm run build
npx electron-builder --win zip
```

---

## หมายเหตุ

- ต้อง build บน Windows เท่านั้น เพื่อให้ native modules (sqlite3) ทำงานได้
- ไฟล์ที่ได้จะมีขนาดประมาณ 250-300 MB
- ข้อมูลสินค้าทั้งหมดจะถูกรวมอยู่ในโปรแกรม
- ครั้งแรกอาจใช้เวลานานเพราะต้องดาวน์โหลด Electron และ dependencies

---

## ติดต่อ

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา
