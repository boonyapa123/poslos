# แก้ปัญหา sqlite3 Error บน Windows

## สาเหตุของปัญหา

```
Error: Please install sqlite3 package manually
```

**สาเหตุ:** Native modules (sqlite3) ถูก compile บน Mac แล้วนำไปรันบน Windows ทำให้ไม่ทำงาน

---

## ✅ วิธีแก้ไขที่แนะนำ: Build บน Windows

### ขั้นตอนที่ 1: ติดตั้ง Node.js บน Windows

1. ดาวน์โหลด: https://nodejs.org/ (เลือก LTS)
2. ติดตั้งตามขั้นตอน
3. ✅ เลือก "Automatically install the necessary tools"
4. **ปิด Command Prompt แล้วเปิดใหม่**
5. ทดสอบ:
```bash
node -v
npm -v
```

### ขั้นตอนที่ 2: ตรวจสอบความพร้อม

```bash
node check-build-ready.js
```

### ขั้นตอนที่ 3: Build โปรแกรม

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. Import ข้อมูล
node import-excel-sync.js

# 3. Build
npm run build:win
```

### ขั้นตอนที่ 4: ผลลัพธ์

ไฟล์จะอยู่ที่ `dist-electron/`:
- `POS System 1.0.0.exe` - Portable (แนะนำ)
- `POS System-1.0.0-win.zip` - ZIP version

---

## 🚀 วิธีแก้ไขทางเลือก: GitHub Actions

ถ้าไม่มีเครื่อง Windows ให้ใช้ GitHub Actions build ให้:

### 1. Push code ขึ้น GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/poslos.git
git push -u origin main
```

### 2. ไปที่ GitHub
- เปิด repository
- คลิกแท็บ **Actions**
- คลิก **Build Windows**
- คลิก **Run workflow**

### 3. รอ 10-15 นาที

### 4. ดาวน์โหลด
- Scroll ลงด้านล่าง
- คลิก **windows-installer** ใน Artifacts
- แตกไฟล์ ZIP

---

## 🔍 ตรวจสอบว่า Build ถูกต้อง

### เช็คว่า Native Modules ถูก Rebuild

บนเครื่อง Windows หลัง `npm install`:

```bash
# ตรวจสอบ sqlite3
dir node_modules\sqlite3\build\Release

# ควรเห็นไฟล์ .node
```

### เช็ค Electron Version

```bash
npx electron --version
```

ควรได้ `v39.2.1` หรือใกล้เคียง

### เช็ค Node Version ใน Electron

```bash
npx electron -p "process.versions"
```

---

## ❌ สิ่งที่ไม่ควรทำ

### ❌ Build บน Mac แล้วรันบน Windows
- Native modules จะไม่ทำงาน
- จะได้ error sqlite3

### ❌ Copy node_modules จาก Mac ไป Windows
- Native modules ไม่ตรงกัน
- ต้องรัน `npm install` ใหม่บน Windows

### ❌ ใช้ sqlite3 version เก่า
- อาจไม่รองรับ Electron version ใหม่

---

## ✅ Best Practices

### 1. Build บน Platform เดียวกับที่จะใช้
- Windows → Build บน Windows
- Mac → Build บน Mac
- Linux → Build บน Linux

### 2. ใช้ CI/CD (GitHub Actions)
- Build อัตโนมัติ
- Build ทุก platform พร้อมกัน
- ไม่ต้องมีเครื่องทุก platform

### 3. ใช้ better-sqlite3 แทน sqlite3
- รองรับ cross-platform ดีกว่า
- Performance ดีกว่า
- แต่ยังต้อง rebuild อยู่ดี

---

## 📊 เปรียบเทียบวิธีการ

| วิธี | ข้อดี | ข้อเสีย | แนะนำ |
|------|-------|---------|-------|
| Build บน Windows | เร็ว, ควบคุมได้ | ต้องมีเครื่อง Windows | ⭐⭐⭐⭐⭐ |
| GitHub Actions | ไม่ต้องมีเครื่อง Windows | ช้า (10-15 นาที) | ⭐⭐⭐⭐ |
| Docker/VM | ยืดหยุ่น | ซับซ้อน | ⭐⭐⭐ |
| Build บน Mac | ง่าย | ไม่ทำงานบน Windows | ❌ |

---

## 🆘 ยังมีปัญหา?

### ลอง Rebuild Native Modules

```bash
npm rebuild sqlite3 --build-from-source
npm rebuild better-sqlite3 --build-from-source
```

### ลบ node_modules แล้วติดตั้งใหม่

```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

### ตรวจสอบ Build Tools

```bash
npm install --global windows-build-tools
```

---

## 📞 ติดต่อ

หากยังมีปัญหา กรุณาติดต่อทีมพัฒนา พร้อมแนบ:
1. Screenshot error
2. ผลลัพธ์จาก `node check-build-ready.js`
3. OS version และ Node version
