const XLSX = require('xlsx');
const path = require('path');

// Read Excel file
const excelPath = path.join(__dirname, '../ส่งข้อมูลPOS.xlsx');
const workbook = XLSX.readFile(excelPath);

console.log('=== Excel File Analysis ===\n');
console.log('Sheet Names:', workbook.SheetNames);
console.log('\n');

// Analyze each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Sheet: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length > 0) {
    console.log('Headers:', data[0]);
    console.log('Total Rows:', data.length - 1);
    console.log('\nFirst 3 rows of data:');
    for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
      console.log(`Row ${i}:`, data[i]);
    }
  } else {
    console.log('(Empty sheet)');
  }
  console.log('\n' + '='.repeat(50));
});

// Export full data as JSON for inspection
workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  console.log(`\n\n=== ${sheetName} (JSON format) ===`);
  console.log(JSON.stringify(jsonData.slice(0, 2), null, 2));
});
