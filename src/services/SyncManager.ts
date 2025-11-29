import APIClient from './APIClient';
import { SyncResult, SendResult } from '../types/sync';
import {
  Product,
  ProductUnit,
  ProductPrice,
  Customer,
  Employee,
  BankAccount,
  Transaction,
  TransactionItem,
  SyncLog,
} from '../models';
import { ApiTransaction, ApiTransactionItem } from '../types/api';

class SyncManager {
  private static instance: SyncManager;
  private apiClient: APIClient;

  private constructor() {
    this.apiClient = APIClient.getInstance();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  public async syncFromServer(): Promise<SyncResult> {
    const startTime = new Date();
    const result: SyncResult = {
      success: true,
      productsUpdated: 0,
      customersUpdated: 0,
      employeesUpdated: 0,
      banksUpdated: 0,
      errors: [],
    };

    try {
      // Test connection first
      const isConnected = await this.apiClient.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server');
      }

      // Sync products
      try {
        const products = await this.apiClient.fetchProducts();
        result.productsUpdated = await this.syncProducts(products);
      } catch (error) {
        result.errors.push(`Products sync failed: ${error}`);
      }

      // Sync customers
      try {
        const customers = await this.apiClient.fetchCustomers();
        result.customersUpdated = await this.syncCustomers(customers);
      } catch (error) {
        result.errors.push(`Customers sync failed: ${error}`);
      }

      // Sync employees
      try {
        const employees = await this.apiClient.fetchEmployees();
        result.employeesUpdated = await this.syncEmployees(employees);
      } catch (error) {
        result.errors.push(`Employees sync failed: ${error}`);
      }

      // Sync bank accounts
      try {
        const bankAccounts = await this.apiClient.fetchBankAccounts();
        result.banksUpdated = await this.syncBankAccounts(bankAccounts);
      } catch (error) {
        result.errors.push(`Bank accounts sync failed: ${error}`);
      }

      result.success = result.errors.length === 0;

      // Log sync
      await this.logSync('PULL', result.success ? 'SUCCESS' : 'FAILED', startTime, result.errors.join('; '));

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
      await this.logSync('PULL', 'FAILED', startTime, String(error));
      return result;
    }
  }

  private async syncProducts(apiProducts: any[]): Promise<number> {
    let count = 0;
    const syncedAt = new Date();

    for (const apiProduct of apiProducts) {
      try {
        // Upsert product
        const [product] = await Product.upsert({
          id: apiProduct.id,
          sku: apiProduct.sku,
          name: apiProduct.name,
          description: apiProduct.description,
          category: apiProduct.category,
          isActive: apiProduct.isActive,
          syncedAt,
        });

        // Sync units
        if (apiProduct.units && Array.isArray(apiProduct.units)) {
          for (const apiUnit of apiProduct.units) {
            await ProductUnit.upsert({
              id: apiUnit.id,
              productId: apiProduct.id,
              unitCode: apiUnit.unitCode,
              unitName: apiUnit.unitName,
              conversionRate: apiUnit.conversionRate,
              barcode: apiUnit.barcode,
              isBaseUnit: apiUnit.isBaseUnit,
            });
          }
        }

        // Sync prices
        if (apiProduct.prices && Array.isArray(apiProduct.prices)) {
          for (const apiPrice of apiProduct.prices) {
            await ProductPrice.upsert({
              id: apiPrice.id,
              productId: apiProduct.id,
              unitId: apiPrice.unitId,
              priceLevel: apiPrice.priceLevel,
              price: apiPrice.price,
              effectiveDate: new Date(apiPrice.effectiveDate),
            });
          }
        }

        count++;
      } catch (error) {
        console.error(`Error syncing product ${apiProduct.sku}:`, error);
      }
    }

    return count;
  }

  private async syncCustomers(apiCustomers: any[]): Promise<number> {
    let count = 0;
    const syncedAt = new Date();

    for (const apiCustomer of apiCustomers) {
      try {
        await Customer.upsert({
          id: apiCustomer.id,
          code: apiCustomer.code,
          name: apiCustomer.name,
          phone: apiCustomer.phone,
          email: apiCustomer.email,
          address: apiCustomer.address,
          priceLevel: apiCustomer.priceLevel,
          creditLimit: apiCustomer.creditLimit,
          isActive: apiCustomer.isActive,
          syncedAt,
        });
        count++;
      } catch (error) {
        console.error(`Error syncing customer ${apiCustomer.code}:`, error);
      }
    }

    return count;
  }

  private async syncEmployees(apiEmployees: any[]): Promise<number> {
    let count = 0;
    const syncedAt = new Date();

    for (const apiEmployee of apiEmployees) {
      try {
        await Employee.upsert({
          id: apiEmployee.id,
          code: apiEmployee.code,
          name: apiEmployee.name,
          type: apiEmployee.type,
          isActive: apiEmployee.isActive,
          syncedAt,
        });
        count++;
      } catch (error) {
        console.error(`Error syncing employee ${apiEmployee.code}:`, error);
      }
    }

    return count;
  }

  private async syncBankAccounts(apiBankAccounts: any[]): Promise<number> {
    let count = 0;
    const syncedAt = new Date();

    for (const apiBankAccount of apiBankAccounts) {
      try {
        await BankAccount.upsert({
          id: apiBankAccount.id,
          bankName: apiBankAccount.bankName,
          accountNumber: apiBankAccount.accountNumber,
          accountName: apiBankAccount.accountName,
          qrCodeData: apiBankAccount.qrCodeData,
          isActive: apiBankAccount.isActive,
          displayOrder: apiBankAccount.displayOrder,
          syncedAt,
        });
        count++;
      } catch (error) {
        console.error(`Error syncing bank account ${apiBankAccount.accountNumber}:`, error);
      }
    }

    return count;
  }

  public async sendSalesToServer(): Promise<SendResult> {
    const startTime = new Date();
    const result: SendResult = {
      success: true,
      transactionsSent: 0,
      errors: [],
    };

    try {
      // Get unsent transactions
      const unsentTransactions = await this.getUnsentTransactions();

      if (unsentTransactions.length === 0) {
        return result;
      }

      // Convert to API format
      const apiTransactions: ApiTransaction[] = await Promise.all(
        unsentTransactions.map(async (transaction) => {
          const items = await TransactionItem.findAll({
            where: { transactionId: transaction.id },
            order: [['lineNumber', 'ASC']],
          });

          const apiItems: ApiTransactionItem[] = items.map((item) => ({
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            unitId: item.unitId,
            unitName: item.unitName,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
            discount: Number(item.discount),
            lineNumber: item.lineNumber,
          }));

          // Get customer info if exists
          let customerCode, customerName;
          if (transaction.customerId) {
            const customer = await Customer.findByPk(transaction.customerId);
            if (customer) {
              customerCode = customer.code;
              customerName = customer.name;
            }
          }

          return {
            id: transaction.id,
            transactionNumber: transaction.transactionNumber,
            terminalId: transaction.terminalId,
            shiftId: transaction.shiftId,
            customerId: transaction.customerId,
            customerCode,
            customerName,
            salesEmployeeId: transaction.salesEmployeeId,
            serviceEmployeeId: transaction.serviceEmployeeId,
            transactionDate: transaction.transactionDate.toISOString(),
            subtotal: Number(transaction.subtotal),
            vatAmount: Number(transaction.vatAmount),
            vatType: transaction.vatType,
            vatRate: Number(transaction.vatRate),
            discount: Number(transaction.discount),
            grandTotal: Number(transaction.grandTotal),
            paymentMethod: transaction.paymentMethod,
            status: 'COMPLETED' as const,
            items: apiItems,
          };
        })
      );

      // Convert to Excel format (DOCINFO + SKUMOVE)
      const { docInfos, skuMoves } = await this.convertToExcelFormat(unsentTransactions);

      // Send to server in Excel format
      await this.apiClient.sendTransactionsExcelFormat(docInfos, skuMoves);

      // Mark as synced
      const syncedAt = new Date();
      for (const transaction of unsentTransactions) {
        transaction.isSynced = true;
        transaction.syncedAt = syncedAt;
        await transaction.save();
      }

      result.transactionsSent = unsentTransactions.length;
      result.success = true;

      // Log sync
      await this.logSync('PUSH', 'SUCCESS', startTime);

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Send failed: ${error}`);
      await this.logSync('PUSH', 'FAILED', startTime, String(error));
      return result;
    }
  }

  public async getUnsentTransactions(): Promise<Transaction[]> {
    return await Transaction.findAll({
      where: {
        isSynced: false,
        status: 'COMPLETED',
      },
      order: [['transactionDate', 'ASC']],
    });
  }

  public async getLastSyncTime(): Promise<Date | null> {
    const lastSync = await SyncLog.findOne({
      where: { type: 'PULL', status: 'SUCCESS' },
      order: [['endTime', 'DESC']],
    });
    return lastSync ? lastSync.endTime : null;
  }

  // แปลง transactions เป็นรูปแบบ DOCINFO + SKUMOVE (ตามชีท 14-15)
  private async convertToExcelFormat(transactions: Transaction[]): Promise<{
    docInfos: any[];
    skuMoves: any[];
  }> {
    const docInfos: any[] = [];
    const skuMoves: any[] = [];

    for (const transaction of transactions) {
      // Get related data
      const items = await TransactionItem.findAll({
        where: { transactionId: transaction.id },
        order: [['lineNumber', 'ASC']],
      });

      let customerCode, salesEmployeeCode, serviceEmployeeCode;

      if (transaction.customerId) {
        const customer = await Customer.findByPk(transaction.customerId);
        customerCode = customer?.code;
      }

      if (transaction.salesEmployeeId) {
        const employee = await Employee.findByPk(transaction.salesEmployeeId);
        salesEmployeeCode = employee?.code;
      }

      if (transaction.serviceEmployeeId) {
        const employee = await Employee.findByPk(transaction.serviceEmployeeId);
        serviceEmployeeCode = employee?.code;
      }

      // Convert date to Excel date number (days since 1900-01-01)
      const excelDate = this.dateToExcelNumber(transaction.transactionDate);

      // DOCINFO (ชีท 14) - Transaction Header
      const docInfo = {
        DI_DATE: excelDate,
        DI_BRANCH: transaction.terminalId,
        DI_REF: transaction.transactionNumber,
        DI_CRE_BY: salesEmployeeCode || '',
        DI_AMOUNT: Math.round(Number(transaction.grandTotal) * 100), // Convert to satang
        DI_PM_BY: transaction.paymentMethod === 'CASH' ? 'Cash' : transaction.paymentMethod === 'TRANSFER' ? 'BANK' : transaction.paymentMethod,
        DI_Ccy: 'K', // Currency code (K = THB)
        DI_BANK: transaction.paymentMethod === 'TRANSFER' ? 1 : undefined,
        DI_DATE_TIME: transaction.transactionDate.toISOString(),
      };
      docInfos.push(docInfo);

      // SKUMOVE (ชีท 15) - Transaction Items
      for (const item of items) {
        // Get unit info
        const unit = await ProductUnit.findByPk(item.unitId);

        const skuMove = {
          SKM_DATE: excelDate,
          SKM_BCH: transaction.terminalId,
          DI_REF: transaction.transactionNumber,
          SKM_No: item.lineNumber,
          SKU_CODE: item.productSku,
          GOODS_CODE: unit?.barcode || unit?.unitCode || item.productSku,
          UTQ_NAME: item.unitName,
          UTQ_QTY: unit?.conversionRate || 1,
          QTY: Number(item.quantity),
          SKM_PRC: Math.round(Number(item.unitPrice) * 100), // Convert to satang
          SKM_AMOUNT: Math.round(Number(item.lineTotal) * 100), // Convert to satang
          SKM_Ccy: 'K', // Currency code
          WL_KEY: 1, // Default warehouse
          AR_CODE: customerCode,
          ARPRB_KEY: customerCode ? 1 : undefined, // Price level
          CRE_BY: salesEmployeeCode,
          SV_BY: serviceEmployeeCode,
          SKM_DATE_TIME: transaction.transactionDate.toISOString(),
        };
        skuMoves.push(skuMove);
      }
    }

    return { docInfos, skuMoves };
  }

  // Convert JavaScript Date to Excel date number
  private dateToExcelNumber(date: Date): number {
    const epoch = new Date(1900, 0, 1);
    const days = Math.floor((date.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
    return days + 2; // Excel date offset
  }

  private async logSync(
    type: 'PULL' | 'PUSH',
    status: 'SUCCESS' | 'FAILED',
    startTime: Date,
    errorMessage?: string
  ): Promise<void> {
    try {
      await SyncLog.create({
        type,
        status,
        recordsAffected: 0,
        errorMessage,
        startTime,
        endTime: new Date(),
      });
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }
}

export default SyncManager;
