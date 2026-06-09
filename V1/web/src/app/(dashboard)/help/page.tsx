'use client';

import { HelpCircle, Keyboard, Download, Upload, Search, Star, Layers, Zap, Code2, Server, Shield, Globe, Database, Box, Workflow } from 'lucide-react';

const sections = [
  {
    icon: Zap,
    title: 'Getting Started',
    content: `Welcome to LinkSaver! Start by creating collections to organize your links. Install the Chrome Extension for one-click saving from your browser. Try the search (Cmd+K) to find anything instantly.`,
  },
  {
    icon: Layers,
    title: 'Chrome Extension Installation',
    content: `1. Open Chrome and go to chrome://extensions
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the extension folder
5. The LinkSaver icon will appear in your toolbar
6. Click the icon or use keyboard shortcuts to save pages`,
  },
  {
    icon: Star,
    title: 'How to Save Links',
    content: `Click the LinkSaver extension icon in your browser toolbar. The current page's title and URL are automatically captured. Choose a collection, add tags and notes, then click "Save".

Right-click any page or link and select "Save to LinkSaver" from the context menu.`,
  },
  {
    icon: Star,
    title: 'Save All Tabs',
    content: `To save all open tabs at once:
• Right-click the LinkSaver extension icon
• Select "Save All Tabs to LinkSaver"
• All tabs will be saved to the default Learning collection
Or use the web dashboard to save links manually.`,
  },
  {
    icon: Download,
    title: 'Manual Link Entry',
    content: `You can manually add links from the web dashboard:
1. Go to the "All Links" page
2. Click "Add Link"
3. Enter the URL, title, collection, tags, and notes
4. If no title is provided, it will be fetched automatically`,
  },
  {
    icon: Layers,
    title: 'Collections',
    content: `Collections help you organize your links. Default collections: Learning, Work, AI, Personal.

You can:
• Create new collections with custom colors
• Rename existing collections
• Delete collections (links move to Learning)
• Reorder collections via drag and drop
• See link count per collection`,
  },
  {
    icon: Star,
    title: 'Favorites',
    content: `Star important links to access them quickly from the Favorites page. Click the star icon on any link card to toggle it as a favorite.`,
  },
  {
    icon: Search,
    title: 'Search',
    content: `Press Cmd+K (or Ctrl+K on Windows) anytime to open the global search dialog. You can also press Ctrl+Shift+K from any Chrome tab to open the extension search page. Search through:
• Link titles
• URLs
• Tags
• Notes
• Descriptions
• Collection names

Use arrow keys to navigate results and Enter to open.`,
  },
  {
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    content: `Global:
• Cmd+K / Ctrl+K → Open Search
• Arrow Keys → Navigate search results
• Enter → Open selected link
• Escape → Close search

Chrome Extension:
• Ctrl+Shift+K → Search your saved links`,
  },
  {
    icon: Download,
    title: 'Import & Export',
    content: `Export your data anytime as JSON:
• Go to Settings → Export Data
• All links, collections, and tags are included
• File is downloaded as linkvault-export-{timestamp}.json

Import from JSON:
• Go to Settings → Import Data
• Select a valid LinkSaver export file
• Duplicate URLs are automatically skipped
• New collections are created as needed`,
  },
  {
    icon: HelpCircle,
    title: 'Troubleshooting',
    content: `Can't save pages?
• Make sure you're logged in to the web app
• Check your internet connection
• Verify the API server is running

Extension not working?
• Reload the extension from chrome://extensions
• Re-login from the extension popup
• Check for updates

Search not finding results?
• Try different keywords
• Search is case-insensitive
• Check your collection filters`,
  },
  {
    icon: Code2,
    title: 'Architecture Overview',
    content: `LinkSaver is a full-stack personal link management application with three components:

Backend (NestJS) — REST API on port 2001
• Handles auth, CRUD, search, import/export
• MySQL database via Prisma ORM
• JWT-based authentication

Web Dashboard (Next.js 15) — UI on port 2000
• Server-rendered React app with client interactions
• TanStack Query for data fetching & caching
• Responsive design with Tailwind CSS

Chrome Extension (Manifest V3)
• Popup for quick saving, standalone search page
• Context menus for saving pages/links/all-tabs
• Ctrl+Shift+K shortcut opens search

Data flow: Extension/Web → REST API → Prisma → MySQL`,
  },
  {
    icon: Server,
    title: 'Tech Stack',
    content: `Backend:
• NestJS 10 — Node.js framework with dependency injection
• Prisma 5 — Type-safe ORM with schema migrations
• MySQL 8 — Database with utf8mb4_unicode_ci collation
• Passport + JWT — Authentication
• Helmet — Security headers
• class-validator — Request validation
• bcrypt — Password hashing

Web Dashboard:
• Next.js 15 — React framework (App Router)
• TanStack Query v5 — Server state management
• Tailwind CSS — Utility-first styling
• Lucide React — Icon library
• Recharts (optional) — For future analytics

Chrome Extension:
• TypeScript — Vanilla, no framework
• Manifest V3 — Latest Chrome extension API
• chrome.tabs, chrome.contextMenus, chrome.storage, chrome.notifications

Infrastructure:
• Native MySQL (no Docker)
• nohup + PID files for process management`,
  },
  {
    icon: Box,
    title: 'Project Structure',
    content: `my-links/
├── backend/           # NestJS API server
│   ├── prisma/        # Schema & migrations
│   ├── src/
│   │   ├── auth/      # Login, register, JWT strategy
│   │   ├── links/     # CRUD, bulk, search
│   │   ├── collections/ # CRUD, reorder
│   │   ├── tags/      # Tag listing with autocomplete
│   │   ├── favorites/ # Toggle & list favorites
│   │   ├── import-export/ # JSON import/export
│   │   └── prisma.service.ts
│   ├── .env           # DB connection, JWT config
│   └── reset-password.sh
├── web/               # Next.js dashboard
│   ├── src/
│   │   ├── app/       # Pages (login, dashboard, collections, etc.)
│   │   ├── components/ # UI & feature components
│   │   ├── lib/       # API client, hooks, utilities
│   │   └── styles/    # Global CSS
│   └── .env.local     # API URL config
├── extension/         # Chrome Extension
│   ├── src/           # TypeScript source
│   ├── public/        # HTML, manifest, icons
│   └── dist/          # Built output
├── start.sh           # Start all services
├── FILE_REFERENCE.md  # Per-file documentation
└── setup.md           # Setup guide`,
  },
  {
    icon: Database,
    title: 'Data Model',
    content: `Core entities managed by Prisma ORM:

User — id, email, password (hashed), firstName, lastName, createdAt
  • Has default collections created on registration

Collection — id, name, color, userId, order, locked, createdAt
  • System collections (locked): Private, Public, Learning
  • Custom collections: user-specific, can be renamed/deleted
  • locked=true prevents rename/delete/reorder in UI

Link — id, url, title, description, notes, userId, collectionId, faviconUrl, imageUrl, openCount, lastOpenedAt, createdAt, updatedAt
  • Tags via many-to-many through LinkTag
  • addedBy field populated from user email for public links

Tag — id, name (unique, lowercase)
  • Shared across users, linked via LinkTag junction table

Favorite — userId, linkId (unique pair)

ActivityLog — userId, action, details, createdAt

Settings — userId, key, value

The database uses utf8mb4_unicode_ci collation (case-insensitive text).`,
  },
  {
    icon: Globe,
    title: 'Private & Public Collections',
    content: `Each user gets three default collections on registration:
  🔒 Private — Locked, only the owner can see links. Excluded from JSON export.
  🌍 Public — Locked, visible to every user. Any user can add/edit/delete links.
  📚 Learning — Unlocked, user-specific default collection.

Scope parameter (mine | public | all):
  • Use ?scope=mine (default) to get only your links
  • Use ?scope=public to get all public collection links
  • Use ?scope=all to get both

Key rules:
  • Public links show "added by {name}" attribution
  • Any authenticated user can create/edit/delete links in any user's Public collection (collaborative)
  • Custom collections are always private and user-specific
  • Public collection links are visible to all users on the All Links page with scope=public`,
  },
  {
    icon: Shield,
    title: 'Security Overview',
    content: `Authentication:
  • JWT tokens with 365-day expiry (configurable in .env)
  • Passwords hashed with bcrypt
  • Token stored in localStorage (web) and chrome.storage.session (extension)

API Security:
  • Helmet middleware for security headers
  • Rate limiting via @nestjs/throttler
  • CORS restricted to web origin
  • Request validation with class-validator DTOs
  • Global exception filter sanitizes error messages (no stack traces)

Extension Security:
  • CSP meta tags on popup.html and search.html
  • host_permissions restricted to localhost:2001
  • HTML escaping (including single quotes) in dynamic content

Known areas for improvement (deferred):
  • Shorter JWT expiry with refresh tokens
  • HttpOnly cookies instead of localStorage
  • Hardcoded JWT fallback secret in dev`,  },
  {
    icon: Workflow,
    title: 'API Endpoints',
    content: `Auth:
  POST /api/auth/register — Create account (with firstName/lastName)
  POST /api/auth/login — Get JWT token
  GET  /api/auth/me — Get current user profile

Links:
  GET    /api/links — List (scope=mine|public|all, search, sort, paginate)
  GET    /api/links/:id — Get single
  POST   /api/links — Create (url, title, collectionId, tags, notes, description)
  PUT    /api/links/:id — Update
  DELETE /api/links/:id — Delete
  POST   /api/links/bulk/delete — Bulk delete
  POST   /api/links/bulk/move — Bulk move to collection

Collections:
  GET    /api/collections — List (system first, then custom)
  POST   /api/collections — Create (name, color)
  PUT    /api/collections/:id — Update (name, color, order)
  DELETE /api/collections/:id — Delete (locked collections cannot be deleted)
  POST   /api/collections/reorder — Reorder all

Search:
  GET /api/search?q=&scope= — Full-text search across title, url, notes, tags

Favorites:
  POST /api/favorites/:linkId — Toggle favorite
  GET  /api/favorites — List favorites

Tags:
  GET /api/tags?q= — List (includes public tags)

Import/Export:
  GET  /api/export — JSON export (excludes Private collection)
  POST /api/import — JSON import (skips duplicates)`,
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    content: `Q: Is my data private?
A: Yes, LinkSaver is a personal tool. Your data is stored in your own database.

Q: Can I use it with multiple devices?
A: Deploy the backend on a server and access it from any device.

Q: Is there a mobile app?
A: Not yet, but the web dashboard is fully responsive.

Q: Can I share links with others?
A: Multi-user and sharing features are planned for future versions.`,
  },
];

export default function HelpPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Help & Documentation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you need to know about LinkSaver
        </p>
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
                <div className="space-y-2">
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
