# 🔄 Sync from Server - คู่มือฉบับสมบูรณ์

## 📋 สารบัญ

1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [สิ่งที่ต้องรู้](#สิ่งที่ต้องรู้)
3. [สิ่งที่ต้องมี](#สิ่งที่ต้องมี)
4. [Architecture](#architecture)
5. [API Design](#api-design)
6. [Implementation](#implementation)
7. [Security](#security)
8. [Performance](#performance)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## ภาพรวมระบบ

### Sync from Server คืออะไร?

```
┌─────────────────┐
│  Central Server │  ← ข้อมูล Master อยู่ที่นี่
│   (API Server)  │
└────────┬────────┘
         │
         │ HTTPS/REST API
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│POS-01 │ │POS-02 │  ← แต่ละเครื่อง sync ข้อมูล
│Branch1│ │Branch1│
└───────┘ └───────┘
```

### ข้อดี:
- ✅ ข้อมูลล่าสุดเสมอ
- ✅ ข้อมูลถูกต้องแน่นอน (validated จาก server)
- ✅ จัดการข้อมูลรวมศูนย์
- ✅ อัพเดทง่าย (แก้ที่ server ครั้งเดียว)
- ✅ รองรับหลายสาขา

### ข้อเสีย:
- ❌ ต้องมี internet
- ❌ ต้องมี server (ค่าใช้จ่าย)
- ❌ ช้ากว่า (ขึ้นกับ network)
- ❌ ซับซ้อนกว่า

---

## สิ่งที่ต้องรู้

### 1. Backend Development

#### Node.js + Express (แนะนำ)
```javascript
// ความรู้ที่ต้องมี:
- Express.js framework
- REST API design
- Database (PostgreSQL/MySQL)
- Authentication (JWT)
- Error handling
- Logging
```

#### หรือ Backend อื่นๆ:
- **Python + FastAPI/Django**
- **PHP + Laravel**
- **Java + Spring Boot**
- **C# + ASP.NET Core**

### 2. Database

#### Central Database (Server)
```sql
-- ต้องรู้:
- SQL queries
- Database design
- Indexing
- Transactions
- Backup/Restore
```

**แนะนำ:**
- **PostgreSQL** - Open source, powerful
- **MySQL** - Popular, easy
- **SQL Server** - Enterprise

### 3. API Design

#### REST API Principles
```
GET    /api/products       - ดึงสินค้าทั้งหมด
GET    /api/products/:id   - ดึงสินค้า 1 รายการ
POST   /api/products       - สร้างสินค้าใหม่
PUT    /api/products/:id   - แก้ไขสินค้า
DELETE /api/products/:id   - ลบสินค้า

GET    /api/sync/products?since=2025-11-17  - Sync สินค้า
POST   /api/sync/transactions                - ส่ง transactions
```

### 4. Authentication & Security

```
- JWT (JSON Web Tokens)
- API Keys
- HTTPS/SSL
- Rate limiting
- Input validation
```

### 5. Network & Infrastructure

```
- Domain name
- SSL certificate
- Server hosting (AWS, GCP, Azure, DigitalOcean)
- Load balancing (ถ้ามีหลายสาขา)
- CDN (ถ้าต้องการ)
```

---

## สิ่งที่ต้องมี

### 1. Server (Backend API)

#### Option A: Cloud Server (แนะนำ)

**AWS EC2:**
```
- Instance: t3.small ($15-20/month)
- Storage: 50 GB SSD
- Bandwidth: 1 TB/month
- OS: Ubuntu 22.04 LTS
```

**DigitalOcean Droplet:**
```
- Droplet: Basic ($12/month)
- 2 GB RAM, 1 vCPU
- 50 GB SSD
- 2 TB bandwidth
```

**Google Cloud Platform:**
```
- Compute Engine: e2-small ($13/month)
- 2 GB RAM
- 10 GB storage
```

#### Option B: VPS (ถูกกว่า)
```
- Vultr: $6/month
- Linode: $5/month
- Contabo: $5/month
```

#### Option C: Serverless (ยืดหยุ่น)
```
- AWS Lambda + API Gateway
- Google Cloud Functions
- Azure Functions
- จ่ายตามการใช้งาน
```

### 2. Database

#### Option A: Managed Database (แนะนำ)
```
AWS RDS PostgreSQL:
- db.t3.micro: $15/month
- 20 GB storage
- Auto backup
- Auto scaling

DigitalOcean Managed Database:
- Basic: $15/month
- 1 GB RAM
- 10 GB storage
```

#### Option B: Self-hosted
```
- ติดตั้งบน server เดียวกัน
- ฟรี แต่ต้องดูแลเอง
- Backup manual
```

### 3. Domain & SSL

```
Domain name:
- .com: $10-15/year
- .co.th: $30/year

SSL Certificate:
- Let's Encrypt: ฟรี (แนะนำ)
- Cloudflare: ฟรี
- Paid SSL: $50-200/year
```

### 4. Development Tools

```
- Git (version control)
- Postman (API testing)
- Docker (containerization)
- PM2 (process manager)
- Nginx (web server)
```

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────┐
│           Central Server (Cloud)            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  API Server  │◄────►│    Database     │ │
│  │  (Node.js)   │      │  (PostgreSQL)   │ │
│  └──────┬───────┘      └─────────────────┘ │
│         │                                   │
│         │ REST API (HTTPS)                  │
└─────────┼───────────────────────────────────┘
          │
          │ Internet
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐
│POS-01 │   │POS-02 │
│       │   │       │
│ ┌───┐ │   │ ┌───┐ │
│ │DB │ │   │ │DB │ │  ← Local SQLite
│ └───┘ │   │ └───┘ │
└───────┘   └───────┘
```

### Data Flow

#### 1. Initial Sync (ครั้งแรก)
```
POS → GET /api/sync/all
    ← { products: [...], customers: [...], ... }
POS → Insert to local DB
```

#### 2. Incremental Sync (ครั้งต่อไป)
```
POS → GET /api/sync/products?since=2025-11-17T10:00:00Z
    ← { products: [only updated items] }
POS → Update local DB
```

#### 3. Upload Transactions
```
POS → POST /api/transactions
      { transactions: [...], items: [...] }
    ← { success: true, synced: 10 }
```

---

## API Design

### 1. Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "terminalId": "POS-01",
  "apiKey": "your-api-key"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

### 2. Sync Master Data

#### Get All Products
```http
GET /api/sync/products
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "uuid",
      "sku": "001",
      "name": "สินค้า A",
      "description": "...",
      "category": "หมวด A",
      "isActive": true,
      "prices": [
        { "level": 1, "price": 100 },
        { "level": 2, "price": 95 }
      ],
      "updatedAt": "2025-11-17T10:00:00Z"
    }
  ],
  "total": 28418,
  "page": 1,
  "pageSize": 100
}
```

#### Incremental Sync
```http
GET /api/sync/products?since=2025-11-17T10:00:00Z
Authorization: Bearer {token}

Response:
{
  "data": [
    // เฉพาะสินค้าที่แก้ไขหลัง 2025-11-17T10:00:00Z
  ],
  "total": 5,
  "lastSyncAt": "2025-11-17T15:30:00Z"
}
```

### 3. Upload Transactions

```http
POST /api/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactions": [
    {
      "id": "uuid",
      "transactionNumber": "POS-01-20251117-001",
      "customerId": "uuid",
      "totalAmount": 1000,
      "status": "COMPLETED",
      "createdAt": "2025-11-17T10:00:00Z",
      "items": [
        {
          "productId": "uuid",
          "quantity": 2,
          "unitPrice": 500,
          "totalPrice": 1000
        }
      ]
    }
  ]
}

Response:
{
  "success": true,
  "synced": 1,
  "failed": 0,
  "errors": []
}
```

### 4. Other Endpoints

```http
GET /api/sync/customers
GET /api/sync/employees
GET /api/sync/price-levels
GET /api/sync/categories

POST /api/sync/check
GET /api/health
GET /api/version
```

---

## Implementation

### Server Side (Node.js + Express)

#### 1. Project Setup

```bash
# สร้าง project
mkdir pos-api-server
cd pos-api-server
npm init -y

# ติดตั้ง dependencies
npm install express
npm install pg sequelize
npm install jsonwebtoken bcrypt
npm install cors helmet
npm install dotenv
npm install express-rate-limit
npm install winston

# Dev dependencies
npm install --save-dev typescript @types/node @types/express
npm install --save-dev nodemon ts-node
```

#### 2. Server Code

```typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { syncRouter } from './routes/sync';
import { transactionRouter } from './routes/transactions';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/sync', syncRouter);
app.use('/api/transactions', transactionRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 3. Sync Controller

```typescript
// src/controllers/syncController.ts
import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { Op } from 'sequelize';

export class SyncController {
  async syncProducts(req: Request, res: Response) {
    try {
      const { since, page = 1, pageSize = 100 } = req.query;
      
      // Build query
      const where: any = { isActive: true };
      if (since) {
        where.updatedAt = { [Op.gt]: new Date(since as string) };
      }
      
      // Get products
      const { rows, count } = await Product.findAndCountAll({
        where,
        limit: Number(pageSize),
        offset: (Number(page) - 1) * Number(pageSize),
        order: [['updatedAt', 'DESC']]
      });
      
      res.json({
        data: rows,
        total: count,
        page: Number(page),
        pageSize: Number(pageSize),
        lastSyncAt: new Date()
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  }
  
  async syncCustomers(req: Request, res: Response) {
    // Similar to syncProducts
  }
}
```

#### 4. Authentication Middleware

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  });
}
```

### Client Side (POS Application)

#### 1. Sync Service

```typescript
// src/services/SyncService.ts
import axios from 'axios';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';

export class SyncService {
  private apiUrl: string;
  private token: string | null = null;
  
  constructor() {
    this.apiUrl = process.env.API_BASE_URL || 'https://api.yourcompany.com';
  }
  
  async login(terminalId: string, apiKey: string): Promise<void> {
    const response = await axios.post(`${this.apiUrl}/api/auth/login`, {
      terminalId,
      apiKey
    });
    
    this.token = response.data.token;
    localStorage.setItem('sync_token', this.token);
  }
  
  async syncProducts(since?: Date): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    
    const params: any = { pageSize: 1000 };
    if (since) {
      params.since = since.toISOString();
    }
    
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      params.page = page;
      
      const response = await axios.get(`${this.apiUrl}/api/sync/products`, {
        headers: { Authorization: `Bearer ${this.token}` },
        params
      });
      
      const { data, total } = response.data;
      
      // Update local database
      for (const product of data) {
        await Product.upsert(product);
      }
      
      console.log(`Synced ${data.length} products (page ${page})`);
      
      hasMore = page * params.pageSize < total;
      page++;
    }
    
    // Save last sync time
    localStorage.setItem('last_sync_products', new Date().toISOString());
  }
  
  async syncCustomers(since?: Date): Promise<void> {
    // Similar to syncProducts
  }
  
  async syncAll(): Promise<void> {
    console.log('🔄 Starting full sync...');
    
    await this.syncProducts();
    await this.syncCustomers();
    // ... sync other data
    
    console.log('✅ Sync completed');
  }
  
  async uploadTransactions(): Promise<void> {
    // Get unsynced transactions
    const transactions = await Transaction.findAll({
      where: { synced: false },
      include: [TransactionItem]
    });
    
    if (transactions.length === 0) {
      console.log('No transactions to sync');
      return;
    }
    
    // Upload to server
    const response = await axios.post(
      `${this.apiUrl}/api/transactions`,
      { transactions },
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    
    // Mark as synced
    for (const transaction of transactions) {
      transaction.synced = true;
      await transaction.save();
    }
    
    console.log(`✅ Uploaded ${transactions.length} transactions`);
  }
}
```

#### 2. Auto Sync

```typescript
// src/main/sync-scheduler.ts
import * as schedule from 'node-schedule';
import { SyncService } from '../services/SyncService';

export function setupAutoSync() {
  const syncService = new SyncService();
  
  // Sync every 5 minutes
  schedule.scheduleJob('*/5 * * * *', async () => {
    try {
      const lastSync = localStorage.getItem('last_sync_products');
      const since = lastSync ? new Date(lastSync) : undefined;
      
      await syncService.syncProducts(since);
      await syncService.syncCustomers(since);
    } catch (error) {
      console.error('Auto sync failed:', error);
    }
  });
  
  // Upload transactions every 10 minutes
  schedule.scheduleJob('*/10 * * * *', async () => {
    try {
      await syncService.uploadTransactions();
    } catch (error) {
      console.error('Upload transactions failed:', error);
    }
  });
}
```

---

## Security

### 1. HTTPS/SSL

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.yourcompany.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourcompany.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. API Key Management

```typescript
// Generate API key for each terminal
const apiKey = crypto.randomBytes(32).toString('hex');

// Store in database
await Terminal.create({
  id: 'POS-01',
  apiKey: await bcrypt.hash(apiKey, 10),
  branchId: 'BRANCH-01'
});
```

### 3. Rate Limiting

```typescript
// Limit requests per terminal
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user.terminalId
});
```

---

## Performance

### 1. Pagination

```typescript
// Always use pagination
GET /api/sync/products?page=1&pageSize=100
```

### 2. Incremental Sync

```typescript
// Only sync changed data
GET /api/sync/products?since=2025-11-17T10:00:00Z
```

### 3. Compression

```typescript
// Enable gzip compression
import compression from 'compression';
app.use(compression());
```

### 4. Caching

```typescript
// Cache frequently accessed data
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes
```

### 5. Database Indexing

```sql
-- Index on updatedAt for incremental sync
CREATE INDEX idx_products_updated_at ON products(updated_at);
CREATE INDEX idx_customers_updated_at ON customers(updated_at);
```

---

## Error Handling

### 1. Retry Logic

```typescript
async function syncWithRetry(fn: () => Promise<void>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 2. Offline Mode

```typescript
// Queue sync requests when offline
if (!navigator.onLine) {
  queueSyncRequest(request);
  return;
}

// Process queue when back online
window.addEventListener('online', () => {
  processQueuedRequests();
});
```

---

## Testing

### 1. API Testing

```bash
# Test authentication
curl -X POST https://api.yourcompany.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"terminalId":"POS-01","apiKey":"your-key"}'

# Test sync
curl https://api.yourcompany.com/api/sync/products \
  -H "Authorization: Bearer {token}"
```

### 2. Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test 1000 requests, 10 concurrent
ab -n 1000 -c 10 https://api.yourcompany.com/api/sync/products
```

---

## ค่าใช้จ่ายประมาณการ

### Setup แบบประหยัด:
```
- VPS (Vultr): $6/month
- Database (self-hosted): $0
- Domain: $10/year
- SSL (Let's Encrypt): $0
────────────────────────
Total: ~$7/month
```

### Setup แบบมาตรฐาน:
```
- AWS EC2 t3.small: $15/month
- AWS RDS PostgreSQL: $15/month
- Domain: $10/year
- SSL (Let's Encrypt): $0
────────────────────────
Total: ~$31/month
```

### Setup แบบ Enterprise:
```
- AWS EC2 t3.medium: $30/month
- AWS RDS PostgreSQL: $50/month
- Load Balancer: $20/month
- CloudFront CDN: $10/month
- Domain: $10/year
────────────────────────
Total: ~$111/month
```

---

## Checklist

### ก่อนเริ่ม:
- [ ] เลือก hosting provider
- [ ] ซื้อ domain name
- [ ] ตั้งค่า SSL certificate
- [ ] เตรียม database schema
- [ ] ออกแบบ API endpoints
- [ ] วางแผน authentication

### Development:
- [ ] สร้าง API server
- [ ] ทดสอบ API endpoints
- [ ] สร้าง sync service (client)
- [ ] ทดสอบ sync
- [ ] Error handling
- [ ] Logging

### Production:
- [ ] Deploy server
- [ ] ตั้งค่า monitoring
- [ ] Backup database
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation

---

**เอกสารนี้สร้างโดย:** Kiro AI Assistant  
**วันที่:** 17 พฤศจิกายน 2025  
**เวอร์ชัน:** 1.0.0
