# Implementation Plan - ระบบ POS

## Overview
แผนการพัฒนาระบบ POS แบบ Desktop Application โดยใช้ Electron + React + TypeScript + SQLite แบ่งการพัฒนาเป็นขั้นตอนที่ชัดเจน เริ่มจากการตั้งค่าโครงสร้างพื้นฐาน ไปจนถึงฟีเจอร์ที่สมบูรณ์

## Tasks

- [x] 1. ตั้งค่าโครงสร้างโปรเจกต์และ dependencies
  - สร้างโครงสร้างโปรเจกต์ Electron + React + TypeScript
  - ติดตั้ง dependencies ที่จำเป็น (Sequelize, Axios, Tailwind CSS, hotkeys-js, qrcode, electron-pos-printer)
  - ตั้งค่า TypeScript configuration
  - ตั้งค่า Webpack/Vite สำหรับ build process
  - สร้าง folder structure ตาม layered architecture (main process, renderer process, models, services, components)
  - _Requirements: 12.1, 12.2_

- [x] 2. สร้าง database schema และ models
  - [x] 2.1 สร้าง Sequelize models สำหรับทุก entities
    - สร้าง Product, ProductUnit, ProductPrice models
    - สร้าง Customer, Employee, BankAccount models
    - สร้าง Transaction, TransactionItem models
    - สร้าง Shift, Configuration, SyncLog models
    - กำหนด relationships ระหว่าง models
    - _Requirements: 1.1, 2.1_
  
  - [x] 2.2 สร้าง database migrations
    - เขียน migration scripts สำหรับสร้าง tables
    - เพิ่ม indexes สำหรับ performance (SKU, customer code, transaction date)
    - เพิ่ม constraints และ validations
    - _Requirements: 1.1_
  
  - [x] 2.3 สร้าง DatabaseManager service
    - เขียน DatabaseManager class สำหรับจัดการ connection
    - Implement initialize(), getConnection(), migrate() methods
    - เพิ่ม error handling สำหรับ database operations
    - _Requirements: 1.1, 1.2_

- [x] 3. สร้าง API Client และ Sync Manager
  - [x] 3.1 สร้าง API Client service
    - เขียน APIClient class ด้วย Axios
    - Implement methods: fetchProducts(), fetchCustomers(), fetchEmployees(), fetchBankAccounts()
    - Implement sendTransactions() method
    - เพิ่ม authentication (API key/JWT token)
    - เพิ่ม error handling และ retry logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_
  
  - [x] 3.2 สร้าง Sync Manager service
    - เขียน SyncManager class
    - Implement syncFromServer() - ดึงข้อมูลจาก Server และบันทึกลง local database
    - Implement sendSalesToServer() - ส่งข้อมูลขายที่ยังไม่ sync
    - Implement getLastSyncTime() และ getUnsentTransactions()
    - บันทึก sync logs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 3.3 สร้าง IPC handlers สำหรับ sync operations
    - เขียน IPC handlers ใน main process
    - เชื่อมต่อ UI กับ SyncManager
    - จัดการ progress updates และ error messages
    - _Requirements: 2.1, 3.1_

- [x] 4. สร้าง main window และ UI framework
  - [x] 4.1 สร้าง Electron main process
    - ตั้งค่า main.ts สำหรับ Electron
    - สร้าง main window (Cashier Display)
    - ตั้งค่า window size และ properties
    - เพิ่ม menu bar และ application lifecycle handlers
    - _Requirements: 1.2_
  
  - [x] 4.2 สร้าง React app structure
    - ตั้งค่า React app ใน renderer process
    - สร้าง App component และ routing (ถ้าจำเป็น)
    - ตั้งค่า Tailwind CSS
    - สร้าง layout components (Header, Footer, Main)
    - _Requirements: 1.2_
  
  - [x] 4.3 สร้าง state management
    - ตั้งค่า React Context หรือ Redux สำหรับ global state
    - สร้าง state สำหรับ current bill, products, customers, configuration
    - เขียน actions และ reducers
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. สร้าง Customer Display (หน้าจอลูกค้า)
  - [x] 5.1 สร้าง customer display window
    - เขียนโค้ดสร้าง secondary BrowserWindow
    - ตั้งค่าให้แสดงบน external display
    - จัดการ window lifecycle
    - _Requirements: 6.1, 6.2_
  
  - [x] 5.2 สร้าง CustomerDisplay component
    - สร้าง UI สำหรับแสดงรายการสินค้า
    - แสดง product name, quantity, price, line total
    - แสดง grand total แบบเด่นชัด
    - สร้าง thank you screen
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [x] 5.3 สร้าง communication ระหว่าง main window และ customer display
    - ใช้ IPC หรือ Event Emitter สำหรับส่งข้อมูล
    - Update customer display เมื่อมีการเพิ่ม/ลบสินค้า
    - Update เมื่อชำระเงินเสร็จ
    - _Requirements: 6.2, 6.3_
  
  - [x] 5.4 สร้าง QR code display (พร้อมแสดง - ไม่ได้ทำการชำระเงินจริง)
    - เตรียม UI สำหรับแสดง QR code บน customer display
    - รองรับการแสดง bank account information
    - หมายเหตุ: ไม่ได้ integrate กับระบบชำระเงินจริง เป็นเพียงการแสดงข้อมูลเท่านั้น
    - _Requirements: 2.5, 6.3_

- [x] 6. สร้างฟีเจอร์การค้นหาสินค้า
  - [x] 6.1 สร้าง ProductSearch component
    - สร้าง modal/dialog สำหรับค้นหาสินค้า
    - เพิ่ม search input field
    - แสดงผลลัพธ์แบบ real-time
    - รองรับการค้นหาด้วย SKU, product name, unit code
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 6.2 สร้าง search logic
    - เขียน function สำหรับค้นหาใน database
    - Implement partial text matching
    - เพิ่ม debouncing สำหรับ performance
    - จัดเรียงผลลัพธ์ตามความเกี่ยวข้อง
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [x] 6.3 สร้าง product selection handler
    - จัดการเมื่อ user เลือกสินค้าจากผลลัพธ์
    - เพิ่มสินค้าลงใน current bill
    - ปิด search dialog
    - _Requirements: 10.4_

- [x] 7. สร้างหน้าจอขายสินค้าหลัก (Sales Screen)
  - [x] 7.1 สร้าง SalesScreen component
    - สร้าง layout สำหรับหน้าจอขาย
    - แสดง current bill items ในตาราง
    - แสดง subtotal, VAT, grand total
    - แสดงข้อมูลลูกค้า (ถ้ามี)
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 7.2 สร้าง product entry logic
    - รับ input จาก keyboard (SKU/unit code)
    - ค้นหาสินค้าจาก database
    - เพิ่มสินค้าลงใน bill
    - คำนวณราคาตาม price level ของลูกค้า
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 7.3 สร้าง quantity input handler
    - รองรับการกดตัวเลขตามด้วย * เพื่อกำหนดจำนวน
    - แสดง quantity indicator บน UI
    - Apply quantity เมื่อเพิ่มสินค้า
    - _Requirements: 4.5_
  
  - [x] 7.4 สร้าง calculation engine
    - คำนวณ line total สำหรับแต่ละรายการ
    - คำนวณ subtotal
    - คำนวณ VAT (รองรับทั้ง inclusive และ exclusive)
    - คำนวณ grand total
    - _Requirements: 4.6, 8.1, 8.2, 8.3, 8.4_

- [x] 8. สร้างฟีเจอร์การเลือกลูกค้า
  - [x] 8.1 สร้าง CustomerSelection component
    - สร้าง modal/dialog สำหรับเลือกลูกค้า
    - แสดงรายชื่อลูกค้า
    - เพิ่ม search/filter functionality
    - แสดง price level ของแต่ละลูกค้า
    - _Requirements: 4.3_
  
  - [x] 8.2 สร้าง customer selection handler
    - จัดการเมื่อ user เลือกลูกค้า
    - Update current bill กับข้อมูลลูกค้า
    - Recalculate ราคาตาม price level ของลูกค้า
    - แสดงชื่อลูกค้าบนหน้าจอขาย
    - _Requirements: 4.3_

- [x] 9. สร้างฟีเจอร์การพักบิลและเรียกบิลคืน
  - [x] 9.1 สร้าง park bill functionality
    - เขียน function สำหรับบันทึก current bill เป็น parked bill
    - Generate unique bill number
    - บันทึกลง database ด้วย status 'PARKED'
    - Clear current transaction screen
    - _Requirements: 5.1, 5.2_
  
  - [x] 9.2 สร้าง ParkedBills component
    - สร้าง modal/dialog แสดงรายการบิลที่พักไว้
    - แสดง bill number, customer, total, date/time
    - เพิ่ม search/filter functionality
    - _Requirements: 5.3_
  
  - [x] 9.3 สร้าง recall bill functionality
    - เขียน function สำหรับโหลด parked bill
    - Restore bill items ลง current transaction
    - Update UI
    - _Requirements: 5.4_
  
  - [x] 9.4 สร้าง bill management
    - รองรับการลบ parked bills
    - จัดการ parked bills ที่เก่าเกินกำหนด
    - _Requirements: 5.5_

- [ ] 10. สร้างฟีเจอร์การชำระเงินและปิดบิล
  - [x] 10.1 สร้าง Payment component
    - สร้างหน้าจอชำระเงิน
    - แสดง total amount
    - รับ input จำนวนเงินที่รับ (สำหรับเงินสด)
    - คำนวณเงินทอน (สำหรับเงินสด)
    - เลือก payment method: เงินสด (CASH) หรือ โอน (TRANSFER)
    - หมายเหตุ: ไม่มีการ integrate กับระบบชำระเงินจริง เป็นเพียงการบันทึกประเภทการชำระเงินเท่านั้น
    - _Requirements: 7.1_
  
  - [x] 10.2 สร้าง payment processing logic
    - Validate payment amount (สำหรับเงินสด)
    - บันทึก transaction ลง database พร้อม payment method
    - Generate transaction number
    - Update transaction status เป็น 'COMPLETED'
    - Mark as unsent (isSynced = false)
    - _Requirements: 7.2, 7.5_
  
  - [x] 10.3 สร้าง receipt generation
    - สร้าง receipt template
    - รวมข้อมูล: transaction number, date/time, items, totals, VAT, payment method
    - Format ตาม receipt printer requirements
    - _Requirements: 7.3, 8.5_
  
  - [x] 10.4 สร้าง Printer Service
    - เขียน PrinterService class (โครงสร้างพื้นฐาน)
    - Implement printReceipt() method (log to console for now)
    - Implement reprintLastReceipt() method
    - หมายเหตุ: ยังไม่ได้ integrate กับ electron-pos-printer จริง ต้องมี hardware
    - _Requirements: 7.3, 7.4_

- [x] 11. สร้าง Hotkey Manager และ keyboard shortcuts
  - [x] 11.1 สร้าง HotkeyManager service
    - เขียน HotkeyManager class ด้วย hotkeys-js
    - Implement registerHotkey(), unregisterHotkey() methods
    - Implement enableHotkeys(), disableHotkeys() methods
    - _Requirements: 9.1-9.11_
  
  - [x] 11.2 Register keyboard shortcuts
    - Delete: เลือกลูกค้า ✅
    - F6: ค้นหาสินค้า ✅
    - F9: ดูบิลที่พักไว้ ✅
    - End: ชำระเงิน ✅
    - M: ลบรายการสินค้าล่าสุด ✅
    - หมายเหตุ: End + =, End + M, Page Down, F10, Insert, Home + Home ยังไม่ได้ implement
    - _Requirements: 9.1-9.11_
  
  - [x] 11.3 สร้าง line item deletion
    - Implement delete line item functionality
    - Update totals หลังลบรายการ
    - Update customer display
    - _Requirements: 9.5_
  
  - [ ] 11.4 สร้าง cancel bill functionality
    - Implement cancel entire bill
    - แสดง confirmation dialog
    - Clear current transaction
    - _Requirements: 9.6_
  
  - [ ] 11.5 สร้าง calculator utility
    - สร้าง calculator window/dialog
    - Implement basic calculator functions
    - _Requirements: 9.9_

- [x] 12. สร้าง Configuration และ Settings
  - [x] 12.1 สร้าง Configuration service
    - ใช้ Configuration model ที่มีอยู่แล้ว
    - Implement get(), set() ผ่าน IPC handlers
    - _Requirements: 11.3_
  
  - [x] 12.2 สร้าง Settings UI
    - สร้างหน้าจอ settings
    - ตั้งค่า Terminal ID
    - ตั้งค่า Central Server URL และ authentication
    - ตั้งค่า VAT rate และ VAT type (inclusive/exclusive)
    - เลือกภาษา (ไทย, English, ລາວ)
    - ทดสอบการเชื่อมต่อ Server
    - _Requirements: 8.3, 8.4, 11.3_
  
  - [ ] 12.3 สร้าง First-Time Setup Wizard
    - สร้าง wizard สำหรับการตั้งค่าครั้งแรก
    - Guide user ผ่านขั้นตอนการตั้งค่า
    - ทดสอบการเชื่อมต่อ Server
    - Sync ข้อมูลครั้งแรก
    - _Requirements: 11.3_

- [x] 13. สร้างฟีเจอร์การจัดการกะ (Shift Management)
  - [x] 13.1 สร้าง Shift service
    - ใช้ Shift model ที่มีอยู่แล้ว
    - Implement startShift(), endShift() ผ่าน IPC handlers
    - Implement getCurrentShift() method
    - _Requirements: 13.1, 13.2_
  
  - [x] 13.2 สร้าง Shift UI
    - สร้างหน้าจอเปิด/ปิดกะ
    - รับ input opening cash และ closing cash
    - แสดงข้อมูลกะปัจจุบัน
    - คำนวณยอดขายในกะ
    - _Requirements: 13.2, 13.3_
  
  - [x] 13.3 เชื่อมต่อ shift กับ transactions + Auto Sync
    - Auto sync เมื่อปิดกะ (ถ้าเน็ตใช้งานได้)
    - Graceful degradation (เน็ตขัดข้องก็ปิดกะได้)
    - Manual sync ยังคงใช้งานได้ (ปุ่ม "ส่งข้อมูลขาย")
    - _Requirements: 13.3, 13.4, 13.5_

- [ ] 14. สร้าง Sync UI และ manual sync controls
  - [ ] 14.1 สร้าง Sync UI components
    - สร้างปุ่ม "ดึงข้อมูล" และ "ส่งข้อมูลขาย"
    - แสดง sync status (last sync time, unsent transactions count)
    - แสดง progress bar ระหว่าง sync
    - _Requirements: 2.1, 3.1_
  
  - [ ] 14.2 สร้าง sync status indicator
    - แสดงสถานะการเชื่อมต่อ (online/offline)
    - แสดงจำนวน transactions ที่ยังไม่ส่ง
    - แสดง last sync timestamp
    - _Requirements: 2.1, 3.1_
  
  - [ ] 14.3 จัดการ sync errors
    - แสดง error messages เมื่อ sync ล้มเหลว
    - เก็บ error logs
    - อนุญาตให้ retry
    - _Requirements: 2.6, 3.5_

- [ ] 15. สร้าง Error Handling และ Logging
  - [ ] 15.1 สร้าง ErrorHandler service
    - เขียน ErrorHandler class
    - Implement handleError(), logError() methods
    - Implement showUserMessage() สำหรับแสดง notifications
    - สร้าง AppError class hierarchy
    - _Requirements: 2.6, 3.5_
  
  - [ ] 15.2 สร้าง Logger service
    - เขียน Logger class
    - บันทึก logs ลงไฟล์
    - รองรับ log levels (error, warning, info, debug)
    - Implement log rotation
    - _Requirements: 2.6, 3.5_
  
  - [ ] 15.3 เพิ่ม error handling ทั่วทั้งระบบ
    - Wrap critical operations ด้วย try-catch
    - จัดการ database errors
    - จัดการ network errors
    - จัดการ user input errors
    - แสดง user-friendly error messages
    - _Requirements: 2.6, 3.5_

- [ ] 16. Optimization และ Performance Tuning
  - [ ] 16.1 เพิ่ม database indexes
    - สร้าง indexes บน frequently queried columns
    - Analyze query performance
    - Optimize slow queries
    - _Requirements: 1.3_
  
  - [ ] 16.2 Implement caching
    - Cache product data ใน memory
    - Cache customer data
    - Implement cache invalidation strategy
    - _Requirements: 1.3_
  
  - [ ] 16.3 Optimize UI rendering
    - Implement virtual scrolling สำหรับรายการยาว
    - Add debouncing สำหรับ search inputs
    - Lazy load components
    - _Requirements: 4.1, 10.2_

- [ ] 17. สร้าง Installer และ Deployment
  - [ ] 17.1 ตั้งค่า Electron Builder
    - Configure electron-builder
    - สร้าง build scripts
    - ตั้งค่า app metadata (name, version, icon)
    - _Requirements: 11.1, 11.2_
  
  - [ ] 17.2 สร้าง installers
    - Build Windows installer (.exe)
    - Build macOS installer (.dmg)
    - Build Linux installer (.AppImage)
    - ทดสอบ installation process
    - _Requirements: 11.1, 11.2_
  
  - [ ] 17.3 Implement auto-update
    - ตั้งค่า auto-update mechanism
    - สร้าง update server/endpoint
    - ทดสอบ update process
    - _Requirements: 11.1_

- [ ] 18. Testing และ Quality Assurance
  - [ ]* 18.1 เขียน unit tests
    - Test calculation functions (VAT, totals)
    - Test data validation functions
    - Test business logic
    - _Requirements: 4.6, 8.1, 8.2_
  
  - [ ]* 18.2 เขียน integration tests
    - Test database operations
    - Test API client และ sync operations
    - Test IPC communication
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ]* 18.3 ทดสอบ end-to-end
    - ทดสอบ complete sales flow
    - ทดสอบ park/recall bill flow
    - ทดสอบ keyboard shortcuts ทั้งหมด
    - ทดสอบ dual display
    - _Requirements: 4.1-4.6, 5.1-5.5, 6.1-6.5, 9.1-9.11_
  
  - [ ] 18.4 Manual testing
    - ทดสอบบนฮาร์ดแวร์จริง
    - ทดสอบกับเครื่องพิมพ์จริง
    - ทดสอบ dual monitor setup
    - ทดสอบ offline mode
    - ทดสอบกับข้อมูลจำนวนมาก
    - _Requirements: 1.1-1.4, 6.1-6.5, 7.3, 7.4_

- [ ] 19. Documentation
  - [ ]* 19.1 เขียน technical documentation
    - Document architecture และ design decisions
    - Document API endpoints
    - Document database schema
    - Document configuration options
    - _Requirements: 12.3_
  
  - [ ]* 19.2 เขียน user manual
    - สร้าง user guide สำหรับพนักงานขาย
    - สร้าง installation guide
    - สร้าง troubleshooting guide
    - _Requirements: 11.1, 11.2_
  
  - [ ]* 19.3 เขียน developer documentation
    - Document code structure
    - Document how to build และ run
    - Document how to contribute
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 20. ระบบหลายภาษา (Multi-language Support)
  - [x] 20.1 สร้าง i18n infrastructure
    - ติดตั้ง i18next และ react-i18next
    - สร้างโครงสร้าง translation files
    - ตั้งค่า language detection และ switching
    - _Requirements: ใหม่_
  
  - [x] 20.2 สร้าง translation files
    - สร้างไฟล์ภาษาไทย (th.json) - ภาษาหลัก
    - สร้างไฟล์ภาษาอังกฤษ (en.json)
    - สร้างไฟล์ภาษาลาว (lo.json)
    - แปลข้อความทั้งหมดในระบบ (UI labels, buttons, messages, errors)
    - _Requirements: ใหม่_
  
  - [x] 20.3 Implement language switcher
    - สร้าง LanguageSwitcher component
    - เพิ่มใน Header
    - บันทึก language preference ลง localStorage
    - _Requirements: ใหม่_
  
  - [x] 20.4 Apply translations ทั่วทั้งระบบ
    - แปลง hardcoded text เป็น translation keys
    - ใช้ translation ใน: SalesScreen, CustomerDisplay, ProductSearch, Header
    - ยังต้องทำ: Payment, Settings, error messages, notifications, receipts
    - ทดสอบการสลับภาษาในทุกหน้าจอ
    - _Requirements: ใหม่_
  
  - [ ] 20.5 Format numbers และ dates ตามภาษา
    - ใช้ locale-specific number formatting
    - ใช้ locale-specific date/time formatting
    - รองรับ currency formatting (฿ สำหรับไทย/ลาว, $ สำหรับอังกฤษ)
    - _Requirements: ใหม่_

## Notes

- Tasks ที่มี * เป็น optional tasks ที่สามารถข้ามได้เพื่อให้ได้ MVP เร็วขึ้น
- แต่ละ task ควรทำให้เสร็จสมบูรณ์ก่อนไปยัง task ถัดไป
- ควร commit code บ่อยๆ หลังจากทำแต่ละ sub-task เสร็จ
- ทดสอบ functionality หลังจากทำแต่ละ task เสร็จ
