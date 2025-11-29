// Printer Service for POS Receipt Printing
// Using electron-pos-printer

interface ReceiptData {
  transactionNumber: string;
  transactionDate: Date;
  customerName?: string;
  items: Array<{
    productName: string;
    unitName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  grandTotal: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
}

class PrinterService {
  private static instance: PrinterService;
  private lastReceipt: ReceiptData | null = null;

  private constructor() {}

  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  public async printReceipt(data: ReceiptData): Promise<boolean> {
    try {
      this.lastReceipt = data;
      
      // TODO: Implement actual printing with electron-pos-printer
      console.log('Printing receipt:', data);
      
      // For now, just log the receipt
      this.logReceipt(data);
      
      return true;
    } catch (error) {
      console.error('Error printing receipt:', error);
      return false;
    }
  }

  public async reprintLastReceipt(): Promise<boolean> {
    if (!this.lastReceipt) {
      console.error('No receipt to reprint');
      return false;
    }
    
    return this.printReceipt(this.lastReceipt);
  }

  private logReceipt(data: ReceiptData): void {
    console.log('========================================');
    console.log('           RECEIPT');
    console.log('========================================');
    console.log(`Transaction: ${data.transactionNumber}`);
    console.log(`Date: ${data.transactionDate.toLocaleString()}`);
    if (data.customerName) {
      console.log(`Customer: ${data.customerName}`);
    }
    console.log('----------------------------------------');
    
    data.items.forEach((item) => {
      console.log(`${item.productName} (${item.unitName})`);
      console.log(`  ${item.quantity} x ${Math.round(item.unitPrice)} = ${Math.round(item.lineTotal)}`);
    });
    
    console.log('----------------------------------------');
    console.log(`Subtotal: ${Math.round(data.subtotal)}`);
    console.log(`VAT ${data.vatRate}%: ${Math.round(data.vatAmount)}`);
    console.log(`TOTAL: ${Math.round(data.grandTotal)}`);
    console.log('----------------------------------------');
    console.log(`Payment: ${data.paymentMethod}`);
    
    if (data.amountReceived) {
      console.log(`Received: ${Math.round(data.amountReceived)}`);
      console.log(`Change: ${Math.round(data.change || 0)}`);
    }
    
    console.log('========================================');
    console.log('       Thank You!');
    console.log('========================================');
  }

  public getLastReceipt(): ReceiptData | null {
    return this.lastReceipt;
  }
}

export default PrinterService;
