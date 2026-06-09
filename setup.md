# Personal Link Vault — Setup Guide

## Prerequisites

- **Node.js** >= 20
- **MySQL** >= 8 (running on port 3306)
- **Chrome/Edge** browser (for extension)
- **npm** >= 10

---

## Quick Start

```bash
bash start.sh
```

This starts:
- **Backend API** on port `4000`
- **Web Dashboard** on port `3000`

MySQL must be running locally. The script checks and ensures the `linkvault` database exists.

**Web App**: http://localhost:3000  
**API**: http://localhost:4000

Stop all services:

```bash
bash stop.sh
```

---

## Manual Setup

### 1. Database

Ensure MySQL 8+ is running on port 3306:

```bash
# Check if MySQL is running
mysqladmin ping -u root -p

# Create the database (if not exists)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS linkvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

### 2. Backend API

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to inspect data
npx prisma studio

# Start development server (watch mode)
npm run start:dev
```

Server starts at **http://localhost:4000**.

Available scripts:

| Command | Description |
|---|---|
| `npm run start:dev` | Start with hot-reload |
| `npm run build` | Compile to dist/ |
| `npm run start:prod` | Run compiled version |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run development migrations |
| `npm run prisma:push` | Push schema to DB |

### 3. Web Dashboard

Open a new terminal:

```bash
cd web

# Install dependencies
npm install

# Build production assets
npm run build

# Start production server
npm start
```

Dashboard starts at **http://localhost:3000**.

Available scripts:

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |

### 4. Chrome Extension

Build and load the extension:

```bash
cd extension

# Install dependencies
npm install

# Build the extension
npm run build
```

Load in Chrome:
1. Open **chrome://extensions**
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder
5. The LinkSaver icon appears in your toolbar

To rebuild after changes:

```bash
npm run build
```

Then click the refresh icon on the extension card in `chrome://extensions`.

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=mysql://root:root@localhost:3306/linkvault
JWT_SECRET=change-this-to-a-random-string
JWT_EXPIRATION=7d
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### Web (`web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **Note**: If deploying on a server, replace `localhost` with your server's domain/IP.

---

## First-Time Usage

1. Open **http://localhost:3000**
2. Click **Register** and create an account
3. Default collections are auto-created: Learning, Work, AI, Personal
4. Install the Chrome Extension and log in with the same credentials
5. Browse any website and click the extension icon to save

---

## Deployment

### Single Server (VPS / DigitalOcean / AWS EC2)

```bash
# Clone the repo
git clone <repo-url> my-links
cd my-links

# Install MySQL if not present
sudo apt install mysql-server  # Ubuntu/Debian
# brew install mysql           # macOS

# Start everything
bash start.sh
```

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `CORS_ORIGIN` to your actual web app domain
- [ ] Set up SSL/TLS (e.g., Let's Encrypt + NGINX)
- [ ] Configure proper `DATABASE_URL` with credentials
- [ ] Set `NODE_ENV=production` on backend

### Using a Reverse Proxy (NGINX)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Backup & Restore

### MySQL Backup

```bash
# Backup
mysqldump -u root -p linkvault > linkvault-backup.sql

# Restore
mysql -u root -p linkvault < linkvault-backup.sql
```

### Data Export (from dashboard)

Go to **Settings → Export Data** to download a JSON file with all your links. Import the same file to restore.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ECONNREFUSED` on database | Ensure MySQL is running. Check `DATABASE_URL`. |
| `PrismaClientInitializationError` | Run `npx prisma generate` and `npx prisma migrate dev`. |
| Extension says "Not authenticated" | Log in via the web app first, then in the extension popup. |
| Extension not saving | Check that the API is running at `http://localhost:4000`. |
| CORS errors | Ensure `CORS_ORIGIN` in backend `.env` matches your web URL. |
| `next: command not found` | Run `npm install` inside the `web/` directory. |
| Port already in use | Change `PORT` in backend `.env` or kill the existing process. |
