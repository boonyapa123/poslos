import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/DatabaseManager';

interface TransactionAttributes {
  id: string;
  transactionNumber: string;
  terminalId: string;
  shiftId?: string;
  customerId?: string;
  salesEmployeeId?: string;
  serviceEmployeeId?: string;
  transactionDate: Date;
  subtotal: number;
  vatAmount: number;
  vatType: 'INCLUSIVE' | 'EXCLUSIVE';
  vatRate: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  status: 'PARKED' | 'COMPLETED' | 'CANCELLED';
  isSynced: boolean;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public transactionNumber!: string;
  public terminalId!: string;
  public shiftId?: string;
  public customerId?: string;
  public salesEmployeeId?: string;
  public serviceEmployeeId?: string;
  public transactionDate!: Date;
  public subtotal!: number;
  public vatAmount!: number;
  public vatType!: 'INCLUSIVE' | 'EXCLUSIVE';
  public vatRate!: number;
  public discount!: number;
  public grandTotal!: number;
  public paymentMethod!: string;
  public status!: 'PARKED' | 'COMPLETED' | 'CANCELLED';
  public isSynced!: boolean;
  public syncedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    terminalId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shiftId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    salesEmployeeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id',
      },
    },
    serviceEmployeeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id',
      },
    },
    transactionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    vatAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    vatType: {
      type: DataTypes.ENUM('INCLUSIVE', 'EXCLUSIVE'),
      allowNull: false,
      defaultValue: 'INCLUSIVE',
    },
    vatRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 7,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    grandTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CASH',
    },
    status: {
      type: DataTypes.ENUM('PARKED', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'COMPLETED',
    },
    isSynced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    timestamps: true,
  }
);

export default Transaction;
