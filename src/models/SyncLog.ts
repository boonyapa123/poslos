import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/DatabaseManager';

interface SyncLogAttributes {
  id: string;
  type: 'PULL' | 'PUSH';
  status: 'SUCCESS' | 'FAILED';
  recordsAffected: number;
  errorMessage?: string;
  startTime: Date;
  endTime: Date;
}

interface SyncLogCreationAttributes extends Optional<SyncLogAttributes, 'id'> {}

class SyncLog extends Model<SyncLogAttributes, SyncLogCreationAttributes> implements SyncLogAttributes {
  public id!: string;
  public type!: 'PULL' | 'PUSH';
  public status!: 'SUCCESS' | 'FAILED';
  public recordsAffected!: number;
  public errorMessage?: string;
  public startTime!: Date;
  public endTime!: Date;
}

SyncLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('PULL', 'PUSH'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED'),
      allowNull: false,
    },
    recordsAffected: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sync_logs',
    timestamps: false,
  }
);

export default SyncLog;
