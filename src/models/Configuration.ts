import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/DatabaseManager';

interface ConfigurationAttributes {
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
}

interface ConfigurationCreationAttributes extends Optional<ConfigurationAttributes, 'updatedAt'> {}

class Configuration extends Model<ConfigurationAttributes, ConfigurationCreationAttributes> implements ConfigurationAttributes {
  public key!: string;
  public value!: string;
  public description?: string;
  public readonly updatedAt!: Date;
}

Configuration.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'configurations',
    timestamps: false,
    updatedAt: true,
  }
);

export default Configuration;
