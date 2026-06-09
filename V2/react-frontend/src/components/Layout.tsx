import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { cn } from '../lib/utils'
import { getCollections, createCollection, updateCollection, deleteCollection, getTeams } from '../lib/api'
import {
  LayoutDashboard, Link2, Star, Users, HelpCircle,
  LogOut as LogoutIcon, ChevronLeft, ChevronRight,
  Lock, Globe, Plus, Trash2, FolderKanban, UserCheck, Clock
} from 'lucide-react'

interface Collection {
  id: string; name: string; color: string; order: number
  locked: boolean; teamId?: string; teamName?: string; createdAt: string
}

interface TeamWithProject {
  id: string; name: string; projectId?: string; role?: string
}

interface TeamMemberWithRole {
  teamId: string; teamName: string; role: string
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [teams, setTeams] = useState<TeamWithProject[]>([])

  useEffect(() => {
    Promise.all([
      getCollections(),
      getTeams(),
    ]).then(([cols, ts]) => {
      setCollections(cols as Collection[])
      setTeams(ts as TeamWithProject[])
    }).catch(() => {})
  }, [location.pathname])

  const activeCollectionId = new URLSearchParams(location.search).get('collectionId')

  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newColName, setNewColName] = useState('')

  function handleStartRename(c: Collection) {
    if (c.locked) return
    setEditingColId(c.id)
    setEditName(c.name)
  }

  function handleFinishRename() {
    if (editingColId && editName.trim()) {
      updateCollection(editingColId, { name: editName.trim() }).then(() => {
        getCollections().then(setCollections)
      })
    }
    setEditingColId(null)
    setEditName('')
  }

  function handleDelete(c: Collection) {
    if (c.locked) return
    if (confirm(`Delete collection "${c.name}"?`)) {
      deleteCollection(c.id).then(() => {
        getCollections().then(setCollections)
      })
    }
  }

  function handleCreate() {
    if (newColName.trim()) {
      createCollection({ name: newColName.trim() }).then(() => {
        setNewColName('')
        setShowCreate(false)
        getCollections().then(setCollections)
      })
    }
  }

  function renderCollectionItem(c: Collection) {
    const isEditing = editingColId === c.id
    return (
      <div key={c.id} className="group flex items-center gap-1">
        <button
          onClick={() => navigate(`/links?collectionId=${c.id}`)}
          className={cn(
            'flex items-center gap-3 flex-1 w-full px-3 py-1.5 rounded-lg text-sm transition-colors text-left',
            activeCollectionId === c.id
              ? 'bg-primary/10 text-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-muted/50'
          )}
        >
          {c.name === 'Private' ? (
            <Lock size={14} className="shrink-0 text-sidebar-foreground/60" />
          ) : c.name === 'Public' ? (
            <Globe size={14} className="shrink-0 text-green-500/70" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
          )}
          {isEditing ? (
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={e => { if (e.key === 'Enter') handleFinishRename(); if (e.key === 'Escape') setEditingColId(null) }}
              className="flex-1 text-sm bg-transparent border-b border-primary outline-none min-w-0"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className="truncate flex-1"
              onDoubleClick={() => handleStartRename(c)}
              title={c.locked ? 'Locked' : 'Double-click to rename'}
            >
              {c.name}
            </span>
          )}
        </button>
        {!c.locked && !isEditing && (
          <button
            onClick={e => { e.stopPropagation(); handleDelete(c) }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-sidebar-foreground/40 hover:text-destructive transition-all"
            title="Delete collection"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    )
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/links', label: 'All Links', icon: Link2 },
    { to: '/favorites', label: 'Favorites', icon: Star },
    { to: '/teams', label: 'Teams', icon: Users },
    { to: '/help', label: 'Help', icon: HelpCircle },
  ]

  const personal = collections.filter(c => !c.teamId)

  return (
    <div className="flex min-h-screen">
      <aside className={cn(
        'flex flex-col border-r border-border bg-sidebar transition-all duration-200 sticky top-0 h-screen',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          {!collapsed && <h2 className="font-semibold text-lg">LinkSaver</h2>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/50 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-muted/50'
              )}
            >
              <l.icon size={18} className="shrink-0" />
              {!collapsed && <span>{l.label}</span>}
            </NavLink>
          ))}

          {!collapsed && collections.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                  Collections
                </span>
                <button
                  onClick={() => { setShowCreate(!showCreate); setNewColName('') }}
                  className="p-0.5 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                  title="Create collection"
                >
                  <Plus size={14} />
                </button>
              </div>

              {personal.length > 0 && (
                <div className="pb-1">
                  {personal.map(c => renderCollectionItem(c))}
                </div>
              )}

              {showCreate && (
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <input
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onBlur={handleCreate}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setNewColName('') } }}
                    placeholder="Collection name"
                    className="flex-1 text-sm bg-transparent border-b border-primary outline-none"
                    autoFocus
                  />
                </div>
              )}

              {teams.length > 0 && (
                <div className="border-t border-border/50 pt-2 mt-1">
                  <div className="px-3 pb-1">
                    <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                      Projects
                    </span>
                  </div>
                  {teams.map(t => {
                    const searchCollectionId = new URLSearchParams(location.search).get('collectionId')
                    const teamCols = collections.filter(c => c.teamId === t.id)
                    const isPending = t.role === 'PENDING'
                    const teamProjectCol = teamCols.find(c => c.name === t.name)
                    const mainTargetId = teamProjectCol?.id
                    return (
                      <div key={t.id} className="space-y-0.5">
                        <button
                          onClick={() => mainTargetId ? navigate(`/links?collectionId=${mainTargetId}`) : navigate(`/teams/${t.id}`)}
                          className={cn(
                            'flex items-center gap-3 w-full px-3 py-1.5 rounded-lg text-sm transition-colors text-left',
                            !isPending && mainTargetId && searchCollectionId === mainTargetId
                              ? 'bg-primary/10 text-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-muted/50'
                          )}
                        >
                          <FolderKanban size={14} className="shrink-0 text-sidebar-foreground/60" />
                          <span className="truncate flex-1">{t.name}</span>
                          {isPending && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 text-amber-500 px-1.5 py-0 text-[10px] font-medium">
                              <Clock size={10} />
                              Pending
                            </span>
                          )}
                        </button>
                        {!isPending && teamCols.map(col => (
                          col.name !== t.name && (
                            <button
                              key={col.id}
                              onClick={() => navigate(`/links?collectionId=${col.id}`)}
                              className={cn(
                                'flex items-center gap-3 w-full pl-8 pr-3 py-1 rounded-lg text-xs transition-colors text-left',
                                searchCollectionId === col.id
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-sidebar-foreground/70 hover:bg-sidebar-muted/50'
                              )}
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                              <span className="truncate">{col.name}</span>
                            </button>
                          )
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          {!collapsed && user?.email && (
            <span className="text-xs text-sidebar-foreground/60 block truncate">{user.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogoutIcon size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
