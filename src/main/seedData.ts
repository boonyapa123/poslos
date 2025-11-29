import Product from '../models/Product';
import ProductUnit from '../models/ProductUnit';
import ProductPrice from '../models/ProductPrice';
import Customer from '../models/Customer';
import Employee from '../models/Employee';

export async function seedTestData() {
  try {
    // Check if data already exists
    const productCount = await Product.count();
    if (productCount > 0) {
      console.log('Test data already exists, skipping seed');
      return;
    }

    console.log('Seeding test data...');

    // Create test products
    const product1 = await Product.create({
      sku: 'P001',
      name: 'ปูนซีเมนต์ตราช้าง 50 กก.',
      description: 'ปูนซีเมนต์คุณภาพดี',
      category: 'วัสดุก่อสร้าง',
      isActive: true,
    });

    const unit1 = await ProductUnit.create({
      productId: product1.id,
      unitCode: 'BAG',
      unitName: 'ถุง',
      conversionRate: 1,
      barcode: '8850123456789',
      isBaseUnit: true,
    });

    await ProductPrice.bulkCreate([
      { productId: product1.id, unitId: unit1.id, priceLevel: 1, price: 150.00, effectiveDate: new Date() },
      { productId: product1.id, unitId: unit1.id, priceLevel: 2, price: 145.00, effectiveDate: new Date() },
      { productId: product1.id, unitId: unit1.id, priceLevel: 3, price: 140.00, effectiveDate: new Date() },
    ]);

    const product2 = await Product.create({
      sku: 'P002',
      name: 'อิฐมอญแดง 3 นิ้ว',
      description: 'อิฐมอญคุณภาพดี',
      category: 'วัสดุก่อสร้าง',
      isActive: true,
    });

    const unit2 = await ProductUnit.create({
      productId: product2.id,
      unitCode: 'PCS',
      unitName: 'ก้อน',
      conversionRate: 1,
      barcode: '8850123456790',
      isBaseUnit: true,
    });

    await ProductPrice.bulkCreate([
      { productId: product2.id, unitId: unit2.id, priceLevel: 1, price: 3.50, effectiveDate: new Date() },
      { productId: product2.id, unitId: unit2.id, priceLevel: 2, price: 3.30, effectiveDate: new Date() },
      { productId: product2.id, unitId: unit2.id, priceLevel: 3, price: 3.00, effectiveDate: new Date() },
    ]);

    const product3 = await Product.create({
      sku: 'P003',
      name: 'ทรายหยาบ',
      description: 'ทรายหยาบสำหรับก่อสร้าง',
      category: 'วัสดุก่อสร้าง',
      isActive: true,
    });

    const unit3 = await ProductUnit.create({
      productId: product3.id,
      unitCode: 'M3',
      unitName: 'ลูกบาศก์เมตร',
      conversionRate: 1,
      barcode: '8850123456791',
      isBaseUnit: true,
    });

    await ProductPrice.bulkCreate([
      { productId: product3.id, unitId: unit3.id, priceLevel: 1, price: 450.00, effectiveDate: new Date() },
      { productId: product3.id, unitId: unit3.id, priceLevel: 2, price: 430.00, effectiveDate: new Date() },
      { productId: product3.id, unitId: unit3.id, priceLevel: 3, price: 400.00, effectiveDate: new Date() },
    ]);

    // Create test customers
    await Customer.bulkCreate([
      {
        code: 'C001',
        name: 'ลูกค้าทั่วไป',
        priceLevel: 1,
        isActive: true,
      },
      {
        code: 'C002',
        name: 'บริษัท ABC จำกัด',
        phone: '02-1234567',
        priceLevel: 2,
        isActive: true,
      },
      {
        code: 'C003',
        name: 'ร้านค้าส่ง XYZ',
        phone: '02-7654321',
        priceLevel: 3,
        isActive: true,
      },
    ]);

    // Create test employees
    await Employee.bulkCreate([
      {
        code: 'E001',
        name: 'พนักงานขาย 1',
        type: 'SALES',
        isActive: true,
      },
      {
        code: 'E002',
        name: 'พนักงานบริการ 1',
        type: 'SERVICE',
        isActive: true,
      },
    ]);

    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}
