# LinkSaver — V1 vs V2 Feature Comparison

> **V1**: NestJS backend (port 2001) + Next.js dashboard (port 2000) + Chrome Extension
> **V2**: Spring Boot backend (port 8080) + React SPA dashboard (port 3001) + Chrome extension (port 8080)

---

## Status Legend

| Icon | Meaning |
|------|---------|
| ✅ IDENTICAL | Feature works the same as V1 |
| ⚠️ PARTIAL | Feature exists but missing some V1 sub-features |
| ❌ MISSING | Feature not implemented in V2 |
| ➕ UNIQUE | New feature in V2 (not in V1) |
| 📋 PLANNED | Specified in teams.md but not fully implemented |

---

## 1. Authentication

| Feature | V1 | V2 |
|---------|----|----|
| Email/password registration | ✅ | ✅ IDENTICAL |
| Email/password login | ✅ | ✅ IDENTICAL |
| JWT token storage (localStorage) | ✅ | ✅ IDENTICAL |
| Auto-logout on 401 | ✅ | ✅ IDENTICAL |
| Auth guard on protected routes | ✅ | ✅ IDENTICAL |
| Profile endpoint (`GET /auth/me`) | ✅ | ✅ IDENTICAL |

---

## 2. Dashboard

| Feature | V1 | V2 |
|---------|----|----|
| Total Links stat card | ✅ | ✅ IDENTICAL |
| Collections count stat card | ✅ | ✅ IDENTICAL |
| Favorites count stat card | ✅ | ❌ V2 shows "Activities" instead |
| Saved This Week stat card | ✅ (placeholder) | ❌ Not implemented |

---

## 3. Links Page

| Feature | V1 | V2 |
|---------|----|----|
| Paginated list | ✅ (50/page) | ⚠️ PARTIAL (10/page, smaller) |
| Keyword search | ✅ | ✅ IDENTICAL |
| Collection filter (via sidebar click) | ✅ | ✅ IDENTICAL |
| Collection filter (dropdown on page) | ✅ | ❌ Sidebar click only |
| Tag filter (with autocomplete) | ✅ | ✅ IDENTICAL |
| Sort: newest | ✅ | ❌ Not implemented |
| Sort: oldest | ✅ | ❌ Not implemented |
| Sort: alphabetical | ✅ | ❌ Not implemented |
| Sort: most opened | ✅ | ❌ Not implemented |
| Sort: recently opened | ✅ | ❌ Not implemented |
| Project filter (teamProjectId) | ❌ | ➕ UNIQUE |
| Bulk select (checkboxes) | ✅ | ❌ Not implemented |
| Bulk delete | ✅ | ❌ Not implemented |
| Bulk move to collection | ✅ | ❌ Not implemented |
| Create link (inline form) | ❌ (dialog) | ➕ UNIQUE (inline form on page) |
| Edit link dialog | ✅ (title, collection, notes, tags) | ❌ Not implemented |
| Delete link (single) | ✅ | ✅ IDENTICAL |
| Import JSON | ✅ | ⚠️ PARTIAL (endpoint exists, no UI) |
| Export JSON | ✅ | ⚠️ PARTIAL (endpoint exists, no UI) |

---

## 4. Link Card Display

| Feature | V1 | V2 |
|---------|----|----|
| Title (clickable link) | ✅ | ✅ IDENTICAL |
| URL display below title | ✅ | ❌ Not shown |
| Description | ✅ | ✅ IDENTICAL |
| Favicon | ✅ | ❌ Stored in DB but not displayed |
| Collection badge (color-tinted) | ✅ (color + `20` opacity tint) | ✅ IDENTICAL (recently added) |
| Tags (max 3 chips) | ✅ (`bg-accent text-accent-foreground text-[10px]`) | ✅ IDENTICAL (recently updated) |
| Favorite star toggle | ✅ | ✅ IDENTICAL |
| Delete button | ✅ | ✅ IDENTICAL |
| Relative time ("2 hours ago") | ✅ | ❌ Not shown |
| "Added by" attribution (public links) | ✅ | ❌ Not shown |

---

## 5. Tag Management

| Feature | V1 | V2 |
|---------|----|----|
| Tag autocomplete in search | ✅ (debounced) | ✅ IDENTICAL |
| Tag autocomplete in create/add form | ✅ (debounced 150ms) | ✅ IDENTICAL (basic) |
| Tag chip editor (Enter/comma to add) | ✅ | ✅ IDENTICAL |
| Tag chip editor (Backspace to remove) | ✅ | ✅ IDENTICAL |
| "Add new tag" option in autocomplete | ✅ | ❌ Not implemented |
| Max 3 tags display on card | ✅ | ✅ IDENTICAL (recently added) |

---

## 6. Collections

| Feature | V1 | V2 |
|---------|----|----|
| Create collection (name + 8-color picker) | ✅ (modal with color grid) | ⚠️ PARTIAL (inline input, default color, no picker) |
| Rename collection (inline) | ✅ (name + color picker) | ⚠️ PARTIAL (name only, no color change) |
| Delete collection (links→Learning) | ✅ | ✅ IDENTICAL |
| System collections: Private (locked) | ✅ | ✅ IDENTICAL |
| System collections: Public (locked) | ✅ | ✅ IDENTICAL |
| System collections: Learning | ✅ (unlocked) | ❌ Not created by default |
| Collection reorder (drag or list) | ✅ (PUT reorder endpoint) | ❌ Not implemented |
| Link count per collection | ✅ (shown in sidebar) | ❌ Not shown |
| Team-scoped collections (Private/Public/Learning per team) | ❌ | ➕ UNIQUE (per teams.md, auto-created on team join) |

---

## 7. Sidebar

| Feature | V1 | V2 |
|---------|----|----|
| Nav: Dashboard | ✅ | ✅ IDENTICAL |
| Nav: All Links | ✅ | ✅ IDENTICAL |
| Nav: Favorites | ✅ | ❌ Not a nav item |
| Nav: Recent | ✅ | ❌ Not implemented |
| Nav: Teams | ❌ | ➕ UNIQUE |
| Nav: Help | ✅ | ➕ V2 has it in sidebar |
| Nav: Docs | ✅ | ❌ Not implemented |
| Nav: Settings | ✅ | ❌ Not implemented |
| Collections section (personal) | ✅ | ✅ IDENTICAL |
| "Projects" section (team collections) | ❌ | ➕ UNIQUE |
| Collection create button | ✅ | ✅ IDENTICAL (inline input) |
| Collection inline rename | ✅ | ✅ IDENTICAL (double-click) |
| Collection color picker on rename | ✅ | ❌ Not implemented |
| Collection delete | ✅ | ✅ IDENTICAL |
| System collection lock/globe icons | ✅ | ✅ IDENTICAL |
| Collapsible sidebar | ❌ | ➕ UNIQUE |
| User email in footer | ❌ | ➕ UNIQUE |
| Logout button | ✅ (in Settings) | ➕ UNIQUE (in sidebar footer) |
| Link counts on collections | ✅ | ❌ Not implemented |

---

## 8. Favorites

| Feature | V1 | V2 |
|---------|----|----|
| Toggle favorite (star) | ✅ | ✅ IDENTICAL |
| Dedicated Favorites page | ✅ (`/favorites`) | ❌ API endpoint exists, no UI page |
| Favorites stat on dashboard | ✅ | ❌ Shows Activities instead |
| GET /favorites endpoint | ✅ | ✅ IDENTICAL (unused in UI) |
| DELETE /favorites endpoint | ✅ | ✅ IDENTICAL |

---

## 9. Teams & Organizations (teams.md spec)

| Feature | V1 | V2 | teams.md Spec |
|---------|----|----|---------------|
| Organization create (MASTER_ADMIN) | ❌ | ✅ DONE | ✅ |
| Organization list | ❌ | ✅ DONE | ✅ |
| Team create (MASTER_ADMIN) | ❌ | ✅ DONE | ✅ |
| Team list (membership-based) | ❌ | ✅ DONE | ✅ |
| Team detail | ❌ | ✅ DONE | ✅ |
| Team rename (ADMIN+) | ❌ | ✅ DONE | ✅ |
| Team member list | ❌ | ✅ DONE | ✅ |
| Change member role (ADMIN+) | ❌ | ✅ DONE | ✅ |
| Remove member (ADMIN+) | ❌ | ✅ DONE | ✅ |
| Invite token generation (ADMIN+) | ❌ | ✅ DONE | ✅ |
| Join team via token | ❌ | ✅ DONE | ✅ |
| Team-scoped collections auto-created | ❌ | ✅ DONE | ✅ |
| TeamProject (auto-created with team) | ❌ | ✅ DONE | ❌ Not in teams.md (bonus) |
| Project rename/delete (ADMIN+) | ❌ | ✅ DONE | ❌ Not in teams.md (bonus) |
| Context switcher (Personal \| Team) | ❌ | ❌ | 📋 PLANNED |
| Extension team selector dropdown | ❌ | ❌ | 📋 PLANNED |
| MASTER_ADMIN role | ❌ | ✅ DONE | ✅ |
| ADMIN role | ❌ | ✅ DONE | ✅ |
| MEMBER role | ❌ | ✅ DONE | ✅ |
| PENDING role (read-only) | ❌ | ✅ DONE | ✅ |
| PENDING approval badge | ❌ | ❌ | 📋 PLANNED |
| Delete/update permission for team links | ❌ | ✅ DONE (ADMIN+) | ✅ |

---

## 10. Extensions (Chrome)

| Feature | V1 | V2 |
|---------|----|----|
| Popup Save tab (title, URL, collection picker, tags, notes) | ✅ | ✅ IDENTICAL |
| Popup Search tab (search + tag filter + results) | ✅ | ✅ IDENTICAL |
| Full-page search tab (Ctrl+Shift+K) | ✅ | ✅ IDENTICAL |
| Right-click: save page | ✅ | ✅ IDENTICAL |
| Right-click: save link | ✅ | ✅ IDENTICAL |
| Right-click: save all tabs | ✅ | ✅ IDENTICAL |
| Right-click: save to specific collection | ✅ | ✅ IDENTICAL |
| Inline login in popup | ✅ | ✅ IDENTICAL |
| Chrome notifications | ✅ | ✅ IDENTICAL |
| Tag autocomplete in save form | ✅ | ✅ IDENTICAL |
| Favicon in search results | ✅ | ✅ IDENTICAL |
| Collection color badges in results | ✅ | ✅ IDENTICAL |
| Dashboard links (port change) | ✅ (port 2000) | ✅ IDENTICAL (port 3000) |

**All extension features are IDENTICAL between V1 and V2** (only backend URL and colors changed).

---

## 11. Other Pages

| Feature | V1 | V2 |
|---------|----|----|
| Login page | ✅ | ✅ IDENTICAL |
| Register page | ✅ | ✅ IDENTICAL |
| Settings page (theme picker, import/export, logout) | ✅ | ❌ Not implemented |
| Help / user guide | ✅ (static content) | ➕ (test credentials only) |
| Technical docs | ✅ | ❌ Not implemented |
| Recent links page | ✅ | ❌ Not implemented |
| Favorites page | ✅ | ❌ Not implemented |
| Collection detail page (`/collections/[id]`) | ✅ | ❌ Links filtered via sidebar click |

---

## 12. Theme & Styling

| Feature | V1 | V2 |
|---------|----|----|
| Dark mode | ✅ | ✅ IDENTICAL |
| Light mode | ✅ | ✅ IDENTICAL |
| System theme | ✅ | ❌ HTML is hard-coded `dark` class |
| Theme picker UI | ✅ (Settings page) | ❌ Not implemented |

---

## 13. Summary — Priority Gap Analysis

### Highest Priority (V1 parity must-haves)

| Rank | Feature | Why |
|------|---------|-----|
| 1 | **Edit link dialog** | Users need to update saved links (title, tags, notes, collection) |
| 2 | **Sort options** | Newest/oldest/alphabetical are basic UX requirements for any list |
| 3 | **URL + favicon on link cards** | V1 shows URL below title with favicon — aids recognition |
| 4 | **Bulk operations** | Power users need bulk delete/move |
| 5 | **Dedicated Favorites page** | Favorites are half-implemented (toggle works, no list page) |

### Medium Priority

| Rank | Feature |
|------|---------|
| 6 | **Relative time on link cards** |
| 7 | **Collection color picker** (create + rename) |
| 8 | **"Added by" attribution** for team/public links |
| 9 | **Link counts in sidebar collections** |
| 10 | **Pagination size** (increase from 10 to 50) |

### Lower Priority

| Rank | Feature |
|------|---------|
| 11 | **Recent links page** |
| 12 | **Data Import/Export UI** (backend endpoints exist) |
| 13 | **Settings page** (theme, import/export, logout) |
| 14 | **Collection reorder** |
| 15 | **Saveds This Week** stat |
| 16 | **Technical docs page** |
| 17 | **Collection detail page** |

### Teams.md Remaining Items

| Rank | Feature |
|------|---------|
| 1 | **Context switcher** (Personal \| Team tabs at top) |
| 2 | **PENDING approval badge** on sidebar |
| 3 | **Extension team selector** (dropdown when user has teams) |

---

## 14. Backend API — Endpoint Comparison

| Endpoint | V1 | V2 |
|----------|----|----|
| `POST /api/auth/register` | ✅ | ✅ IDENTICAL |
| `POST /api/auth/login` | ✅ | ✅ IDENTICAL |
| `GET /api/auth/me` | ✅ | ✅ IDENTICAL |
| `GET /api/links` | ✅ (more query params) | ⚠️ PARTIAL (missing sort options) |
| `GET /api/links/:id` | ✅ | ✅ IDENTICAL |
| `POST /api/links` | ✅ | ✅ IDENTICAL |
| `PUT /api/links/:id` | ✅ | ✅ IDENTICAL |
| `DELETE /api/links/:id` | ✅ | ✅ IDENTICAL |
| `POST /api/links/bulk/delete` | ✅ | ✅ IDENTICAL |
| `POST /api/links/bulk/move` | ✅ | ✅ IDENTICAL |
| `GET /api/search` | ✅ (more filters) | ⚠️ PARTIAL (fewer query params) |
| `GET /api/collections` | ✅ | ✅ IDENTICAL |
| `POST /api/collections` | ✅ | ✅ IDENTICAL |
| `PUT /api/collections/:id` | ✅ | ✅ IDENTICAL |
| `DELETE /api/collections/:id` | ✅ | ✅ IDENTICAL |
| `PUT /api/collections/reorder` | ✅ | ✅ IDENTICAL |
| `GET /api/tags` | ✅ | ✅ IDENTICAL |
| `POST /api/favorites/:linkId` | ✅ | ✅ IDENTICAL |
| `GET /api/favorites` | ✅ | ✅ IDENTICAL |
| `DELETE /api/favorites/:linkId` | ✅ | ✅ IDENTICAL |
| `GET /api/export` | ✅ | ✅ IDENTICAL |
| `POST /api/import` | ✅ | ✅ IDENTICAL |
| `POST /api/organizations` | ❌ | ➕ UNIQUE |
| `GET /api/organizations` | ❌ | ➕ UNIQUE |
| `GET /api/teams` | ❌ | ➕ UNIQUE |
| `POST /api/teams` | ❌ | ➕ UNIQUE |
| `GET /api/teams/:id` | ❌ | ➕ UNIQUE |
| `PATCH /api/teams/:id` | ❌ | ➕ UNIQUE |
| `GET /api/teams/:id/members` | ❌ | ➕ UNIQUE |
| `PATCH /api/teams/:id/members/:userId` | ❌ | ➕ UNIQUE |
| `DELETE /api/teams/:id/members/:userId` | ❌ | ➕ UNIQUE |
| `POST /api/teams/:id/invite` | ❌ | ➕ UNIQUE |
| `POST /api/teams/join` | ❌ | ➕ UNIQUE |
| `GET /api/teams/:id/project` | ❌ | ➕ UNIQUE |
| `PATCH /api/teams/:id/project` | ❌ | ➕ UNIQUE |
| `DELETE /api/teams/:id/project` | ❌ | ➕ UNIQUE |
| `GET /api/activity` | ❌ | ➕ UNIQUE |

**Backend API is actually ahead of V1** — all V1 endpoints exist, plus full teams/organizations/projects/activity support. The gaps are entirely on the frontend UI.

---

## 15. Quick Stats

| Metric | V1 | V2 |
|--------|----|----|
| Total API endpoints | 23 | 37 |
| Frontend pages | 10 | 7 |
| Frontend source files | ~20+ | 14 |
| Extension features | ~15 | ~15 (identical) |
| Collections | Personal only | Personal + Team-scoped |
| Teams support | None | Full (orgs, teams, members, roles, invites, projects) |
