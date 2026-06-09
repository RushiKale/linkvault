# Personal Link Vault — Architecture

## Overview

Personal Link Vault is a three-tier application with a Chrome Extension client. It follows a modular monolith backend pattern designed for future multi-service extraction (Teams integration, AI, notifications, mobile).

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Chrome Extension                   │
│            (Manifest V3, TypeScript)                  │
│  Popup UI  │  Context Menus  │  Keyboard Shortcuts   │
└──────────────────────┬──────────────────────────────┘
                       │  HTTP/REST (JWT Bearer)
                       ▼
┌──────────────────────────────────────────────────────┐
│              Next.js Web Dashboard                    │
│  (React 18, Tailwind CSS, ShadCN UI, TanStack Query) │
│                                                       │
│  Pages: Dashboard │ Links │ Favorites │ Recent        │
│         Collections │ Settings │ Help                 │
│                                                       │
│  Components: Sidebar │ SearchBar │ LinkCard │ Stats   │
└──────────────────────┬───────────────────────────────┘
                       │  HTTP/REST (JWT Bearer)
                       ▼
┌──────────────────────────────────────────────────────┐
│              NestJS Backend API                       │
│  (Express, TypeScript, Passport, Helmet, Throttler)   │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Auth   │ │  Links   │ │Collections│ │Favorites │ │
│  │ Module   │ │ Module   │ │  Module   │ │ Module   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │  Search  │ │Import/Exp│ │   Activity Log        │  │
│  │  Module  │ │  Module  │ │   Module              │  │
│  └──────────┘ └──────────┘ └──────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │  Prisma ORM
                       ▼
┌──────────────────────────────────────────────────────┐
│              MySQL Database                           │
│                                                       │
│  Tables: users │ collections │ links │ tags           │
│          link_tags │ favorites │ activity_logs        │
│          settings                                     │
└──────────────────────────────────────────────────────┘
```

## Database Schema

```
users
├── id (PK)
├── email (unique)
├── password_hash
├── created_at
└── updated_at

collections
├── id (PK)
├── user_id (FK → users)
├── name (unique per user)
├── color
├── order
├── created_at
└── updated_at

links
├── id (PK)
├── user_id (FK → users)
├── collection_id (FK → collections)
├── title
├── url
├── description (nullable)
├── favicon_url (nullable)
├── image_url (nullable)
├── notes (nullable)
├── open_count
├── last_opened_at (nullable)
├── created_at
└── updated_at

tags
├── id (PK)
└── name (unique)

link_tags (junction)
├── link_id (FK → links)
└── tag_id (FK → tags)

favorites
├── id (PK)
├── user_id (FK → users)
├── link_id (FK → links)
└── created_at

activity_logs
├── id (PK)
├── user_id (FK → users)
├── action
├── entity_type
├── entity_id
├── metadata (JSON, nullable)
└── created_at

settings
├── id (PK)
├── user_id (FK → users, unique)
├── theme
├── preferences (JSON, nullable)
├── created_at
└── updated_at
```

## Project Structure

```
my-links/
├── backend/                    # NestJS API (port 4000)
│   ├── prisma/
│   │   └── schema.prisma       # Database schema & relations
│   ├── src/
│   │   ├── main.ts             # App bootstrap (CORS, Helmet, ValidationPipe)
│   │   ├── app.module.ts       # Root module with ThrottlerGuard
│   │   ├── prisma.service.ts   # Prisma client lifecycle
│   │   ├── auth/               # JWT register/login, Passport strategy
│   │   ├── links/              # CRUD, bulk operations, duplicate detection
│   │   ├── collections/        # CRUD, reorder, cascade delete
│   │   ├── favorites/          # Toggle, list with link details
│   │   ├── search/             # Full-text search across all fields
│   │   └── import-export/      # JSON export (download) / import (upsert)
│   ├── package.json
│   └── tsconfig.json
│
├── web/                        # Next.js 15 Dashboard (port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout + font
│   │   │   ├── providers.tsx   # QueryClient provider
│   │   │   ├── login/          # Auth page (login/register)
│   │   │   └── (dashboard)/    # Authenticated routes
│   │   │       ├── layout.tsx  # Sidebar + auth guard
│   │   │       ├── dashboard/  # Stats overview
│   │   │       ├── links/      # All links + search + bulk + import/export
│   │   │       ├── favorites/  # Starred links
│   │   │       ├── recent/     # Recently opened
│   │   │       ├── collections/[id]/  # Collection detail
│   │   │       ├── settings/   # Theme, import/export, logout
│   │   │       └── help/       # Full documentation
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, SearchBar (Cmd+K), Navbar
│   │   │   ├── links/          # LinkCard (edit, delete, favorite, open)
│   │   │   ├── collections/    # CreateCollectionDialog
│   │   │   ├── dashboard/      # StatsCards
│   │   │   └── ui/             # Button, Input, Badge, Dialog, Select
│   │   ├── lib/
│   │   │   ├── api.ts          # Typed API client with JWT
│   │   │   ├── hooks.ts        # React Query hooks (useLinks, useAuth, etc.)
│   │   │   ├── store.ts        # Zustand theme store
│   │   │   └── utils.ts        # cn(), formatDate(), timeAgo()
│   │   ├── types/index.ts      # Shared TypeScript interfaces
│   │   └── styles/globals.css  # Tailwind + CSS variables (light/dark)
│   ├── package.json
│   └── tailwind.config.ts
│
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── public/
│   │   ├── manifest.json       # Permissions, commands, icons
│   │   ├── popup.html          # Save form UI
│   │   └── icon-*.svg          # App icons
│   ├── src/
│   │   ├── popup/popup.ts      # Login + save form logic
│   │   ├── background/background.ts  # Context menus, keyboard shortcuts, notifications
│   │   ├── utils/api.ts        # API client, metadata extraction
│   │   └── types/index.ts      # Extension types
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
├── architecture.md
├── setup.md
└── README.md
```

## Data Flow

### Save a Link (Extension)
```
User clicks extension icon
  → Popup opens with current page metadata
  → User selects collection, adds tags/notes
  → POST /api/links (JWT)
  → Prisma writes to `links`, `link_tags`, `activity_logs`
  → Response returned to popup
  → "Saved" notification shown
```

### Search (Dashboard)
```
User presses Cmd+K
  → SearchBar overlay opens
  → User types query
  → debounced GET /api/search?q=...
  → Backend searches across title, url, description, notes,
    collection name, and tags (case-insensitive via utf8mb4_unicode_ci)
  → Results displayed with keyboard navigation
  → Enter opens URL in new tab
```

### Import/Export
```
Export:
  → GET /api/export
  → Returns JSON with all links, collections, tags
  → Browser downloads file

Import:
  → User selects JSON file
  → POST /api/import with parsed JSON
  → Backend upserts collections, skips duplicate URLs
  → Returns imported/skipped/errors count
```

## Design Decisions for Future Expansion

| Future Feature | Architectural Support |
|---|---|
| Multi-user | User isolation via `user_id` FK on all tables. Add roles/permissions tables. |
| Shared Collections | Add `shared_collections` join table with permission levels. |
| Teams Integration | Add `teams` module with Microsoft Graph API client. Activity log already tracks all actions for sync. |
| AI Features | `activity_logs.metadata` JSON field can store AI summaries. Add async job queue. |
| Notifications | Activity log is the event source. Add `notifications` table + WebSocket gateway. |
| Mobile App | REST API is already fully decoupled. Add mobile client. |
| WebSocket / Real-time | NestJS supports WebSocket gateways natively. |

## Security

- JWT tokens (7-day expiry, configurable)
- Passwords hashed with bcrypt (12 rounds)
- Helmet middleware for HTTP headers
- CORS restricted to web origin
- Rate limiting (100 req/min via ThrottlerModule)
- Input validation + whitelist via class-validator
- All URLs validated before storage
- Links open with `noopener noreferrer`
