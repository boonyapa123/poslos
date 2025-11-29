import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/DatabaseManager';

interface ProductUnitAttributes {
  id: string;
  productId: string;
  unitCode: string;
  unitName: string;
  unitNameEn?: string;
  unitNameLo?: string;
  conversionRate: number;
  barcode?: string;
  isBaseUnit: boolean;
}

interface ProductUnitCreationAttributes extends Optional<ProductUnitAttributes, 'id'> {}

class ProductUnit extends Model<ProductUnitAttributes, ProductUnitCreationAttributes> implements ProductUnitAttributes {
  public id!: string;
  public productId!: string;
  public unitCode!: string;
  public unitName!: string;
  public unitNameEn?: string;
  public unitNameLo?: string;
  public conversionRate!: number;
  public barcode?: string;
  public isBaseUnit!: boolean;
}

ProductUnit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    unitCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unitName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unitNameEn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unitNameLo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conversionRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1,
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isBaseUnit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'product_units',
    timestamps: false,
  }
);

export default ProductUnit;
