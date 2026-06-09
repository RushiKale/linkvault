# Deployment Configuration

## Single flag to switch between local and deployed

### Backend (Spring Boot)

Set `SPRING_PROFILES_ACTIVE=production` to load `application-production.yml`.

| Env var | Default (local) | Required for production |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | _(not set)_ | `production` |
| `DB_URL` | `jdbc:mysql://localhost:3306/linkvault?...` | ✅ |
| `DB_USER` | `root` | ✅ |
| `DB_PASS` | `root` | ✅ |
| `JWT_SECRET` | `linksaver-jwt-secret-key-...` | ✅ (change for security) |
| `CORS_ORIGINS` | `http://localhost:2000,...` | ✅ |
| `PORT` | `8080` | as needed |

### Frontend (React + Vite)

Uses Vite `.env` / `.env.production` files.

| Env var | Default (`.env`) | `.env.production` |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | set to deployed backend URL |

Build for production:
```bash
cd V2/react-frontend
VITE_API_URL=https://your-app.railway.app/api npm run build
```

### Extension (Chrome)

Set `API_URL` env var before building:

```bash
cd V2/extension-v2
API_URL=https://your-app.railway.app/api DASHBOARD_URL=https://your-frontend.vercel.app npm run build
```

| Env var | Default |
|---|---|
| `API_URL` | `http://localhost:8080/api` |
| `DASHBOARD_URL` | derived from `API_URL` (strip `/api`) |
