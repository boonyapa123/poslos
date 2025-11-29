import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import DatabaseManager from '../services/DatabaseManager';
import APIClient from '../services/APIClient';
import Configuration from '../models/Configuration';
import { setupIpcHandlers } from './ipcHandlers';

let mainWindow: BrowserWindow | null = null;
let customerDisplayWindow: BrowserWindow | null = null;

async function createWindow() {
  // Initialize database first
  try {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    // Get the actual sequelize instance
    const actualSequelize = dbManager.getSequelize();
    
    // Update shared sequelize for models
    const { setSharedSequelize } = require('../services/DatabaseManager');
    setSharedSequelize(actualSequelize);
    
    // Import all models (they will use the updated sequelize via Proxy)
    console.log('🔄 Loading models...');
    const Product = require('../models/Product').default;
    const Customer = require('../models/Customer').default;
    const Employee = require('../models/Employee').default;
    const ProductUnit = require('../models/ProductUnit').default;
    const ProductPrice = require('../models/ProductPrice').default;
    const BankAccount = require('../models/BankAccount').default;
    const Transaction = require('../models/Transaction').default;
    const TransactionItem = require('../models/TransactionItem').default;
    const Shift = require('../models/Shift').default;
    const Configuration = require('../models/Configuration').default;
    const Branch = require('../models/Branch').default;
    const Category = require('../models/Category').default;
    const Department = require('../models/Department').default;
    const Warehouse = require('../models/Warehouse').default;
    const SyncLog = require('../models/SyncLog').default;
    
    // Setup associations
    require('../models');
    
    // Sync models (create tables if needed)
    console.log('🔄 Syncing database schema...');
    
    // ตรวจสอบว่ามีตารางหรือยัง
    const [results] = await actualSequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='products'"
    );
    const hasTable = results.length > 0;
    
    // ถ้ายังไม่มีตาราง ให้สร้างใหม่
    if (!hasTable) {
      console.log('   Creating tables (force: true)...');
      await actualSequelize.sync({ force: true });
    } else {
      console.log('   Tables exist, skipping sync...');
    }
    
    console.log('✅ Database schema synced');
    
    // Now setup IPC handlers (after models are ready)
    setupIpcHandlers();
    
    // Check if database has data
    let productCount = 0;
    try {
      productCount = await Product.count();
    } catch (error) {
      console.log('   ⚠️  Error counting products, will import data');
      productCount = 0;
    }
    
    if (productCount === 0) {
      console.log('📦 Database is empty, importing data from Excel...');
      const { importFromExcel } = require('./importExcel');
      const excelPath = path.join(__dirname, '../../ส่งข้อมูลPOS.xlsx');
      await importFromExcel(excelPath);
    } else {
      console.log(`✅ Database has ${productCount} products`);
    }
    
    // Load API configuration
    await loadApiConfiguration();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Close customer display when main window closes
    if (customerDisplayWindow) {
      customerDisplayWindow.close();
    }
  });

  // Create customer display window
  createCustomerDisplay();
}

function createCustomerDisplay() {
  customerDisplayWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  customerDisplayWindow.loadFile(path.join(__dirname, '../customer-display.html'));

  // Open DevTools in development to debug
  if (process.env.NODE_ENV === 'development') {
    customerDisplayWindow.webContents.openDevTools();
  }

  customerDisplayWindow.on('closed', () => {
    customerDisplayWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Export windows for IPC communication
export function getMainWindow() {
  return mainWindow;
}

export function getCustomerDisplayWindow() {
  return customerDisplayWindow;
}

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

async function loadApiConfiguration() {
  try {
    const apiClient = APIClient.getInstance();
    
    const baseURLConfig = await Configuration.findByPk('api_base_url');
    const apiKeyConfig = await Configuration.findByPk('api_key');
    const terminalIdConfig = await Configuration.findByPk('terminal_id');
    
    if (baseURLConfig && apiKeyConfig && terminalIdConfig) {
      apiClient.configure(
        baseURLConfig.value,
        apiKeyConfig.value,
        terminalIdConfig.value
      );
      console.log('API client configured from database');
    } else {
      console.log('API configuration not found, please configure in settings');
    }
  } catch (error) {
    console.error('Error loading API configuration:', error);
  }
}
