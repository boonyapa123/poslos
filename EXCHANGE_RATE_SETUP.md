# การตั้งค่าอัตราแลกเปลี่ยนเงิน (Exchange Rate Setup)

## ภาพรวม

ระบบ POS รองรับการแสดงราคาในหลายสกุลเงินตามภาษาที่เลือก:
- **ภาษาไทย** → แสดงเป็นบาทไทย (THB) ฿
- **ภาษาอังกฤษ** → แสดงเป็นดอลลาร์สหรัฐ (USD) $
- **ภาษาลาว** → แสดงเป็นกีบลาว (LAK) ₭

## อัตราแลกเปลี่ยนเริ่มต้น

```javascript
{
  "th": 1,      // บาทไทย (สกุลเงินหลัก)
  "en": 0.029,  // 1 บาท = 0.029 ดอลลาร์สหรัฐ (อัตราโดยประมาณ)
  "lo": 8.086   // 1 บาท = 8.086 กีบ (อัตราโดยประมาณ)
}
```

## วิธีการทำงาน

1. **ราคาในระบบ** - เก็บเป็นบาทไทย (THB)
2. **เมื่อแสดงผล** - แปลงเป็นสกุลเงินตามภาษาที่เลือก
3. **การคำนวณ** - ใช้อัตราแลกเปลี่ยนที่ตั้งค่าไว้

### ตัวอย่าง:
- ราคาในระบบ: ฿877,200.00 (THB)
- แสดงภาษาไทย: ฿877,200.00
- แสดงภาษาอังกฤษ: $25,438.80 (877,200 × 0.029)
- แสดงภาษาลาว: ₭7,095,919.20 (877,200 × 8.086)

## การตั้งค่าอัตราแลกเปลี่ยน

### วิธีที่ 1: ผ่าน Browser Console (สำหรับทดสอบ)

เปิด DevTools (F12) และรันคำสั่ง:

```javascript
// ดูอัตราปัจจุบัน
const { getAllRates } = require('./src/renderer/utils/exchangeRates');
console.log(getAllRates());

// ตั้งค่าอัตราใหม่สำหรับภาษาลาว
const { setExchangeRate } = require('./src/renderer/utils/exchangeRates');
setExchangeRate('lo', 8.5); // 1 THB = 8.5 LAK

// รีเซ็ตเป็นค่าเริ่มต้น
const { resetExchangeRates } = require('./src/renderer/utils/exchangeRates');
resetExchangeRates();
```

### วิธีที่ 2: แก้ไขค่าเริ่มต้นในโค้ด

แก้ไขไฟล์ `src/renderer/utils/exchangeRates.ts`:

```typescript
const DEFAULT_RATES: { [key: string]: number } = {
  th: 1,
  en: 0.029,  // เปลี่ยนอัตราดอลลาร์ที่นี่
  lo: 8.5,    // เปลี่ยนอัตรากีบที่นี่
};
```

จากนั้น build ใหม่:
```bash
npm run build
```

### วิธีที่ 3: ผ่าน localStorage (Manual)

1. เปิด DevTools (F12)
2. ไปที่ tab Application → Local Storage
3. เพิ่ม/แก้ไข key: `exchange_rates`
4. Value (JSON):
```json
{
  "th": 1,
  "en": 0.029,
  "lo": 8.5
}
```

## การอัปเดตอัตราแลกเปลี่ยนอัตโนมัติ

หากต้องการดึงอัตราแลกเปลี่ยนจาก API อัตโนมัติ สามารถเพิ่มฟังก์ชันใน `exchangeRates.ts`:

```typescript
export async function updateRatesFromAPI(): Promise<void> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/THB');
    const data = await response.json();
    
    setExchangeRate('en', data.rates.USD);
    setExchangeRate('lo', data.rates.LAK);
    console.log('Exchange rates updated:', {
      USD: data.rates.USD,
      LAK: data.rates.LAK
    });
  } catch (error) {
    console.error('Failed to update exchange rates:', error);
  }
}
```

## หมายเหตุสำคัญ

⚠️ **การแปลงสกุลเงินเป็นเพียงการแสดงผลเท่านั้น**
- ราคาในฐานข้อมูลยังคงเป็นบาทไทย
- การคำนวณภายในใช้บาทไทย
- เมื่อบันทึก transaction จะบันทึกเป็นบาทไทย

⚠️ **อัตราแลกเปลี่ยนควรอัปเดตเป็นประจำ**
- อัตราแลกเปลี่ยนเปลี่ยนแปลงทุกวัน
- ควรตรวจสอบและอัปเดตอัตราเป็นประจำ
- พิจารณาใช้ API สำหรับอัปเดตอัตโนมัติ

## แหล่งข้อมูลอัตราแลกเปลี่ยน

- [Bank of Thailand](https://www.bot.or.th/thai/statistics/_layouts/application/exchangerate/exchangerate.aspx)
- [XE Currency Converter](https://www.xe.com/currencyconverter/convert/?Amount=1&From=THB&To=LAK)
- [Exchange Rate API](https://www.exchangerate-api.com/)

## ตัวอย่างการใช้งาน

```typescript
import { formatCurrency, convertCurrency } from './utils/formatCurrency';

// แสดงราคาพร้อมแปลงสกุลเงิน
const price = 877200; // THB
const language = 'lo'; // Lao

// แปลงเป็นกีบ
const converted = convertCurrency(price, language);
console.log(converted); // 7095919.2

// แสดงผลพร้อมสัญลักษณ์
const formatted = formatCurrency(price, language, true);
console.log(formatted); // ₭7,095,919.20
```
