# Requirements Document - ระบบ POS

## Introduction

ระบบ Point of Sale (POS) สำหรับร้านค้าวัสดุก่อสร้างและอุปกรณ์ทั่วไป ที่ทำงานแบบ Stand-alone บนเครื่อง POS แต่ละเครื่อง โดยมีการซิงค์ข้อมูลกับ Server กลาง ระบบต้องรองรับการขายหลายกะต่อวัน การพักบิล การแสดงผลสองหน้าจอ และการใช้งานผ่าน keyboard shortcuts

## Glossary

- **POS Terminal**: เครื่องคอมพิวเตอร์ที่ใช้สำหรับขายสินค้า ติดตั้งระบบ POS และฐานข้อมูล SQL ในเครื่อง
- **Central Server**: เซิร์ฟเวอร์กลางที่เก็บข้อมูลหลักของระบบ (สินค้า, ลูกค้า, พนักงาน)
- **Customer Display**: หน้าจอแสดงผลสำหรับลูกค้า แสดงรายการสินค้าและราคา
- **Cashier Display**: หน้าจอหลักสำหรับพนักงานขาย
- **Parked Bill**: บิลที่พักไว้ชั่วคราวเพื่อให้บริการลูกค้าคนอื่นก่อน
- **Price Level**: ระดับราคาขายที่แตกต่างกันสำหรับลูกค้าแต่ละประเภท
- **SKU**: รหัสสินค้า (Stock Keeping Unit)
- **Unit Code**: รหัสหน่วยย่อยของสินค้า (เช่น ชิ้น, กล่อง, แพ็ค)
- **Shift**: กะการทำงาน ในหนึ่งวันสามารถมีหลายกะ
- **VAT**: ภาษีมูลค่าเพิ่ม สามารถคำนวณแบบรวมในราคา (VAT-In) หรือแยกนอกราคา (VAT-Out)

## Requirements

### Requirement 1: ระบบฐานข้อมูลในเครื่อง

**User Story:** ในฐานะพนักงานขาย ฉันต้องการให้ระบบทำงานได้แม้ไม่มีการเชื่อมต่อกับ Server กลาง เพื่อให้สามารถขายสินค้าได้ตลอดเวลา

#### Acceptance Criteria

1. THE POS Terminal SHALL maintain a local SQL database containing product data, customer data, employee data, and sales transactions
2. WHEN the POS Terminal starts, THE POS Terminal SHALL load all necessary data from the local SQL database within 5 seconds
3. WHILE processing a sale, THE POS Terminal SHALL retrieve product information from the local SQL database without requiring connection to the Central Server
4. THE POS Terminal SHALL store completed sales transactions in the local SQL database immediately after payment completion

### Requirement 2: การซิงค์ข้อมูลจาก Server กลาง

**User Story:** ในฐานะเจ้าของร้าน ฉันต้องการให้เครื่อง POS ดึงข้อมูลสินค้าและข้อมูลอ้างอิงล่าสุดจาก Server กลาง เพื่อให้มั่นใจว่าข้อมูลเป็นปัจจุบัน

#### Acceptance Criteria

1. WHEN the user clicks the data sync button, THE POS Terminal SHALL retrieve product master data from the Central Server
2. WHEN syncing product data, THE POS Terminal SHALL download product SKU, product name, unit codes, and multiple price levels for each product
3. WHEN syncing customer data, THE POS Terminal SHALL download customer information with associated price level assignments
4. WHEN syncing employee data, THE POS Terminal SHALL download sales employee data and service employee data
5. WHEN syncing bank account data, THE POS Terminal SHALL download bank account numbers and generate QR code data for display on the Customer Display
6. IF the Central Server is unreachable during sync, THEN THE POS Terminal SHALL display an error message and continue using existing local data

### Requirement 3: การส่งข้อมูลขายกลับ Server กลาง

**User Story:** ในฐานะผู้จัดการ ฉันต้องการให้ข้อมูลการขายจากทุกเครื่อง POS ถูกส่งกลับมายัง Server กลาง เพื่อติดตามยอดขายแบบ real-time

#### Acceptance Criteria

1. WHEN the user clicks the send sales data button, THE POS Terminal SHALL transmit all unsent sales transactions to the Central Server
2. WHEN transmitting sales data, THE POS Terminal SHALL send transaction data to the designated table on the Central Server
3. WHEN a sales transaction is successfully transmitted, THE POS Terminal SHALL mark the transaction as synchronized in the local database
4. THE POS Terminal SHALL support multiple data transmissions per day across different shifts
5. IF transmission fails, THEN THE POS Terminal SHALL retain the unsent transactions and allow retry

### Requirement 4: การขายสินค้า

**User Story:** ในฐานะพนักงานขาย ฉันต้องการสแกนหรือค้นหาสินค้าและเพิ่มลงในบิลขาย เพื่อประมวลผลการซื้อของลูกค้า

#### Acceptance Criteria

1. WHEN the user enters a product SKU or unit code, THE POS Terminal SHALL retrieve the product information from the local database within 1 second
2. WHEN adding a product to the bill, THE POS Terminal SHALL display product name, unit, price, and quantity on both Cashier Display and Customer Display
3. WHEN a customer is assigned to the bill, THE POS Terminal SHALL apply the appropriate price level for that customer
4. WHEN the user presses F6, THE POS Terminal SHALL open the product search dialog
5. WHEN the user enters a number followed by asterisk (*), THE POS Terminal SHALL set the quantity for the next product entry
6. THE POS Terminal SHALL calculate line totals, subtotals, VAT, and grand total automatically as items are added

### Requirement 5: การพักบิลและเรียกบิลคืน

**User Story:** ในฐานะพนักงานขาย ฉันต้องการพักบิลปัจจุบันเพื่อให้บริการลูกค้าคนอื่นก่อน และสามารถกลับมาทำบิลเดิมต่อได้

#### Acceptance Criteria

1. WHEN the user presses End and equals (=), THE POS Terminal SHALL save the current bill as a parked bill with a unique bill number
2. WHEN a bill is parked, THE POS Terminal SHALL clear the current transaction screen and allow starting a new sale
3. WHEN the user presses F9, THE POS Terminal SHALL display a list of all parked bills with bill numbers
4. WHEN the user selects a parked bill, THE POS Terminal SHALL restore that bill to the current transaction screen with all items intact
5. THE POS Terminal SHALL maintain parked bills until they are completed or explicitly cancelled

### Requirement 6: การแสดงผลสองหน้าจอ

**User Story:** ในฐานะลูกค้า ฉันต้องการเห็นรายการสินค้าและราคาที่กำลังซื้อบนหน้าจอของฉัน เพื่อตรวจสอบความถูกต้อง

#### Acceptance Criteria

1. THE POS Terminal SHALL support dual display output with separate content for Cashier Display and Customer Display
2. WHEN a product is added to the bill, THE Customer Display SHALL show product name, quantity, unit price, and line total within 0.5 seconds
3. WHEN payment is being processed, THE Customer Display SHALL display bank account QR codes for payment
4. THE Customer Display SHALL show the current total amount prominently at all times during the transaction
5. WHEN a transaction is completed, THE Customer Display SHALL display a thank you message

### Requirement 7: การชำระเงินและปิดบิล

**User Story:** ในฐานะพนักงานขาย ฉันต้องการรับชำระเงินและปิดบิลขาย เพื่อบันทึกการขายและออกใบเสร็จให้ลูกค้า

#### Acceptance Criteria

1. WHEN the user presses End, THE POS Terminal SHALL open the payment screen showing the total amount due
2. WHEN payment is completed, THE POS Terminal SHALL save the transaction to the local SQL database
3. WHEN the user presses Page Down, THE POS Terminal SHALL print the sales receipt
4. WHEN the user presses Insert, THE POS Terminal SHALL reprint the last receipt
5. THE POS Terminal SHALL assign a unique sequential transaction number to each completed sale

### Requirement 8: การจัดการ VAT

**User Story:** ในฐานะผู้จัดการ ฉันต้องการกำหนดวิธีคำนวณ VAT ได้ทั้งแบบรวมในราคาและแยกนอกราคา เพื่อให้สอดคล้องกับนโยบายการขาย

#### Acceptance Criteria

1. THE POS Terminal SHALL support VAT-Inclusive pricing where VAT is included in the displayed price
2. THE POS Terminal SHALL support VAT-Exclusive pricing where VAT is added on top of the displayed price
3. WHEN VAT mode is set, THE POS Terminal SHALL calculate VAT amount and display it separately on the receipt
4. THE POS Terminal SHALL allow configuration of VAT rate percentage
5. WHEN printing receipts, THE POS Terminal SHALL show subtotal, VAT amount, and grand total clearly

### Requirement 9: Keyboard Shortcuts

**User Story:** ในฐานะพนักงานขายที่มีประสบการณ์ ฉันต้องการใช้ keyboard shortcuts เพื่อทำงานได้รวดเร็วโดยไม่ต้องใช้เมาส์

#### Acceptance Criteria

1. WHEN the user presses Delete, THE POS Terminal SHALL open the customer selection dialog
2. WHEN the user presses F6, THE POS Terminal SHALL open the product search dialog
3. WHEN the user presses F9, THE POS Terminal SHALL display the list of parked bills
4. WHEN the user presses End followed by equals (=), THE POS Terminal SHALL park the current bill
5. WHEN the user presses M, THE POS Terminal SHALL delete the currently selected line item
6. WHEN the user presses End followed by M, THE POS Terminal SHALL cancel the entire current bill after confirmation
7. WHEN the user presses End, THE POS Terminal SHALL proceed to payment screen
8. WHEN the user presses Page Down, THE POS Terminal SHALL print the receipt
9. WHEN the user presses F10, THE POS Terminal SHALL open the calculator utility
10. WHEN the user presses Insert, THE POS Terminal SHALL reprint the last receipt
11. WHEN the user presses Home twice, THE POS Terminal SHALL close the application after confirmation

### Requirement 10: การค้นหาสินค้า

**User Story:** ในฐานะพนักงานขาย ฉันต้องการค้นหาสินค้าได้หลายวิธี เพื่อหาสินค้าที่ลูกค้าต้องการได้รวดเร็ว

#### Acceptance Criteria

1. WHEN the user opens the search dialog, THE POS Terminal SHALL allow searching by product SKU, product name, or unit code
2. WHEN the user types in the search box, THE POS Terminal SHALL display matching results in real-time
3. WHEN search results are displayed, THE POS Terminal SHALL show product code, name, available units, and prices
4. WHEN the user selects a product from search results, THE POS Terminal SHALL add that product to the current bill
5. THE POS Terminal SHALL support partial text matching for product names

### Requirement 11: การติดตั้งหลายเครื่อง

**User Story:** ในฐานะเจ้าของร้าน ฉันต้องการติดตั้งระบบ POS ได้หลายเครื่องโดยไม่มีข้อจำกัด เพื่อขยายจุดขายตามความต้องการ

#### Acceptance Criteria

1. THE POS Terminal SHALL support installation on unlimited number of computers
2. WHEN installing on a new terminal, THE POS Terminal SHALL create a new local SQL database instance
3. WHEN installing on a new terminal, THE POS Terminal SHALL allow configuration of Central Server connection settings
4. THE POS Terminal SHALL assign a unique terminal ID to each installation
5. WHEN syncing data, THE POS Terminal SHALL identify itself to the Central Server using the terminal ID

### Requirement 12: Open Source และการปรับแปลง

**User Story:** ในฐานะผู้พัฒนาระบบ ฉันต้องการเข้าถึง source code เพื่อปรับแต่งและขยายความสามารถของระบบตามความต้องการ

#### Acceptance Criteria

1. THE POS Terminal source code SHALL be accessible and modifiable
2. THE POS Terminal SHALL be built using standard development frameworks and libraries
3. THE POS Terminal SHALL include documentation for key components and APIs
4. THE POS Terminal SHALL use a modular architecture to facilitate customization

### Requirement 13: การจัดการกะการทำงาน

**User Story:** ในฐานะผู้จัดการ ฉันต้องการแยกข้อมูลการขายตามกะการทำงาน เพื่อติดตามประสิทธิภาพและทำการตรวจสอบยอดขาย

#### Acceptance Criteria

1. THE POS Terminal SHALL support multiple shifts per day
2. WHEN starting a new shift, THE POS Terminal SHALL allow the user to specify shift information
3. WHEN recording sales, THE POS Terminal SHALL associate each transaction with the current shift
4. WHEN transmitting sales data, THE POS Terminal SHALL include shift information with each transaction
5. THE POS Terminal SHALL allow data transmission multiple times within the same shift
