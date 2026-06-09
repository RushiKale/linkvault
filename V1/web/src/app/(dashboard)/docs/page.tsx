'use client';

import {
  FileText,
  Code2,
  Server,
  Box,
  Database,
  Shield,
  Workflow,
  Globe,
  Cpu,
  Braces,
  GitBranch,
  Users,
} from 'lucide-react';

const sections = [
  {
    icon: Code2,
    title: 'Tech Stack & Why',
    content: `Backend — NestJS 10
Why NestJS over Express? NestJS provides a structured, opinionated framework with dependency injection, guards, pipes, interceptors, and modules out of the box. For a multi-module app like LinkSaver (auth, links, collections, tags, favorites, search, import/export), the modular architecture keeps concerns separated. Express would require manual wiring of the same patterns.

ORM — Prisma 5
Why Prisma over TypeORM or raw SQL? Prisma generates fully type-safe client code from the schema. Auto-completion in the editor catches query errors at compile time. Migrations are declarative and reversible. For MySQL specifically, Prisma handles the quirks (text types, indexes, collation) transparently.

Database — MySQL 8
Why MySQL over PostgreSQL or SQLite? MySQL 8 with utf8mb4_unicode_ci collation provides case-insensitive text comparison by default — ideal for search. Native JSON column support for flexible metadata. Widely available, simple setup, no external dependencies.

Frontend — Next.js 15 (App Router)
Why Next.js over CRA or Vite? App Router provides file-based routing with server components, reducing client-side JavaScript. Built-in API route proxying, image optimization, and CSS support. For a dashboard app with many pages, the framework handles code-splitting and lazy-loading automatically.

State Management — TanStack Query v5
Why TanStack Query over Redux or Zustand? TanStack Query is purpose-built for server state — caching, background refetching, optimistic updates, and pagination. For LinkSaver, most state is fetched from the API (links, collections, tags). TanStack Query eliminates boilerplate that Redux requires for async operations.

Styling — Tailwind CSS
Utility-first CSS. Faster iteration than writing custom CSS. Consistent design tokens (colors, spacing, fonts). Small bundle size with purging unused styles.

Chrome Extension — Manifest V3, Vanilla TypeScript
Why vanilla TS instead of React for the extension? The popup is a single-page form — bundling React would add ~40KB for minimal benefit. Vanilla DOM manipulation keeps the popup under 100KB total. Manifest V3 is the latest extension platform with service workers, promises, and improved security.

Icons — Lucide React
Lightweight, consistent icon set. Tree-shakeable — only used icons are bundled.`,
  },
  {
    icon: Server,
    title: 'Architecture Overview',
    content: `LinkSaver follows a three-tier architecture:

Client Layer:
  • Chrome Extension (popup, search page, context menus) — saves links from anywhere
  • Web Dashboard (Next.js 15) — full management UI
  Both communicate with the server via REST API over HTTP.

Server Layer:
  • NestJS API server running on port 2001
  • All business logic, auth, validation
  • JWT-based authentication with bcrypt password hashing
  • Rate limiting, Helmet security headers, CORS

Data Layer:
  • MySQL 8 database on port 3306
  • Prisma ORM for type-safe queries and migrations
  • utf8mb4_unicode_ci collation for case-insensitive search`,
  },
  {
    icon: Box,
    title: 'Project Structure',
    content: `my-links/
├── backend/              # NestJS API (port 2001)
│   ├── prisma/           # Schema definition & migrations
│   │   └── schema.prisma
│   ├── src/
│   │   ├── auth/         # Login, register, JWT strategy, profile
│   │   ├── links/        # CRUD, bulk operations, scoped queries
│   │   ├── collections/  # CRUD with locked system collections
│   │   ├── tags/         # Tag listing with autocomplete
│   │   ├── favorites/    # Toggle and list favorites
│   │   ├── import-export/ # JSON import & export
│   │   ├── prisma.service.ts  # Shared Prisma client
│   │   └── http-exception.filter.ts  # Global error sanitization
│   ├── .env              # DB connection, JWT secret, port config
│   └── reset-password.sh # CLI tool for password resets
│
├── web/                  # Next.js dashboard (port 2000)
│   ├── src/
│   │   ├── app/          # Pages (login, dashboard, links, etc.)
│   │   ├── components/   # UI kit + feature components
│   │   ├── lib/          # API client, hooks, toast, utils
│   │   └── styles/       # Global CSS with Tailwind
│   └── .env.local        # API URL config
│
├── extension/            # Chrome Extension
│   ├── src/              # TypeScript source (popup, search, bg)
│   ├── public/           # HTML, manifest.json, icons (PNG)
│   └── dist/             # Built output (tsc + copy)
│
├── start.sh              # Start all services
├── stop.sh               # Stop all services
├── teams.md              # Team feature implementation plan
└── FILE_REFERENCE.md     # Per-file documentation reference`,
  },
  {
    icon: Cpu,
    title: 'How the Extension Was Built',
    content: `The Chrome Extension is a vanilla TypeScript project with no framework. It compiles with tsc and copies static assets to dist/.

Manifest V3:
  • Single background service worker (background.ts)
  • Popup window (popup.html + popup.ts)
  • Standalone search page (search.html + search.ts)
  • Keyboard shortcut: Ctrl+Shift+K opens search page
  • Permissions: tabs, storage, contextMenus, notifications
  • host_permissions: http://localhost:2001/* (restricted — no https://*/*)

Popup (popup.ts):
  • Two tabs: Save and Search (defaults to Search)
  • Auto-captures current tab title + URL via chrome.tabs API
  • Chip-style tag editor with debounced autocomplete from API
  • Collection picker dropdown
  • Context menus for right-click saving (page, link, all tabs, to collection)

Search Page (search.html):
  • Full standalone page opened by Ctrl+Shift+K from any Chrome tab
  • Centered search bar with debounced results
  • Arrow key navigation, Enter to open, Esc to clear
  • Shows favicon, title, URL, collection badge

Background Service Worker (background.ts):
  • Listens for commands (keyboard shortcut)
  • Handles context menu clicks
  • Saves pages to the API
  • Shows notifications with error counts

Icon:
  • Bold white "LS" monogram on indigo background (PNG format)
  • Chosen over SVG to avoid Chrome rendering issues at small sizes
  • Sizes: 16px, 48px, 128px

Security:
  • CSP meta tags on all HTML pages (restricts script sources)
  • Only connects to localhost:2001
  • Token stored in chrome.storage.session (not sync)
  • All dynamic content escaped (including single quotes)`,
  },
  {
    icon: Database,
    title: 'Database Design Rationale',
    content: `Schema (Prisma ORM — 8 models):

User — Core identity model
  • email is unique (used for login)
  • passwordHash stored as bcrypt (12 rounds)
  • firstName/lastName for display in "added by" attribution

Collection — Organizational unit for links
  • Composite unique key: [userId, name] — prevents duplicate collection names per user
  • locked boolean — system collections (Private, Public, Learning) cannot be renamed/deleted
  • order field — supports drag-and-drop reordering
  • teamId (nullable) — future: scopes collections to a team

Link — The core entity
  • url stored as Text (MySQL TEXT type) — accommodates long URLs
  • title indexed alongside userId for search performance
  • openCount + lastOpenedAt — tracks link usage for "most opened" sort
  • Many-to-many with Tag via LinkTag junction table
  • addedBy — populated from user name/email for Public collection visibility

Tag — Shared vocabulary
  • name is unique and lowercased — prevents "React" vs "react" duplicates
  • Tags are global (not per-user) — enables discovery across users
  • Linked to Links via LinkTag (junction table)

Favorite — Simple link+user pair
  • Unique constraint on [userId, linkId] prevents duplicate favorites
  • Separate table (not a field on Link) — efficient queries like "all my favorites"

ActivityLog — Audit trail
  • Records all create/delete actions with metadata (JSON)
  • Enables future undo and activity feed features

Settings — User preferences
  • One-to-one with User
  • Theme (system/light/dark) stored as string
  • preferences as JSON for extensibility

Key design decisions:
  • utf8mb4_unicode_ci collation makes all text comparisons case-insensitive by default — great for search
  • Separate Favorite table instead of a boolean on Link — avoids updating a hot column, enables future features (folders, notes on favorites)
  • Tag as separate entity (not just a string array) — enables autocomplete, shared vocabulary, future AI tagging
  • Collection.locked pattern — system collections are immutable by users but not special-cased in code`,
  },
  {
    icon: Shield,
    title: 'Key Patterns & Decisions',
    content: `1. Global Exception Filter
All unhandled exceptions pass through a single filter that sanitizes error messages. Prisma errors (P2002 = duplicate, P2025 = not found) are mapped to user-friendly messages. Stack traces are never exposed to the client. Response format: { statusCode, message, path }.

2. DTO Validation
All request bodies are validated with class-validator decorators. The global ValidationPipe strips unknown properties (whitelist: true) and rejects requests with extra fields (forbidNonWhitelisted: true). This prevents mass-assignment attacks and ensures data integrity.

3. Scope Parameter System
The links API supports ?scope=mine|public|all. This pattern enables the Private/Public collection system without separate endpoints:
  • mine — only the authenticated user's links
  • public — links in any user's Public collection
  • all — both combined
  This same pattern extends to team scoping (future).

4. Private/Public Collection Design
Each user gets locked Private and Public collections on registration:
  • Private — only the owner can see links. Excluded from JSON export.
  • Public — visible to every user. Any user can add/edit/delete links (collaborative).
  • Learning — user-specific, not locked, used as default target.

5. JSON Import/Export
Export includes all links (excluding Private collection), collections, and tags. Import skips duplicate URLs. Version field in export format enables future format migrations.

6. Tag Autocomplete
Debounced API search (300ms). Chip-style input with inline create for new tags. Uses pickingRef guard to prevent race conditions in async suggestions.

7. Toast Notification System
React context-based toast system positioned at bottom-right. The API client automatically calls showToast on errors — every failed request surface as a user-friendly notification.`,
  },
  {
    icon: Workflow,
    title: 'API Endpoints Reference',
    content: `Auth
  POST /api/auth/register   — Create account (firstName, lastName optional)
  POST /api/auth/login      — Returns JWT token
  GET  /api/auth/me         — Current user profile

Links
  GET    /api/links         — ?scope=mine|public|all&search=&tag=&collectionId=&sort=&page=&limit=&favorites=true
  GET    /api/links/:id     — Single link (increments openCount)
  POST   /api/links         — Create (url, title, collectionId, tags, notes, description, faviconUrl)
  PUT    /api/links/:id     — Update (same fields as create)
  DELETE /api/links/:id     — Delete
  POST   /api/links/bulk/delete — { ids: string[] }
  POST   /api/links/bulk/move   — { ids: string[], collectionId: string }

Collections
  GET    /api/collections       — List all (system first, then custom)
  POST   /api/collections       — Create (name, color)
  PUT    /api/collections/:id   — Update (name, color, order)
  DELETE /api/collections/:id   — Delete (locked collections rejected)
  POST   /api/collections/reorder  — { ids: string[] } — set order

Search
  GET /api/search?q=&scope= — Full-text across title, url, notes, tags, collection

Favorites
  POST /api/favorites/:linkId — Toggle on/off
  GET  /api/favorites         — List all favorited links

Tags
  GET /api/tags?q= — List tags matching query (includes public link tags)

Import/Export
  GET  /api/export  — JSON file download (excludes Private collection)
  POST /api/import  — Upload JSON, skips duplicate URLs`,
  },
  {
    icon: Globe,
    title: 'Development Workflow',
    content: `Prerequisites:
  • Node.js 20+
  • MySQL 8+ running on port 3306 (root:root)
  • Chrome (for extension)

Quick Start:
  ./start.sh
  # Starts backend (2001) and web (2000)

Manual Start:
  # Terminal 1: Backend
  cd backend && npm run start:dev

  # Terminal 2: Web
  cd web && npx next dev -p 2000

  # Terminal 3: Extension (build only)
  cd extension && npm run build
  # Then load dist/ in chrome://extensions (Developer Mode)

Database Migrations:
  cd backend
  npx prisma migrate dev --name <description>
  npx prisma studio  # GUI viewer at port 5555

Password Reset:
  ./reset-password.sh  # CLI tool to reset any user's password

Building for Production:
  Backend:  cd backend && npm run build && node dist/main.js
  Web:      cd web && npx next build && npx next start -p 2000
  Extension: cd extension && npm run build (load dist/ in Chrome)

Test Users:
  test@example.com / password123
  test@gmail.com / password123`,
  },
  {
    icon: Braces,
    title: 'TypeScript Types (Web)',
    content: `interface Collection {
  id: string;
  name: string;
  color: string;
  order: number;
  locked: boolean;
  count: number;
  createdAt: string;
}

interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
  collection: { id: string; name: string; color: string };
  tags: string[];
  isFavorite: boolean;
  addedBy: string | null;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  tags: string[];
  collection: { id: string; name: string; color: string };
  isFavorite: boolean;
  createdAt: string;
  addedBy: string | null;
}

interface ExportData {
  version: string;
  exportedAt: string;
  links: {
    url: string;
    title: string;
    description: string | null;
    notes: string | null;
    collection: string;
    tags: string[];
    createdAt: string;
  }[];
}`,
  },
  {
    icon: GitBranch,
    title: 'Security Audit Summary',
    content: `Completed security audit with 16 findings:

  CRITICAL (2):
    • JWT expires in 365 days (configurable in .env)
    • Hardcoded fallback JWT secret in dev (never reach production)

  HIGH (6):
    • Token synced across devices (chrome.storage.session mitigates this)
    • JWT in localStorage (HttpOnly cookies planned)
    • mysql root:root in source (dev only — use env vars in prod)
    • Import endpoint originally used any type (fixed with DTO)
    • Cross-user Public collection spam (by design for collaboration)
    • Weak password policy (6 char minimum)

  MEDIUM (4):
    • Rate limiting on auth endpoints
    • CSP meta tags in extension (fixed — added)
    • Single quote escaping (fixed — escapeHtml updated)
    • Global exception filter (fixed — sanitizes errors)

  LOW (4):
    • Missing brute force protection
    • Cookie not HttpOnly
    • Extension host_permissions (fixed — restricted to localhost:2001)
    • Missing logout endpoint (tokens cleared client-side)`,
  },
  {
    icon: Users,
    title: 'Future: Team-Level Implementation',
    content: `The current Private/Public collection system already supports multi-user sharing. A future team feature would add structured organizations and teams on top.

Planned Model:
  • Organization (e.g. "Springer Nature") with a MASTER_ADMIN
  • Teams (e.g. "RevEx") with ADMIN and MEMBER roles
  • Each team has its own set of collections (Private, Public, Learning) scoped via teamId
  • Team Public is separate from global Public — visible only to team members

Invite Flow:
  • ADMIN generates a one-time encrypted invite token
  • Anyone with the link can join (no limit)
  • New members start as PENDING — read-only access to Team Public
  • ADMIN must approve to grant full MEMBER access
  • PENDING members can still use their own Private/Learning collections within the team

Permission Model:
  • MASTER_ADMIN — org-level control, create teams, assign ADMINs
  • ADMIN — approve/reject members, manage team
  • MEMBER — full read/write in team collections
  • PENDING — read-only in Team Public, full access to own Private/Learning

Approach:
  • Add teamId to Collection (nullable — null = personal)
  • New Team, TeamMember, TeamInvite models
  • Extend ?scope= query parameter with ?team=teamId
  • Minimal disruption to existing personal data`,
  },
];

export default function DocsPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Technical Documentation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Architecture, tech decisions, and implementation details
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-lg mb-4">Architecture Diagram</h2>
        <img
          src="/images/architecture.svg"
          alt="LinkSaver Architecture Diagram"
          className="w-full rounded-lg border border-border"
        />
      </div>

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-2 min-w-0 flex-1">
                  <h2 className="font-semibold text-lg">{section.title}</h2>
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
