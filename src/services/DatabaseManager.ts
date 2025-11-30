/**
 * Database Manager
 * จัดการ Sequelize instance สำหรับ Models
 */

import { Sequelize } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

class DatabaseManager {
  private static instance: DatabaseManager;
  private sequelize: Sequelize | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(dbPath?: string): Promise<void> {
    if (this.sequelize) {
      return; // Already initialized
    }

    // กำหนด path
    const userDataPath = app.getPath('userData');
    const defaultDbPath = path.join(userDataPath, 'pos.db');
    const finalDbPath = dbPath || defaultDbPath;

    console.log('📁 User data path:', userDataPath);
    console.log('📁 Database path:', finalDbPath);

    // สร้าง directory ถ้ายังไม่มี
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    // ตรวจสอบว่ามี database หรือยัง
    const dbExists = fs.existsSync(finalDbPath);

    if (!dbExists) {
      console.log('📦 Database not found, creating from template...');
      await this.createDatabaseFromTemplate(finalDbPath);
    } else {
      console.log('✅ Database already exists');
    }

    // สร้าง Sequelize instance with sqlite3
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: finalDbPath,
      logging: false,
      dialectOptions: {
        busyTimeout: 30000
      }
    });

    // Update shared instance for models
    setSharedSequelize(this.sequelize);

    // ทดสอบการเชื่อมต่อ
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Unable to connect to database:', error);
      throw error;
    }
  }

  private async createDatabaseFromTemplate(targetPath: string): Promise<void> {
    // ตำแหน่งไฟล์ template
    const templatePath = path.join(
      process.resourcesPath || path.join(__dirname, '..', '..'),
      'pos-template.db'
    );

    console.log('📁 Template path:', templatePath);

    // ตรวจสอบว่ามีไฟล์ template หรือไม่
    if (fs.existsSync(templatePath)) {
      // Copy template database
      console.log('📋 Copying template database...');
      fs.copyFileSync(templatePath, targetPath);

      const stats = fs.statSync(targetPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Database created from template (${fileSizeMB} MB)`);
    } else {
      console.warn('⚠️  Template database not found, creating empty database...');
      // สร้าง database เปล่า
      const tempSequelize = new Sequelize({
        dialect: 'sqlite',
        storage: targetPath,
        logging: false
      });
      await tempSequelize.sync({ force: true });
      await tempSequelize.close();
      console.log('✅ Created empty database');
    }
  }

  public getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.sequelize;
  }

  public async close(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
    }
  }
}

// Export singleton instance
export default DatabaseManager;

// Create a shared sequelize instance that will be initialized later
let sharedSequelize: Sequelize | null = null;

// Function to set the shared sequelize instance
export function setSharedSequelize(instance: Sequelize): void {
  console.log('🔄 Updating shared sequelize instance');
  sharedSequelize = instance;
}

// Function to get the shared sequelize instance
export function getSharedSequelize(): Sequelize {
  if (!sharedSequelize) {
    // Create temporary instance for initial model definitions
    console.log('⚠️  Creating temporary sequelize instance');
    sharedSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });
  }
  return sharedSequelize;
}

// Export sequelize instance for models using a Proxy to allow late binding
export const sequelize = new Proxy({} as Sequelize, {
  get(target, prop) {
    const instance = getSharedSequelize();
    return (instance as any)[prop];
  }
});
