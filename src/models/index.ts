/**
 * Models Index
 * Define all model associations here
 */

import Product from './Product';
import ProductUnit from './ProductUnit';
import ProductPrice from './ProductPrice';
import Customer from './Customer';
import Employee from './Employee';
import BankAccount from './BankAccount';
import Transaction from './Transaction';
import TransactionItem from './TransactionItem';
import Shift from './Shift';
import SyncLog from './SyncLog';
import Configuration from './Configuration';
import Branch from './Branch';
import Category from './Category';
import Department from './Department';
import Warehouse from './Warehouse';

// Product associations
Product.hasMany(ProductUnit, {
  foreignKey: 'productId',
  as: 'units',
});

ProductUnit.belongsTo(Product, {
  foreignKey: 'productId',
});

// ProductUnit associations
ProductUnit.hasMany(ProductPrice, {
  foreignKey: 'unitId',
  as: 'prices',
});

ProductPrice.belongsTo(ProductUnit, {
  foreignKey: 'unitId',
});

ProductPrice.belongsTo(Product, {
  foreignKey: 'productId',
});

// Transaction associations
Transaction.hasMany(TransactionItem, {
  foreignKey: 'transactionId',
  as: 'items',
});

TransactionItem.belongsTo(Transaction, {
  foreignKey: 'transactionId',
});

Transaction.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

Transaction.belongsTo(Shift, {
  foreignKey: 'shiftId',
  as: 'shift',
});

// Export all models
export {
  Product,
  ProductUnit,
  ProductPrice,
  Customer,
  Employee,
  BankAccount,
  Transaction,
  TransactionItem,
  Shift,
  SyncLog,
  Configuration,
  Branch,
  Category,
  Department,
  Warehouse,
};
