const XLSX = require('xlsx');
const wb = XLSX.readFile('ส่งข้อมูลPOS.xlsx');

function getSheetData(sheetName, headerRow = 2, startRow = 3) {
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  if (data.length <= headerRow) return [];
  const headers = data[headerRow];
  const rows = [];
  for (let i = startRow; i < data.length; i++) {
    if (!data[i] || data[i].every(cell => cell === null || cell === '')) continue;
    const row = {};
    headers.forEach((header, index) => {
      if (header) row[header] = data[i][index];
    });
    rows.push(row);
  }
  return rows;
}

const products = getSheetData('SKUMASTER', 3, 4);
console.log('Total products:', products.length);
console.log('First 3 products:');
products.slice(0, 3).forEach((p, i) => {
  console.log(`  ${i}:`, {
    SKU_KEY: p.SKU_KEY,
    SKU_CODE: p.SKU_CODE,
    SKU_NAME: p.SKU_NAME
  });
});

const goods = getSheetData('GOODSMASTER', 3, 4);
console.log('\nTotal goods:', goods.length);
console.log('First 3 goods:');
goods.slice(0, 3).forEach((g, i) => {
  console.log(`  ${i}:`, {
    GOODS_KEY: g.GOODS_KEY,
    GOODS_CODE: g.GOODS_CODE,
    GOODS_SKU: g.GOODS_SKU
  });
});

// Test mapping
const productMap = new Map();
products.forEach(p => {
  const skuKey = parseInt(String(p.SKU_KEY).trim());
  productMap.set(skuKey, 'PRODUCT_ID');
});

console.log('\nProduct Map size:', productMap.size);
console.log('Has key 101?', productMap.has(101));
console.log('Has key 102?', productMap.has(102));

// Test goods mapping
let matched = 0;
let notMatched = 0;
goods.slice(0, 10).forEach(g => {
  const skuKey = parseInt(String(g.GOODS_SKU).trim());
  if (productMap.has(skuKey)) {
    matched++;
  } else {
    notMatched++;
    console.log(`Not found: GOODS_SKU=${g.GOODS_SKU} (parsed: ${skuKey})`);
  }
});

console.log(`\nMatched: ${matched}, Not matched: ${notMatched}`);
