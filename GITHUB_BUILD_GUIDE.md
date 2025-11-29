# คู่มือ Build ด้วย GitHub Actions

GitHub Actions จะช่วย build โปรแกรมบน Windows Server ของ GitHub ให้อัตโนมัติ

---

## ขั้นตอนที่ 1: เตรียม Repository

### 1.1 สร้าง GitHub Repository
1. ไปที่ https://github.com/
2. คลิก **New repository**
3. ตั้งชื่อ เช่น `poslos`
4. เลือก **Private** (ถ้าไม่ต้องการให้คนอื่นเห็น)
5. คลิก **Create repository**

### 1.2 Push Code ขึ้น GitHub
เปิด Terminal/Command Prompt ในโฟลเดอร์โปรเจค:

```bash
# ถ้ายังไม่มี git init
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Initial commit"

# เชื่อมต่อกับ GitHub (เปลี่ยน username และ repo-name)
git remote add origin https://github.com/username/poslos.git

# Push
git branch -M main
git push -u origin main
```

---

## ขั้นตอนที่ 2: เตรียมไฟล์ข้อมูล

### 2.1 เพิ่มไฟล์ Excel ลง Git
ไฟล์ `ส่งข้อมูลPOS.xlsx` ต้องอยู่ใน repository:

```bash
git add ส่งข้อมูลPOS.xlsx
git commit -m "Add Excel data file"
git push
```

### 2.2 หรือใช้ GitHub Secrets (ถ้าไม่ต้องการให้ไฟล์อยู่ใน repo)
1. แปลงไฟล์เป็น Base64
2. เก็บใน GitHub Secrets
3. แก้ไข workflow ให้ decode ก่อนใช้

---

## ขั้นตอนที่ 3: ตรวจสอบ Workflow File

ไฟล์ `.github/workflows/build-windows.yml` ถูกสร้างไว้แล้ว

ตรวจสอบว่ามีไฟล์นี้:
```
.github/
  workflows/
    build-windows.yml
```

---

## ขั้นตอนที่ 4: รัน Build

### วิธีที่ 1: Push Code (Auto Build)
ทุกครั้งที่ push ไป branch `main` จะ build อัตโนมัติ:

```bash
git add .
git commit -m "Update code"
git push
```

### วิธีที่ 2: Manual Build
1. ไปที่ GitHub repository
2. คลิกแท็บ **Actions**
3. เลือก workflow **Build Windows**
4. คลิก **Run workflow**
5. เลือก branch `main`
6. คลิก **Run workflow**

---

## ขั้นตอนที่ 5: ดาวน์โหลดไฟล์

### 5.1 รอให้ Build เสร็จ
- ไปที่แท็บ **Actions**
- คลิกที่ workflow run ล่าสุด
- รอจนสถานะเป็น ✅ (ประมาณ 10-15 นาที)

### 5.2 ดาวน์โหลด
- Scroll ลงไปด้านล่าง
- ในส่วน **Artifacts**
- คลิก **windows-installer** เพื่อดาวน์โหลด
- แตกไฟล์ ZIP จะได้:
  - `POS System 1.0.0.exe` (Portable)
  - `POS System-1.0.0-win.zip` (ZIP version)

---

## ปรับแต่ง Workflow

### เปลี่ยน Branch ที่ Build
แก้ไขไฟล์ `.github/workflows/build-windows.yml`:

```yaml
on:
  push:
    branches: [ main, develop ]  # เพิ่ม branch อื่นๆ
```

### Build เฉพาะเมื่อมี Tag
```yaml
on:
  push:
    tags:
      - 'v*'  # เช่น v1.0.0, v1.0.1
```

### เพิ่มการ Import ข้อมูล
แก้ไขไฟล์ workflow เพิ่ม step:

```yaml
- name: Import data
  run: node import-excel-sync.js
```

---

## แก้ปัญหา

### ปัญหา: Build ล้มเหลว
1. ไปที่ **Actions** → คลิก workflow ที่ล้มเหลว
2. ดู logs เพื่อหาสาเหตุ
3. แก้ไขแล้ว push ใหม่

### ปัญหา: ไม่มี Artifacts
- ตรวจสอบว่า build สำเร็จหรือไม่
- ตรวจสอบ path ใน `upload-artifact`

### ปัญหา: ไฟล์ Excel ไม่พบ
- ตรวจสอบว่า commit ไฟล์ Excel แล้ว
- หรือใช้ GitHub Secrets

---

## ข้อดีของ GitHub Actions

✅ Build บน Windows Server จริง
✅ ไม่ต้องมีเครื่อง Windows
✅ Build อัตโนมัติทุกครั้งที่ push
✅ เก็บ artifacts ไว้ 90 วัน
✅ ฟรีสำหรับ public repo (2,000 นาที/เดือนสำหรับ private)

---

## ข้อจำกัด

⚠️ ใช้เวลา build นานกว่า (10-15 นาที)
⚠️ ต้องมี internet
⚠️ Private repo มีโควต้าจำกัด
⚠️ ไฟล์ artifacts หายหลัง 90 วัน

---

## ทางเลือกอื่น

### AppVeyor
- https://www.appveyor.com/
- รองรับ Windows build
- มี free tier

### CircleCI
- https://circleci.com/
- รองรับ Windows
- มี free tier

---

## สรุป

1. Push code ขึ้น GitHub
2. ไปที่ Actions → Run workflow
3. รอ 10-15 นาที
4. ดาวน์โหลด artifacts
5. ได้ไฟล์ติดตั้ง Windows ที่ใช้งานได้!

---

## ติดต่อ

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา
