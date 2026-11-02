# RD Jeans Factory Management System - Deployment & Maintenance Runbook

## 1. Environment Configurations & Secrets Matrix

All runtime configuration parameters are read from environment variables. In local development, Next.js loads `.env.local`; in production, variables must be configured in your hosting platform or system environment.

| Variable Name | Required | Default / Example Value | Purpose & Architectural Context |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:PASSWORD@localhost:5432/rd_jeans_factory` | PostgreSQL connection string passed to `pg.Pool` (`lib/db.ts`). |
| `NEXT_PUBLIC_API_URL` | No | *(Empty defaults to relative `/api`)* | Exposes custom backend API base address if operating in decoupled mode. |
| `SECRET_KEY` | **Yes** | *(64-character hex string)* | HMAC-SHA256 signature key for signing and verifying JWT authentication tokens. |
| `JWT_SECRET` | No | *(Mirrors `SECRET_KEY`)* | Backward-compatible alias for token signing key. |
| `ALGORITHM` | No | `HS256` | JWT cryptographic signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Duration (in minutes) before a issued JWT access token expires. |
| `NODE_ENV` | No | `production` | Enables React production mode and optimized Next.js server builds. |

> [!CAUTION]
> Never commit actual database passwords or production `SECRET_KEY` values to version control. Always maintain `.env.example` with blank placeholders.

---

## 2. Deployment Architecture Options

```mermaid
graph TD
    subgraph "Deployment Option A: Serverless Cloud (Vercel + Neon/Supabase)"
        A1[Client Browsers / Mobile Devices] -->|HTTPS| B1[Vercel Global Edge Network]
        B1 -->|Next.js Serverless Functions| C1[Next.js App Router API Handlers]
        C1 -->|SSL Connection Pooler| D1[(Neon / Supabase Cloud PostgreSQL)]
    end

    subgraph "Deployment Option B: Dedicated VPS / On-Premise (Docker + Linux)"
        A2[Client Browsers / Mobile Devices] -->|HTTPS / Port 443| B2[Nginx Reverse Proxy + Let's Encrypt SSL]
        B2 -->|HTTP Proxy Pass / Port 3000| C2[Docker Container: Next.js Standalone Server]
        C2 -->|Internal Docker Bridge / Port 5432| D2[(PostgreSQL 16 Docker Container)]
        E2[Host Cron Job] -->|Nightly pg_dump| F2[(Local Encrypted Backup Storage)]
    end
```

---

## 3. Option A: Serverless Deployment (Vercel + Managed Postgres)

1. **Database Provisioning**:
   * Create a PostgreSQL database on a managed provider (e.g. Neon, Supabase, Railway, Aiven).
   * Note the connection pooling URL (usually on port `6543` for transaction mode or with `?sslmode=require`).
   * Execute the initialization script from [docs/06-database-design.md](file:///d:/Akshay%20RD%20jeans/docs/06-database-design.md) in the provider's SQL console.
2. **Deploy to Vercel**:
   * Connect your GitHub repository to Vercel.
   * Add Environment Variables in Project Settings:
     * `DATABASE_URL`: Your cloud pooled connection string.
     * `SECRET_KEY`: Generate a random 256-bit string (`openssl rand -hex 32`).
     * `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440` (24 hours recommended for factory sessions).
   * Click **Deploy**.

---

## 4. Option B: Self-Hosted Deployment (Linux VPS / Docker)

### 4.1 Production Dockerfile (`Dockerfile`)
```dockerfile
# Stage 1: Dependency resolution
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Production compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# Stage 3: Minimal runtime execution
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 4.2 Docker Compose Configuration (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: rd_jeans_db
    restart: always
    environment:
      POSTGRES_DB: rd_jeans_factory
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: YOUR_SECURE_PASSWORD
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "127.0.0.1:5432:5432"

  app:
    build: .
    container_name: rd_jeans_app
    restart: always
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:YOUR_SECURE_PASSWORD@db:5432/rd_jeans_factory
      SECRET_KEY: YOUR_GENERATED_SECRET_KEY
      ACCESS_TOKEN_EXPIRE_MINUTES: 1440
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

### 4.3 Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name erp.rdjeans.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.rdjeans.com;

    ssl_certificate /etc/letsencrypt/live/erp.rdjeans.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.rdjeans.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Maintenance, Health Checks & Operational Runbook

### 5.1 Health Check Verification
* **Endpoint**: `GET /api/health`
* **Response**:
  ```json
  {
    "status": "healthy",
    "database": "connected"
  }
  ```
* Automated monitors (e.g. UptimeRobot or BetterStack) should query this endpoint every 5 minutes.

### 5.2 Automated Nightly Database Backups
Create a backup shell script `/usr/local/bin/backup_rd_jeans.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/rd_jeans"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

docker exec -t rd_jeans_db pg_dump -U postgres -F c rd_jeans_factory > "$BACKUP_DIR/rd_jeans_$TIMESTAMP.dump"

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +30 -delete
```
Add to root crontab (`crontab -e`):
```cron
0 2 * * * /usr/local/bin/backup_rd_jeans.sh
```

### 5.3 Database Disaster Recovery Procedure
To restore from a backup file:
```bash
# 1. Stop web application to prevent concurrent writes
docker stop rd_jeans_app

# 2. Drop existing schema and restore from backup file
docker exec -i rd_jeans_db pg_restore -U postgres -d rd_jeans_factory --clean --if-exists < /var/backups/rd_jeans/rd_jeans_20261025.dump

# 3. Restart web application
docker start rd_jeans_app
```
