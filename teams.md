# Team-Level Feature Implementation Plan

## Overview
Add organization & team support on top of the existing Public collection system. Teams share links in a private team-scoped Public collection. Members join via one-time encrypted invite tokens and require ADMIN approval before they can contribute.

---

## Business Context
- **Organization:** Springer Nature
- **Team:** RevEx (~20 people)
- **Role model:** MASTER_ADMIN (you) → ADMIN (team lead) → MEMBER → PENDING

---

## Roles

| Role | Scope | Privileges |
|---|---|---|
| **MASTER_ADMIN** | Organization | Create teams, assign ADMINs, org-level control |
| **ADMIN** | Team | Approve/reject members, manage team settings |
| **MEMBER** | Team | Full read/write in team collections |
| **PENDING** | Team | Read-only in Team Public, full access to own Private/Learning |

---

## Invite Flow

1. ADMIN generates a **one-time encrypted token** (`crypto.randomBytes(32)`)
2. Invite link: `https://localhost:2000/join?token=xxx`
3. User clicks link → registers/logs in → token validated (not used, not expired)
4. Token marked `used=true`
5. `TeamMember` created with role `PENDING`
6. 3 team-scoped collections auto-created: **Private**, **Public**, **Learning**
7. User redirected to dashboard → sees team with "Pending approval" badge

---

## Member State Machine

```
Invite → PENDING
PENDING → MEMBER  (ADMIN approves)
PENDING → REMOVED (ADMIN rejects)
MEMBER  → REMOVED (ADMIN removes)
```

### Permissions by State (within team context)

| Action | PENDING | MEMBER | REMOVED |
|---|---|---|---|
| Browse Team Public | ✅ Read-only | ✅ Read + Write | ❌ |
| Own Private (RevEx) | ✅ Read + Write | ✅ Read + Write | ❌ |
| Own Learning (RevEx) | ✅ Read + Write | ✅ Read + Write | ❌ |
| Outside RevEx (Personal) | ✅ Full access | ✅ Full access | ✅ Full access |

**Rule:** `if role == PENDING && collection.name == 'Public'` in team context → deny write

---

## Database Schema Changes

### New Models

```prisma
model Organization {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  masterAdminId String   @map("master_admin_id")
  createdAt     DateTime @default(now())
  teams         Team[]
  @@map("organizations")
}

model Team {
  id          String   @id @default(cuid())
  orgId       String   @map("org_id")
  name        String
  slug        String
  description String?
  createdAt   DateTime @default(now())
  org         Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  members     TeamMember[]
  invites     TeamInvite[]
  @@unique([orgId, slug])
  @@map("teams")
}

model TeamMember {
  id       String   @id @default(cuid())
  teamId   String   @map("team_id")
  userId   String   @map("user_id")
  role     TeamRole @default(PENDING)
  joinedAt DateTime @default(now())
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([teamId, userId])
  @@map("team_members")
}

enum TeamRole { MASTER_ADMIN ADMIN MEMBER PENDING }

model TeamInvite {
  id        String   @id @default(cuid())
  teamId    String   @map("team_id")
  token     String   @unique
  used      Boolean  @default(false)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now())
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  @@map("team_invites")
}
```

### Existing Model Changes

```prisma
model Collection {
  // ... existing fields ...
  teamId String? @map("team_id")   // NEW — null = personal collection
}
```

---

## Collection Behavior

When a user joins a team, 3 collections are created with `teamId` set:

| Collection | Locked | Visible to |
|---|---|---|
| Private | ✅ | Only that member |
| Public | ✅ | All team members |
| Learning | ❌ | Only that member |

### Global Public vs Team Public

| | Global Public | Team Public |
|---|---|---|
| `teamId` | null | set |
| Visible to | All users | Team members only |
| Who can write | Any user | MEMBER+ (PENDING = read-only) |
| In export | Excluded (if owner's) | TBD |

---

## Backend Endpoints

### Organizations
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/organizations` | MASTER_ADMIN | Create org |
| GET | `/api/organizations` | Any | List user's orgs |

### Teams
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/teams` | MASTER_ADMIN / ADMIN | Create team |
| GET | `/api/teams/:id` | Team member | Team details |
| GET | `/api/teams/:id/members` | Team member | List members |
| POST | `/api/teams/:id/invite` | ADMIN+ | Generate one-time token |
| POST | `/api/teams/join` | Public (with token) | Join team |
| PATCH | `/api/teams/:id/members/:userId` | ADMIN+ | Approve / change role |
| DELETE | `/api/teams/:id/members/:userId` | ADMIN+ | Remove member |

### Existing (modified)
| Endpoint | Change |
|---|---|
| `GET /api/links?team=:teamId` | Team-scoped links |
| `GET /api/collections?team=:teamId` | Team-scoped collections |
| `POST /api/links` | Accept `teamId` field |
| `PUT /api/links/:id` | Respect team permissions |
| `DELETE /api/links/:id` | Respect team permissions |

---

## Web UI Changes

### New Pages
| Route | Purpose |
|---|---|
| `/teams` | List user's teams |
| `/teams/[id]` | Team dashboard — links, members, invite (ADMIN) |
| `/teams/[id]/members` | Member management — approve/reject (ADMIN) |
| `/join?token=xxx` | Accept invite — login/register → join |

### Sidebar Changes
```
LinkSaver
━━ Dashboard, All Links, Favorites, Recent ━━

━━ Personal ━━
  🔒 Private
  🌍 Public
  📚 Learning
  [custom collections...]

━━ RevEx ━━
  🔒 Private
  🌍 Team Public
  📚 Learning
  👥 Members (20)
  🔗 Invite (ADMIN only)

Pending approval badge on team name if role = PENDING
```

### Team Context
- Tab switcher at top: `Personal` | `RevEx`
- All link queries scoped to active context
- Save button disabled for PENDING users on Team Public

---

## Extension Changes

- **Popup:** Add team selector dropdown when user has teams
- **Header:** Pass `X-Team-Id` with API requests when team is active

---

## Seed Script

```
1. Create Organization "Springer Nature" with masterAdminId = <your userId>
2. Create Team "RevEx" under Springer Nature
3. Generate initial invite token
4. Create 3 team collections for MASTER_ADMIN
5. Assign MASTER_ADMIN role
```

---

## Migration (zero data loss)

| Step | Command |
|---|---|
| 1 | `npx prisma migrate dev --name add-team-support` |
| 2 | Run seed script |
| 3 | Existing user data untouched (teamId = null) |
| 4 | Share invite link with team |

---

## Implementation Order

1. Prisma schema + migration
2. Organization module (CRUD)
3. Team module (CRUD + invite + join + approve/reject)
4. TeamGuard (permissions based on role)
5. Links + Collections team scope (backend)
6. Seed script
7. Web: join page `/join?token=xxx`
8. Web: team pages (dashboard, members)
9. Web: sidebar team section + context switcher
10. Extension: team selector
11. Rebuild extension

---

## Estimated Time (AI)

| Area | Time |
|---|---|
| Schema + migration | 5 min |
| Backend: org module | 10 min |
| Backend: team module | 15 min |
| Backend: TeamGuard | 5 min |
| Backend: links/collections scope changes | 8 min |
| Backend: seed script | 3 min |
| Web: team pages | 15 min |
| Web: sidebar team section | 5 min |
| Web: team context + API wiring | 5 min |
| Extension: team selector | 5 min |
| **Total** | **~75 min** |
