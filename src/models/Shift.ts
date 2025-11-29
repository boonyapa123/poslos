import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/DatabaseManager';

interface ShiftAttributes {
  id: string;
  shiftNumber: string;
  terminalId: string;
  startTime: Date;
  endTime?: Date;
  openingCash: number;
  closingCash?: number;
  totalSales?: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
  public id!: string;
  public shiftNumber!: string;
  public terminalId!: string;
  public startTime!: Date;
  public endTime?: Date;
  public openingCash!: number;
  public closingCash?: number;
  public totalSales?: number;
  public status!: 'OPEN' | 'CLOSED';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Shift.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    shiftNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    terminalId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    openingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    closingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    totalSales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'CLOSED'),
      allowNull: false,
      defaultValue: 'OPEN',
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
    tableName: 'shifts',
    timestamps: true,
  }
);

export default Shift;
