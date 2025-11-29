import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/DatabaseManager';

interface TransactionItemAttributes {
  id: string;
  transactionId: string;
  productId: string;
  productSku: string;
  productName: string;
  productNameEn?: string;
  productNameLo?: string;
  unitId: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  lineNumber: number;
}

interface TransactionItemCreationAttributes extends Optional<TransactionItemAttributes, 'id'> {}

class TransactionItem extends Model<TransactionItemAttributes, TransactionItemCreationAttributes> implements TransactionItemAttributes {
  public id!: string;
  public transactionId!: string;
  public productId!: string;
  public productSku!: string;
  public productName!: string;
  public productNameEn?: string;
  public productNameLo?: string;
  public unitId!: string;
  public unitName!: string;
  public quantity!: number;
  public unitPrice!: number;
  public lineTotal!: number;
  public discount!: number;
  public lineNumber!: number;
}

TransactionItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    productSku: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productNameEn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productNameLo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'product_units',
        key: 'id',
      },
    },
    unitName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    lineTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'transaction_items',
    timestamps: false,
  }
);

export default TransactionItem;
