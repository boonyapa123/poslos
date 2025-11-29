import * as XLSX from 'xlsx';
import Product from '../models/Product';
import ProductUnit from '../models/ProductUnit';
import ProductPrice from '../models/ProductPrice';
import Customer from '../models/Customer';
import Employee from '../models/Employee';
import BankAccount from '../models/BankAccount';
import Branch from '../models/Branch';
import Category from '../models/Category';
import Department from '../models/Department';
import Warehouse from '../models/Warehouse';
import Transaction from '../models/Transaction';
import TransactionItem from '../models/TransactionItem';

export async function importFromExcel(excelPath: string) {
  console.log('Starting Excel import...');
  
  try {
    const workbook = XLSX.readFile(excelPath);
    
    // Import in order: Master data first, then transactional data
    await importBranches(workbook);
    await importCategories(workbook);
    await importDepartments(workbook);
    await importWarehouses(workbook);
    await importUnits(workbook);
    await importProducts(workbook);
    await importPrices(workbook);
    await importCustomers(workbook);
    await importEmployees(workbook);
    await importBanks(workbook);
    await importTransactions(workbook);
    
    console.log('Excel import completed successfully!');
  } catch (error) {
    console.error('Error importing Excel:', error);
    throw error;
  }
}

function getSheetData(workbook: XLSX.WorkBook, sheetName: string): any[] {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];
  
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  // Find header row (usually row with column names)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row: any = data[i];
    if (row && row.length > 0 && typeof row[0] === 'string' && row[0].includes('_')) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) return [];
  
  const headers: any = data[headerRowIndex];
  const rows = data.slice(headerRowIndex + 1);
  
  return rows.map((row: any) => {
    const obj: any = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter((obj: any) => Object.values(obj).some(v => v !== undefined && v !== null && v !== ''));
}

async function importBranches(workbook: XLSX.WorkBook) {
  console.log('Importing branches...');
  const branches = getSheetData(workbook, 'BRANCH');
  console.log(`Found ${branches.length} branches`);
  
  let imported = 0;
  
  for (const branch of branches) {
    if (!branch.BRANCH_CODE || !branch.BRANCH_NAME) continue;
    
    try {
      await Branch.create({
        code: String(branch.BRANCH_CODE),
        name: String(branch.BRANCH_NAME),
        address: branch.Branch_address ? String(branch.Branch_address) : undefined,
        phone: branch.Branch_TEL ? String(branch.Branch_TEL) : undefined,
        isActive: true,
      });
      imported++;
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} branches`);
}

async function importCategories(workbook: XLSX.WorkBook) {
  console.log('Importing categories...');
  const categories = getSheetData(workbook, 'ICCAT');
  console.log(`Found ${categories.length} categories`);
  
  let imported = 0;
  
  for (const cat of categories) {
    if (!cat.ICCAT_CODE || !cat.ICCAT_NAME) continue;
    
    try {
      await Category.create({
        code: String(cat.ICCAT_CODE),
        name: String(cat.ICCAT_NAME),
        isActive: true,
      });
      imported++;
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} categories`);
}

async function importDepartments(workbook: XLSX.WorkBook) {
  console.log('Importing departments...');
  const departments = getSheetData(workbook, 'ICDEPT');
  console.log(`Found ${departments.length} departments`);
  
  let imported = 0;
  const batchSize = 100;
  
  for (let i = 0; i < departments.length; i++) {
    const dept = departments[i];
    if (!dept.ICDEPT_NAME) continue;
    
    try {
      await Department.create({
        name: String(dept.ICDEPT_NAME),
        level: dept.ICDEPT_LEVEL || 1,
        categoryCode: dept.ICDEPT_ICCAT ? String(dept.ICDEPT_ICCAT) : undefined,
        isActive: true,
      });
      
      imported++;
      
      if (imported % batchSize === 0) {
        console.log(`Imported ${imported} departments...`);
      }
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} departments`);
}

async function importWarehouses(workbook: XLSX.WorkBook) {
  console.log('Importing warehouses...');
  const warehouses = getSheetData(workbook, 'WARELOCATION');
  console.log(`Found ${warehouses.length} warehouses`);
  
  let imported = 0;
  
  for (const wh of warehouses) {
    if (!wh.WL_NAME) continue;
    
    try {
      await Warehouse.create({
        name: String(wh.WL_NAME),
        branchCode: wh.WL_BRANCH ? String(wh.WL_BRANCH) : undefined,
        isActive: true,
      });
      imported++;
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} warehouses`);
}

async function importUnits(workbook: XLSX.WorkBook) {
  console.log('Importing units...');
  const units = getSheetData(workbook, 'UOFQTY');
  console.log(`Found ${units.length} units`);
  
  // Units will be created when importing products
  // Just log for now
}

async function importProducts(workbook: XLSX.WorkBook) {
  console.log('Importing products...');
  const skuData = getSheetData(workbook, 'SKUMASTER');
  const goodsData = getSheetData(workbook, 'GOODSMASTER');
  const unitsData = getSheetData(workbook, 'UOFQTY');
  
  console.log(`Found ${skuData.length} SKUs, ${goodsData.length} goods`);
  
  // Create unit lookup
  const unitLookup: any = {};
  unitsData.forEach((unit: any) => {
    unitLookup[unit.UTQ_KEY] = {
      name: unit.UTQ_NAME,
      qty: unit.UTQ_QTY || 1
    };
  });
  
  // Create goods lookup by SKU
  const goodsBySku: any = {};
  goodsData.forEach((goods: any) => {
    if (!goodsBySku[goods.GOODS_SKU]) {
      goodsBySku[goods.GOODS_SKU] = [];
    }
    goodsBySku[goods.GOODS_SKU].push(goods);
  });
  
  let imported = 0;
  const batchSize = 100;
  
  for (let i = 0; i < skuData.length; i++) {
    const sku = skuData[i];
    if (!sku.SKU_CODE || !sku.SKU_NAME) continue;
    
    try {
      // Create product one by one
      const product = await Product.create({
        sku: String(sku.SKU_CODE),
        name: String(sku.SKU_NAME),
        category: sku.SKU_ICCAT ? String(sku.SKU_ICCAT) : undefined,
        isActive: true,
      });
      
      // Find all goods (units) for this SKU
      const productGoods = goodsBySku[sku.SKU_KEY] || [];
      
      if (productGoods.length === 0) {
        // Create default unit
        const baseUnitInfo = unitLookup[sku.SKU_K_UTQ] || { name: 'ชิ้น', qty: 1 };
        await ProductUnit.create({
          productId: product.id,
          unitCode: String(sku.SKU_CODE),
          unitName: baseUnitInfo.name,
          conversionRate: 1,
          isBaseUnit: true,
        });
      } else {
        // Create units from goods one by one
        for (let j = 0; j < productGoods.length; j++) {
          const goods = productGoods[j];
          const unitInfo = unitLookup[goods.GOODS_UTQ] || { name: 'ชิ้น', qty: 1 };
          
          await ProductUnit.create({
            productId: product.id,
            unitCode: String(goods.GOODS_CODE),
            unitName: unitInfo.name,
            conversionRate: unitInfo.qty,
            barcode: String(goods.GOODS_CODE),
            isBaseUnit: j === 0,
          });
        }
      }
      
      imported++;
      
      if (imported % batchSize === 0) {
        console.log(`Imported ${imported} products...`);
      }
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} products`);
}

async function importPrices(workbook: XLSX.WorkBook) {
  console.log('Importing prices...');
  const pricesData = getSheetData(workbook, 'ARPLU');
  const priceLevelsData = getSheetData(workbook, 'ARPRB');
  const goodsData = getSheetData(workbook, 'GOODSMASTER');
  
  console.log(`Found ${pricesData.length} prices, ${priceLevelsData.length} price levels`);
  
  // Create goods to unit lookup
  const goodsToUnit: any = {};
  const units = await ProductUnit.findAll();
  units.forEach(unit => {
    if (unit.barcode) {
      goodsToUnit[unit.barcode] = unit;
    }
  });
  
  let imported = 0;
  const batchSize = 100; // Smaller batch for prices
  
  for (let i = 0; i < pricesData.length; i++) { // Import all prices
    const priceRow = pricesData[i];
    if (!priceRow.ARPLU_GOODS || !priceRow.ARPLU_PRC_K) continue;
    
    try {
      // Find goods
      const goods = goodsData.find((g: any) => g.GOODS_KEY === priceRow.ARPLU_GOODS);
      if (!goods) continue;
      
      const unit = goodsToUnit[String(goods.GOODS_CODE)];
      if (!unit) continue;
      
      const priceLevel = priceRow.ARPLU_ARPRB || 1;
      const price = parseFloat(priceRow.ARPLU_PRC_K) || 0;
      
      if (price > 0) {
        await ProductPrice.create({
          productId: unit.productId,
          unitId: unit.id,
          priceLevel: priceLevel,
          price: price,
          effectiveDate: new Date(),
        });
        
        imported++;
        if (imported % batchSize === 0) {
          console.log(`Imported ${imported} prices...`);
        }
      }
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} prices`);
}

async function importCustomers(workbook: XLSX.WorkBook) {
  console.log('Importing customers...');
  const customers = getSheetData(workbook, 'ARFILE');
  console.log(`Found ${customers.length} customers`);
  
  let imported = 0;
  const batchSize = 100;
  
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    if (!customer.AR_CODE || !customer.AR_NAME) continue;
    
    try {
      await Customer.create({
        code: String(customer.AR_CODE),
        name: String(customer.AR_NAME),
        priceLevel: customer.AR_ARPRB || 1,
        isActive: true,
      });
      
      imported++;
      
      if (imported % batchSize === 0) {
        console.log(`Imported ${imported} customers...`);
      }
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} customers`);
}

async function importEmployees(workbook: XLSX.WorkBook) {
  console.log('Importing employees...');
  const salesData = getSheetData(workbook, 'USER');
  const serviceData = getSheetData(workbook, 'SERVICE');
  
  console.log(`Found ${salesData.length} sales, ${serviceData.length} service employees`);
  
  let imported = 0;
  
  // Import sales employees
  for (const emp of salesData) {
    if (!emp.USER_CODE || !emp.USER_NAME) continue;
    
    try {
      await Employee.create({
        code: String(emp.USER_CODE),
        name: String(emp.USER_NAME),
        type: 'SALES',
        isActive: true,
      });
      imported++;
    } catch (error) {
      // Skip duplicates
    }
  }
  
  // Import service employees
  for (const emp of serviceData) {
    if (!emp.USER_CODE || !emp.USER_NAME) continue;
    
    try {
      await Employee.create({
        code: String(emp.USER_CODE),
        name: String(emp.USER_NAME),
        type: 'SERVICE',
        isActive: true,
      });
      imported++;
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} employees`);
}

async function importBanks(workbook: XLSX.WorkBook) {
  console.log('Importing banks...');
  const banks = getSheetData(workbook, 'BANK');
  console.log(`Found ${banks.length} banks`);
  
  let imported = 0;
  
  for (let i = 0; i < banks.length; i++) {
    const bank = banks[i];
    if (!bank.BANK_CODE || !bank.BANK_NAME) continue;
    
    try {
      await BankAccount.create({
        bankName: String(bank.BANK_NAME),
        accountNumber: bank['BANK_A/C_No'] ? String(bank['BANK_A/C_No']) : '',
        accountName: bank['BANK_A/C_NAME'] ? String(bank['BANK_A/C_NAME']) : '',
        qrCodeData: bank['BANK_QR '] ? String(bank['BANK_QR ']) : '',
        isActive: true,
        displayOrder: i,
      });
      imported++;
    } catch (error) {
      // Skip duplicates
    }
  }
  
  console.log(`Imported ${imported} banks`);
}

async function importTransactions(workbook: XLSX.WorkBook) {
  console.log('Importing sample transactions...');
  const docData = getSheetData(workbook, 'DOCINFO');
  const skmData = getSheetData(workbook, 'SKUMOVE');
  
  console.log(`Found ${docData.length} transactions, ${skmData.length} items`);
  
  // Create lookups
  const customerLookup: any = {};
  const customers = await Customer.findAll();
  customers.forEach(c => {
    customerLookup[c.code] = c;
  });
  
  const employeeLookup: any = {};
  const employees = await Employee.findAll();
  employees.forEach(e => {
    employeeLookup[e.code] = e;
  });
  
  const productLookup: any = {};
  const products = await Product.findAll();
  products.forEach(p => {
    productLookup[p.sku] = p;
  });
  
  const unitLookup: any = {};
  const units = await ProductUnit.findAll();
  units.forEach(u => {
    if (u.barcode) {
      unitLookup[u.barcode] = u;
    }
  });
  
  // Group items by transaction
  const itemsByRef: any = {};
  skmData.forEach((item: any) => {
    const ref = item.DI_REF;
    if (!ref) return;
    
    if (!itemsByRef[ref]) {
      itemsByRef[ref] = [];
    }
    itemsByRef[ref].push(item);
  });
  
  let imported = 0;
  
  for (const doc of docData) {
    if (!doc.DI_REF) continue;
    
    try {
      // Find customer
      const customer = doc.AR_CODE ? customerLookup[String(doc.AR_CODE)] : null;
      
      // Find employees
      const salesEmp = doc.DI_CRE_BY ? employeeLookup[String(doc.DI_CRE_BY)] : null;
      const serviceEmp = doc.SV_BY ? employeeLookup[String(doc.SV_BY)] : null;
      
      // Convert Excel date to JS date
      const excelDate = doc.DI_DATE;
      const jsDate = excelDate ? new Date((excelDate - 25569) * 86400 * 1000) : new Date();
      
      // Create transaction
      const amount = doc.DI_AMOUNT ? parseFloat(doc.DI_AMOUNT) / 100 : 0;
      const transaction = await Transaction.create({
        transactionNumber: String(doc.DI_REF),
        terminalId: doc.DI_BRANCH ? String(doc.DI_BRANCH) : 'IMPORT',
        transactionDate: jsDate,
        customerId: customer?.id,
        salesEmployeeId: salesEmp?.id,
        serviceEmployeeId: serviceEmp?.id,
        subtotal: amount,
        vatAmount: 0,
        vatType: 'INCLUSIVE',
        vatRate: 7,
        discount: 0,
        grandTotal: amount,
        paymentMethod: doc.DI_PM_BY ? String(doc.DI_PM_BY) : 'CASH',
        status: 'COMPLETED',
        isSynced: false,
      });
      
      // Create transaction items
      const items = itemsByRef[doc.DI_REF] || [];
      for (const item of items) {
        if (!item.GOODS_CODE) continue;
        
        const unit = unitLookup[String(item.GOODS_CODE)];
        if (!unit) continue;
        
        const product = productLookup[String(item.SKU_CODE)];
        if (!product) continue;
        
        const lineTotal = item.SKM_AMOUNT ? parseFloat(item.SKM_AMOUNT) / 100 : 0;
        await TransactionItem.create({
          transactionId: transaction.id,
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          unitId: unit.id,
          unitName: unit.unitName,
          quantity: item.QTY || 1,
          unitPrice: item.SKM_PRC ? parseFloat(item.SKM_PRC) / 100 : 0,
          lineTotal: lineTotal,
          discount: 0,
          lineNumber: item.SKM_No || 1,
        });
      }
      
      imported++;
    } catch (error) {
      console.error(`Error importing transaction ${doc.DI_REF}:`, error);
    }
  }
  
  console.log(`Imported ${imported} sample transactions`);
}
