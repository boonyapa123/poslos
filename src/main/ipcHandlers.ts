import { ipcMain } from 'electron';
import SyncManager from '../services/SyncManager';
import APIClient from '../services/APIClient';
import Configuration from '../models/Configuration';

export function setupIpcHandlers() {
  const syncManager = SyncManager.getInstance();
  const apiClient = APIClient.getInstance();

  // Sync from server
  ipcMain.handle('sync:pull', async () => {
    try {
      const result = await syncManager.syncFromServer();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Send sales to server
  ipcMain.handle('sync:push', async () => {
    try {
      const result = await syncManager.sendSalesToServer();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get unsent transactions count
  ipcMain.handle('sync:getUnsentCount', async () => {
    try {
      const transactions = await syncManager.getUnsentTransactions();
      return { success: true, data: transactions.length };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get last sync time
  ipcMain.handle('sync:getLastSyncTime', async () => {
    try {
      const lastSyncTime = await syncManager.getLastSyncTime();
      return { success: true, data: lastSyncTime };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Test server connection
  ipcMain.handle('api:testConnection', async () => {
    try {
      const isConnected = await apiClient.testConnection();
      return { success: true, data: isConnected };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Configure API client
  ipcMain.handle('api:configure', async (event, { baseURL, apiKey, terminalId }) => {
    try {
      apiClient.configure(baseURL, apiKey, terminalId);
      
      // Save configuration
      await Configuration.upsert({ key: 'api_base_url', value: baseURL });
      await Configuration.upsert({ key: 'api_key', value: apiKey });
      await Configuration.upsert({ key: 'terminal_id', value: terminalId });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get configuration
  ipcMain.handle('config:get', async (event, key: string) => {
    try {
      const config = await Configuration.findByPk(key);
      return { success: true, data: config?.value };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Set configuration
  ipcMain.handle('config:set', async (event, { key, value, description }) => {
    try {
      await Configuration.upsert({ key, value, description });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Product handlers
  ipcMain.handle('product:search', async (event, query: string) => {
    try {
      const { Product, ProductUnit, ProductPrice } = require('../models');
      const { Op } = require('sequelize');

      const products = await Product.findAll({
        where: {
          [Op.or]: [
            { sku: { [Op.like]: `%${query}%` } },
            { name: { [Op.like]: `%${query}%` } },
            { nameEn: { [Op.like]: `%${query}%` } },
            { nameLo: { [Op.like]: `%${query}%` } }
          ],
          isActive: true
        },
        include: [
          {
            model: ProductUnit,
            as: 'units',
            include: [
              {
                model: ProductPrice,
                as: 'prices'
              }
            ]
          }
        ],
        limit: 20
      });

      // Convert to plain objects
      const plainProducts = products.map((p: any) => p.toJSON());

      return { success: true, data: plainProducts };
    } catch (error) {
      console.error('Error in product:search:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('product:findByCode', async (event, code: string) => {
    try {
      const { Product, ProductUnit, ProductPrice } = require('../models');

      let product = null;

      // Try 1: Find by SKU (SKU_CODE)
      product = await Product.findOne({
        where: { sku: code, isActive: true },
        include: [
          {
            model: ProductUnit,
            as: 'units',
            include: [
              {
                model: ProductPrice,
                as: 'prices'
              }
            ]
          }
        ]
      });

      // Try 2: Find by barcode (GOODS_CODE)
      if (!product) {
        const unit = await ProductUnit.findOne({
          where: { barcode: code },
          include: [
            {
              model: Product,
              where: { isActive: true }
            },
            {
              model: ProductPrice,
              as: 'prices'
            }
          ]
        });

        if (unit && unit.Product) {
          // Get full product with all units
          product = await Product.findByPk(unit.Product.id, {
            include: [
              {
                model: ProductUnit,
                as: 'units',
                include: [
                  {
                    model: ProductPrice,
                    as: 'prices'
                  }
                ]
              }
            ]
          });
        }
      }

      // Try 3: Find by unitCode (GOODS_CODE might be unitCode)
      if (!product) {
        const unit = await ProductUnit.findOne({
          where: { unitCode: code },
          include: [
            {
              model: Product,
              where: { isActive: true }
            },
            {
              model: ProductPrice,
              as: 'prices'
            }
          ]
        });

        if (unit && unit.Product) {
          // Get full product with all units
          product = await Product.findByPk(unit.Product.id, {
            include: [
              {
                model: ProductUnit,
                as: 'units',
                include: [
                  {
                    model: ProductPrice,
                    as: 'prices'
                  }
                ]
              }
            ]
          });
        }
      }

      // Convert to plain object
      const plainProduct = product ? product.toJSON() : null;

      if (plainProduct) {
        console.log(`Found product: ${plainProduct.sku} - ${plainProduct.name}`);
      } else {
        console.log(`Product not found for code: ${code}`);
      }

      return { success: true, data: plainProduct };
    } catch (error) {
      console.error('Error in product:findByCode:', error);
      return { success: false, error: String(error) };
    }
  });

  // Transaction handlers
  ipcMain.handle('transaction:park', async (event, billData) => {
    try {
      const { Transaction, TransactionItem } = require('../models');

      const transaction = await Transaction.create({
        transactionNumber: `PARK-${Date.now()}`,
        terminalId: 'POS-01',
        customerId: billData.customerId,
        transactionDate: new Date(),
        subtotal: billData.subtotal,
        vatAmount: billData.vatAmount,
        vatType: billData.vatType,
        vatRate: billData.vatRate,
        discount: billData.discount,
        grandTotal: billData.grandTotal,
        paymentMethod: 'PENDING',
        status: 'PARKED',
        isSynced: false,
      });

      // Create transaction items
      for (const item of billData.items) {
        await TransactionItem.create({
          transactionId: transaction.id,
          productId: item.productId,
          productSku: item.productSku,
          productName: item.productName,
          productNameEn: item.productNameEn,
          productNameLo: item.productNameLo,
          unitId: item.unitId,
          unitName: item.unitName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          discount: item.discount,
          lineNumber: item.lineNumber,
        });
      }

      return { success: true, data: transaction.toJSON() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('transaction:getParked', async () => {
    try {
      const { Transaction, TransactionItem } = require('../models');

      const transactions = await Transaction.findAll({
        where: { status: 'PARKED' },
        include: [
          {
            model: TransactionItem,
            as: 'items',
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const plainTransactions = transactions.map((t: any) => t.toJSON());
      return { success: true, data: plainTransactions };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('transaction:delete', async (event, transactionId: string) => {
    try {
      const { Transaction, TransactionItem } = require('../models');

      // Delete items first
      await TransactionItem.destroy({ where: { transactionId } });
      
      // Delete transaction
      await Transaction.destroy({ where: { id: transactionId } });

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('transaction:complete', async (event, transactionData) => {
    try {
      const { Transaction, TransactionItem } = require('../models');

      const transaction = await Transaction.create({
        transactionNumber: `TXN-${Date.now()}`,
        terminalId: 'POS-01',
        customerId: transactionData.customerId,
        transactionDate: new Date(),
        subtotal: transactionData.subtotal,
        vatAmount: transactionData.vatAmount,
        vatType: transactionData.vatType,
        vatRate: transactionData.vatRate,
        discount: transactionData.discount,
        grandTotal: transactionData.grandTotal,
        paymentMethod: transactionData.paymentMethod,
        status: 'COMPLETED',
        isSynced: false,
      });

      // Create transaction items
      for (const item of transactionData.items) {
        await TransactionItem.create({
          transactionId: transaction.id,
          productId: item.productId,
          productSku: item.productSku,
          productName: item.productName,
          productNameEn: item.productNameEn,
          productNameLo: item.productNameLo,
          unitId: item.unitId,
          unitName: item.unitName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          discount: item.discount,
          lineNumber: item.lineNumber,
        });
      }

      return { success: true, data: transaction.toJSON() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Customer handlers
  ipcMain.handle('customer:search', async (event, query: string) => {
    try {
      const { Customer } = require('../models');
      const { Op } = require('sequelize');

      const customers = await Customer.findAll({
        where: {
          [Op.or]: [
            { code: { [Op.like]: `%${query}%` } },
            { name: { [Op.like]: `%${query}%` } },
            { phone: { [Op.like]: `%${query}%` } }
          ],
          isActive: true
        },
        limit: 20
      });

      // Convert to plain objects
      const plainCustomers = customers.map((c: any) => c.toJSON());

      return { success: true, data: plainCustomers };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Shift handlers
  ipcMain.handle('shift:getCurrent', async () => {
    try {
      const { Shift } = require('../models');
      
      const shift = await Shift.findOne({
        where: { status: 'OPEN' },
        order: [['startTime', 'DESC']],
      });

      return { success: true, data: shift ? shift.toJSON() : null };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('shift:start', async (event, { openingCash }) => {
    try {
      const { Shift, Configuration } = require('../models');

      // Check if there's already an open shift
      const existingShift = await Shift.findOne({ where: { status: 'OPEN' } });
      if (existingShift) {
        return { success: false, error: 'There is already an open shift' };
      }

      // Get terminal ID
      const terminalConfig = await Configuration.findByPk('terminal_id');
      const terminalId = terminalConfig?.value || 'POS-01';

      // Create new shift
      const shift = await Shift.create({
        shiftNumber: `SHIFT-${Date.now()}`,
        terminalId,
        startTime: new Date(),
        openingCash,
        status: 'OPEN',
      });

      return { success: true, data: shift.toJSON() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('shift:end', async (event, { shiftId, closingCash }) => {
    try {
      const { Shift, Transaction } = require('../models');

      const shift = await Shift.findByPk(shiftId);
      if (!shift) {
        return { success: false, error: 'Shift not found' };
      }

      // Calculate total sales
      const transactions = await Transaction.findAll({
        where: {
          shiftId,
          status: 'COMPLETED',
        },
      });

      const totalSales = transactions.reduce((sum: number, txn: any) => {
        return sum + parseFloat(txn.grandTotal);
      }, 0);

      // Update shift
      await shift.update({
        endTime: new Date(),
        closingCash,
        totalSales,
        status: 'CLOSED',
      });

      return { success: true, data: shift.toJSON() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Printer handlers
  ipcMain.handle('printer:print', async (event, receiptData) => {
    try {
      const PrinterService = require('../services/PrinterService').default;
      const printerService = PrinterService.getInstance();
      
      const success = await printerService.printReceipt(receiptData);
      return { success };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('printer:reprint', async () => {
    try {
      const PrinterService = require('../services/PrinterService').default;
      const printerService = PrinterService.getInstance();
      
      const success = await printerService.reprintLastReceipt();
      return { success };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  console.log('IPC handlers registered');
}

// Customer Display handlers
ipcMain.on('customer-display:update', (event, data) => {
  const { getCustomerDisplayWindow } = require('./main');
  const customerDisplay = getCustomerDisplayWindow();
  if (customerDisplay) {
    customerDisplay.webContents.send('update-customer-display', data);
  }
});

ipcMain.on('customer-display:show-thank-you', () => {
  const { getCustomerDisplayWindow } = require('./main');
  const customerDisplay = getCustomerDisplayWindow();
  if (customerDisplay) {
    customerDisplay.webContents.send('show-thank-you');
  }
});

ipcMain.on('customer-display:show-qr', (event, qrCodeData) => {
  const { getCustomerDisplayWindow } = require('./main');
  const customerDisplay = getCustomerDisplayWindow();
  if (customerDisplay) {
    customerDisplay.webContents.send('show-qr-code', qrCodeData);
  }
});

ipcMain.on('customer-display:hide-qr', () => {
  const { getCustomerDisplayWindow } = require('./main');
  const customerDisplay = getCustomerDisplayWindow();
  if (customerDisplay) {
    customerDisplay.webContents.send('hide-qr-code');
  }
});

ipcMain.on('customer-display:change-language', (event, language) => {
  const { getCustomerDisplayWindow } = require('./main');
  const customerDisplay = getCustomerDisplayWindow();
  if (customerDisplay) {
    customerDisplay.webContents.send('change-language', language);
  }
});
