import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/DatabaseManager';

interface ProductPriceAttributes {
  id: string;
  productId: string;
  unitId: string;
  priceLevel: number;
  price: number;
  effectiveDate: Date;
}

interface ProductPriceCreationAttributes extends Optional<ProductPriceAttributes, 'id'> {}

class ProductPrice extends Model<ProductPriceAttributes, ProductPriceCreationAttributes> implements ProductPriceAttributes {
  public id!: string;
  public productId!: string;
  public unitId!: string;
  public priceLevel!: number;
  public price!: number;
  public effectiveDate!: Date;
}

ProductPrice.init(
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
    unitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'product_units',
        key: 'id',
      },
    },
    priceLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'product_prices',
    timestamps: false,
  }
);

export default ProductPrice;
