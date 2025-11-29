// API Response Types
export interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  units: ApiProductUnit[];
  prices: ApiProductPrice[];
}

export interface ApiProductUnit {
  id: string;
  productId: string;
  unitCode: string;
  unitName: string;
  conversionRate: number;
  barcode?: string;
  isBaseUnit: boolean;
}

export interface ApiProductPrice {
  id: string;
  productId: string;
  unitId: string;
  priceLevel: number;
  price: number;
  effectiveDate: string;
}

export interface ApiCustomer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  priceLevel: number;
  creditLimit?: number;
  isActive: boolean;
}

export interface ApiEmployee {
  id: string;
  code: string;
  name: string;
  type: 'SALES' | 'SERVICE';
  isActive: boolean;
}

export interface ApiBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeData: string;
  isActive: boolean;
  displayOrder: number;
}

export interface ApiTransaction {
  id: string;
  transactionNumber: string;
  terminalId: string;
  shiftId?: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  salesEmployeeId?: string;
  serviceEmployeeId?: string;
  transactionDate: string;
  subtotal: number;
  vatAmount: number;
  vatType: 'INCLUSIVE' | 'EXCLUSIVE';
  vatRate: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  status: 'COMPLETED';
  items: ApiTransactionItem[];
}

export interface ApiTransactionItem {
  productId: string;
  productSku: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  lineNumber: number;
}

// Format ตาม Excel DOCINFO (ชีท 14)
export interface DocInfo {
  DI_DATE: number; // Excel date number
  DI_BRANCH: string; // Terminal/Branch code
  DI_REF: string; // Transaction number
  DI_CRE_BY: string; // Sales employee code
  DI_AMOUNT: number; // Grand total in satang (x100)
  DI_PM_BY: string; // Payment method (CASH/BANK/TRANSFER)
  DI_Ccy: string; // Currency code
  DI_BANK?: number; // Bank ID (if payment by bank)
  DI_DATE_TIME?: string; // DateTime string
}

// Format ตาม Excel SKUMOVE (ชีท 15)
export interface SkuMove {
  SKM_DATE: number; // Excel date number
  SKM_BCH: string; // Branch code
  DI_REF: string; // Transaction number (link to DOCINFO)
  SKM_No: number; // Line number
  SKU_CODE: string; // Product SKU
  GOODS_CODE: string; // Unit barcode
  UTQ_NAME: string; // Unit name
  UTQ_QTY: number; // Conversion rate
  QTY: number; // Quantity
  SKM_PRC: number; // Unit price in satang (x100)
  SKM_AMOUNT: number; // Line total in satang (x100)
  SKM_Ccy: string; // Currency code
  WL_KEY?: number; // Warehouse ID
  AR_CODE?: string; // Customer code
  ARPRB_KEY?: number; // Price level
  CRE_BY?: string; // Sales employee code
  SV_BY?: string; // Service employee code
  SKM_DATE_TIME?: string; // DateTime string
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
