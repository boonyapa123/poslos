// POS Types
export interface Bill {
  id?: string;
  items: BillItem[];
  customerId?: string;
  customerName?: string;
  customerPriceLevel: number;
  subtotal: number;
  vatAmount: number;
  vatType: 'INCLUSIVE' | 'EXCLUSIVE';
  vatRate: number;
  discount: number;
  grandTotal: number;
  status: 'ACTIVE' | 'PARKED' | 'COMPLETED';
  parkedAt?: Date;
}

export interface BillItem {
  lineNumber: number;
  productId: string;
  productSku: string;
  productName: string;
  productNameEn?: string;
  productNameLo?: string;
  unitId: string;
  unitName: string;
  unitNameEn?: string;
  unitNameLo?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
}

export interface ProductWithUnitsAndPrices {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  units: ProductUnitInfo[];
  prices: ProductPriceInfo[];
}

export interface ProductUnitInfo {
  id: string;
  unitCode: string;
  unitName: string;
  conversionRate: number;
  barcode?: string;
  isBaseUnit: boolean;
}

export interface ProductPriceInfo {
  id: string;
  unitId: string;
  priceLevel: number;
  price: number;
}

export interface CustomerInfo {
  id: string;
  code: string;
  name: string;
  phone?: string;
  priceLevel: number;
}

export interface ParkedBillInfo {
  id: string;
  billNumber: string;
  customerName?: string;
  itemCount: number;
  total: number;
  parkedAt: Date;
}
