# File Reference — Personal Link Vault

## Project Structure

```
my-links/
├── FILE_REFERENCE.md          ← This file
├── README.md                  # Project overview, features, quick-start
├── architecture.md            # Deep architecture docs, schema, data flow
├── setup.md                   # Full setup guide (MySQL native, no Docker)
├── start.sh                   # Launches backend + web with nohup/disown
├── stop.sh                    # Kills backend + web via PID files
├── .gitignore                 # Git ignore rules
│
├── backend/                   # NestJS 15 API — port 4000
│   ├── .env                   # DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
│   ├── package.json           # Dependencies: NestJS, Prisma, Passport, bcryptjs, Helmet
│   ├── tsconfig.json          # ES2021, CommonJS, decorator metadata
│   ├── nest-cli.json          # NestJS CLI config
│   │
│   ├── prisma/
│   │   ├── schema.prisma      # 8 models: User, Collection, Link, Tag, LinkTag, Favorite, ActivityLog, Settings
│   │   └── migrations/        # MySQL migration history
│   │
│   └── src/
│       ├── main.ts            # App bootstrap: CORS, Helmet, ValidationPipe, port 4000
│       ├── app.module.ts      # Root module: ThrottlerGuard (100 req/min), imports all modules
│       ├── prisma.service.ts  # PrismaClient singleton with connect/disconnect lifecycle
│       ├── prisma.module.ts   # Global Prisma module (injectable everywhere)
│       │
│       ├── auth/
│       │   ├── auth.module.ts       # JWT + Passport setup with env-based secret/expiry
│       │   ├── auth.controller.ts   # POST /register, POST /login, GET /me
│       │   ├── auth.service.ts      # Register (bcrypt 12 rounds + default collections), login, profile
│       │   ├── auth.dto.ts          # RegisterDto (email + password min 6), LoginDto
│       │   └── jwt.strategy.ts      # Passport JWT strategy, validates user exists in DB
│       │
│       ├── links/
│       │   ├── links.module.ts
│       │   ├── links.controller.ts  # CRUD + bulk delete + bulk move
│       │   ├── links.service.ts      # Create (with duplicate detection), list (search/sort/paginate), update, delete, bulk ops
│       │   └── links.dto.ts         # CreateLinkDto, UpdateLinkDto, QueryLinksDto, BulkActionDto
│       │
│       ├── collections/
│       │   ├── collections.module.ts
│       │   ├── collections.controller.ts  # CRUD + reorder
│       │   ├── collections.service.ts      # Create (unique name per user), list with count, update, delete (moves links to Learning), reorder
│       │   └── collections.dto.ts          # CreateCollectionDto, UpdateCollectionDto, ReorderDto
│       │
│       ├── favorites/
│       │   ├── favorites.module.ts
│       │   ├── favorites.controller.ts  # Toggle, list all, remove
│       │   ├── favorites.service.ts     # Toggle (create or delete), list with link details, remove
│       │
│       ├── search/
│       │   ├── search.module.ts
│       │   ├── search.controller.ts     # GET /search?q=&collectionId=&tag=&favorites=&dateFrom=&dateTo=
│       │   └── search.service.ts        # Full-text search: title, url, description, notes, collection name, tags
│       │
│       └── import-export/
│           ├── import-export.module.ts
│           ├── import-export.controller.ts  # GET /export (JSON download), POST /import (upsert)
│           └── import-export.service.ts     # Export all user data, import with upsert + skip duplicates
│
├── web/                        # Next.js 15 Dashboard — port 3000
│   ├── .env.local              # NEXT_PUBLIC_API_URL=http://localhost:4000
│   ├── package.json            # Next.js 15, React 18, TanStack Query, Zustand, Tailwind, Radix UI, Zod
│   ├── tsconfig.json           # ES5 target, bundler module resolution
│   ├── next.config.js          # Standalone output, remote images (wildcard)
│   ├── tailwind.config.ts      # Tailwind config with dark mode, custom keyframes, sidebar colors
│   ├── postcss.config.js       # PostCSS + Tailwind + Autoprefixer
│   └── src/
│       ├── app/
│       │   ├── layout.tsx              # Root layout: Inter font, Providers wrapper
│       │   ├── page.tsx                # Root page → redirect to /login
│       │   ├── providers.tsx           # TanStack QueryClientProvider (stale 30s, retry 1)
│       │   │
│       │   ├── login/
│       │   │   └── page.tsx            # Login/register form with tabs, calls useAuth hook
│       │   │
│       │   └── (dashboard)/
│       │       ├── layout.tsx          # Dashboard layout: Sidebar + auth guard (redirect if no token)
│       │       ├── dashboard/
│       │       │   └── page.tsx        # Stats overview using StatsCards component
│       │       ├── links/
│       │       │   └── page.tsx        # All links: search, collection filter, sort, pagination, bulk actions, import/export
│       │       ├── favorites/
│       │       │   └── page.tsx        # Starred links list using useFavorites hook
│       │       ├── recent/
│       │       │   └── page.tsx        # Recently opened links (sorted by lastOpenedAt desc)
│       │       ├── collections/
│       │       │   └── [id]/
│       │       │       └── page.tsx    # Collection detail page with link count
│       │       ├── settings/
│       │       │   └── page.tsx        # Theme toggle (light/dark/system), JSON import/export, logout
│       │       └── help/
│       │           └── page.tsx        # Help docs: 12 sections covering all features
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── sidebar.tsx         # Navigation: dashboard, links, favorites, recent. Collapsible collections with inline edit/delete/create
│       │   │   └── search-bar.tsx      # Cmd+K command palette: debounced search, keyboard navigation, opens links in new tab
│       │   │
│       │   ├── links/
│       │   │   └── link-card.tsx       # Link card: favicon, title, URL, collection badge, tags, favorite/delete/edit, inline edit dialog
│       │   │
│       │   ├── collections/
│       │   │   └── create-collection-dialog.tsx  # Dialog with name input + color picker
│       │   │
│       │   ├── dashboard/
│       │   │   └── stats-cards.tsx     # 4 stat cards: total links, collections, favorites, saved this week
│       │   │
│       │   └── ui/                     # ShadCN UI primitives
│       │       ├── button.tsx          # Button with variants: default, destructive, outline, secondary, ghost, link
│       │       ├── input.tsx           # Styled input with focus ring
│       │       ├── badge.tsx           # Badge with variants: default, secondary, destructive, outline, tag
│       │       ├── dialog.tsx          # Modal dialog with overlay, content, header, footer, title, description
│       │       └── select.tsx          # Select dropdown with trigger, content, items
│       │
│       ├── lib/
│       │   ├── api.ts                 # Typed API client: JWT management, all CRUD/search/import-export endpoints
│       │   ├── hooks.ts               # React Query hooks: useAuth, useLinks, useCollections, useFavorites, useSearch, mutations
│       │   ├── store.ts               # Zustand store: theme (light/dark/system) with localStorage persistence
│       │   └── utils.ts               # Utilities: cn() Tailwind merge, formatDate, timeAgo, getFaviconUrl
│       │
│       ├── types/
│       │   └── index.ts               # TypeScript interfaces: Collection, Link, LinksResponse, SearchResult, ExportData
│       │
│       └── styles/
│           └── globals.css            # Tailwind directives + CSS variables for light/dark themes + sidebar colors
│
└── extension/                  # Chrome Extension (Manifest V3)
    ├── package.json            # TypeScript build with Chrome types
    ├── tsconfig.json           # ES2020, Node16 modules with .js extensions
    │
    ├── public/
    │   ├── manifest.json       # MV3: permissions (tabs, storage, contextMenus, commands, notifications), keyboard shortcuts
    │   ├── popup.html          # Popup HTML with minimal CSS, mounts JS via module script
    │   └── icon-*.svg          # 16/48/128px icons
    │
    └── src/
        ├── background.ts       # Service worker: context menus (save page/link/all-tabs/save-to-X), keyboard shortcuts, notifications
        ├── popup.ts            # Popup logic: login form → save form, collection selection, tags, notes
        ├── utils/
        │   └── api.ts          # Extension API client: getToken, getCollections, saveLink, login, getPageMetadata, saveAllTabs
        └── types/
            └── index.ts        # Extension types: Collection, SavePayload, StorageData
```

## Layer Breakdown

### Root Scripts

| File | What it does |
|------|-------------|
| `start.sh` | Checks MySQL is running, creates DB if needed, starts backend (`nohup npm run start:prod`) and web (`nohup npm start`), writes PID files to `/tmp/` |
| `stop.sh` | Reads PID files, kills processes, falls back to `pkill` for leftovers |

### Backend Modules

| Module | Routes | Purpose |
|--------|--------|---------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | JWT auth, bcrypt 12 rounds, auto-creates default collections & settings on register |
| **Links** | `GET/POST /api/links`, `GET/PUT/DELETE /api/links/:id`, `POST /api/links/bulk/delete`, `POST /api/links/bulk/move` | Full CRUD, duplicate URL detection, pagination, search, sort by newest/oldest/alphabetical/most_opened/recently_opened |
| **Collections** | `GET/POST /api/collections`, `PUT/DELETE /api/collections/:id`, `PUT /api/collections/reorder` | CRUD with unique name per user, delete moves links to Learning, reorder via index array |
| **Favorites** | `POST /api/favorites/:linkId`, `GET /api/favorites`, `DELETE /api/favorites/:linkId` | Toggle favorite, list with full link details |
| **Search** | `GET /api/search` | Full-text search across title, url, description, notes, collection name, tags. Filters: collectionId, tag, favorites, dateRange |
| **Import/Export** | `GET /api/export`, `POST /api/import` | JSON export with all user data. Import with upsert + duplicate URL skipping |

### Database Schema (Prisma — MySQL)

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| `User` | id, email (unique), passwordHash | → collections, links, favorites, activityLogs, settings |
| `Collection` | id, userId (FK), name, color, order | → User, → links |
| `Link` | id, userId (FK), collectionId (FK), title, url (Text), description, notes, openCount | → User, → Collection, → tags (M:N via LinkTag), → favorites |
| `Tag` | id, name (unique) | → links (M:N via LinkTag) |
| `LinkTag` | linkId (FK), tagId (FK) | Composite PK |
| `Favorite` | id, userId (FK), linkId (FK) | Unique (userId, linkId) |
| `ActivityLog` | id, userId (FK), action, entityType, entityId, metadata (JSON) | Temporal index on (userId, createdAt) |
| `Settings` | id, userId (FK, unique), theme, preferences (JSON) | One-to-one with User |

### Web Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | `LoginPage` | Login/register tabs, validates with Zod |
| `/dashboard` | `DashboardPage` → `StatsCards` | Overview of total links, collections, favorites |
| `/links` | `LinksPage` → `LinkCard` | Full link management: search, filter, sort, paginate, bulk delete/move, import/export JSON |
| `/favorites` | `FavoritesPage` → `LinkCard` | Starred links only |
| `/recent` | `RecentPage` → `LinkCard` | Links sorted by lastOpenedAt |
| `/collections/[id]` | `CollectionPage` → `LinkCard` | Links filtered by collection |
| `/settings` | `SettingsPage` | Theme toggle, JSON import/export, logout |
| `/help` | `HelpPage` | 12-section help documentation |

### Chrome Extension Flow

```
Popup opens → checks chrome.storage for token
  ├─ No token → shows login form
  └─ Has token → fetches collections → shows save form
                  ├─ Title (auto-filled from page metadata)
                  ├─ URL (auto-filled)
                  ├─ Collection dropdown
                  ├─ Tags (comma-separated)
                  ├─ Notes
                  └─ Save → POST /api/links → close

Context menu (right-click):
  ├─ "Save Current Page to LinkSaver"
  │   └─ Submenu: Save to Learning/Work/AI/Personal
  ├─ "Save This Link to LinkSaver"
  └─ "Save All Tabs to LinkSaver"

Keyboard shortcuts:
  Ctrl+Shift+L → Save to Learning
  Ctrl+Shift+W → Save to Work
  Ctrl+Shift+A → Save to AI
  Ctrl+Shift+P → Save to Personal
```

### Changes Made During Audit

| File | Change | Reason |
|------|--------|--------|
| `backend/src/links/links.service.ts:55-58` | Removed `mode: 'insensitive'` from findAll | MySQL doesn't support Prisma's `mode` arg on `contains` (case-insensitive by default with utf8mb4_unicode_ci) |
| `extension/src/utils/api.ts:65-88` | Fixed `saveAllTabs` callback shadowing bug | `chrome.tabs.query` was using the resolve function name as the tab list |
| `backend/src/common/` | Removed empty directory | Dead scaffolding (decorators, filters, guards, interceptors — all empty) |
| `web/src/components/search/` | Removed empty directory | Dead scaffolding |
| `web/src/hooks/` | Removed empty directory | Dead scaffolding |
| `web/src/components/layout/navbar.tsx` | Removed dead component | Defined but never imported anywhere |
