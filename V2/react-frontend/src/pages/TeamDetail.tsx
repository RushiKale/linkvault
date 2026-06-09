import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTeam, getTeamMembers, updateMemberRole, removeMember, createInvite, renameTeam, getTeamProject, renameProject, deleteProject } from '../lib/api'
import { cn } from '../lib/utils'
import { ArrowLeft, Pencil, Copy, Trash2 } from 'lucide-react'

interface Team { id: string; orgId: string; name: string; slug: string; description?: string; createdAt: string; role: string; memberCount: number }
interface Member { id: string; userId: string; firstName?: string; lastName?: string; role: string; joinedAt: string }
interface Project { id: string; teamId: string; name: string; description: string; createdBy: string; createdAt: string; updatedAt: string }

const roleBadge = (role: string) => cn(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors',
  role === 'MASTER_ADMIN' && 'border-transparent bg-destructive/15 text-destructive',
  role === 'ADMIN' && 'border-transparent bg-amber-500/15 text-amber-500',
  role === 'MEMBER' && 'border-transparent bg-primary/15 text-primary',
  role === 'PENDING' && 'border-transparent bg-muted text-muted-foreground',
)

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingProject, setEditingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const isAdmin = team?.role === 'MASTER_ADMIN' || team?.role === 'ADMIN'

  function load() {
    if (!id) return
    setLoading(true)
    setError('')
    Promise.all([getTeam(id), getTeamMembers(id), getTeamProject(id).catch(() => null)])
      .then(([t, m, p]) => {
        setTeam(t as Team)
        setMembers(m as Member[])
        setProject(p as Project | null)
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  function handleRename() {
    if (!id || !newName) return
    renameTeam(id, newName)
      .then(t => { setTeam(t as Team); setEditingName(false) })
      .catch((e: any) => setError(e.message))
  }

  function handleCreateInvite() {
    if (!id) return
    createInvite(id)
      .then((r: any) => { setInviteToken(r.token); setCopied(false) })
      .catch((e: any) => setError(e.message))
  }

  function handleUpdateRole(userId: string, role: string) {
    if (!id) return
    updateMemberRole(id, userId, role)
      .then(() => load())
      .catch((e: any) => setError(e.message))
  }

  function handleRemoveMember(userId: string) {
    if (!id || !confirm('Remove this member?')) return
    removeMember(id, userId)
      .then(() => load())
      .catch((e: any) => setError(e.message))
  }

  function handleRenameProject() {
    if (!id || !newProjectName) return
    renameProject(id, newProjectName)
      .then(p => { setProject(p as Project); setEditingProject(false) })
      .catch((e: any) => setError(e.message))
  }

  function handleDeleteProject() {
    if (!id || !confirm('Delete this project? This cannot be undone.')) return
    deleteProject(id, true)
      .then(() => setProject(null))
      .catch((e: any) => setError(e.message))
  }

  function copyToken() {
    navigator.clipboard.writeText(inviteToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btnPrimary = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3"
  const btnOutline = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
  const btnGhost = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 px-3"
  const btnDanger = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-8 px-3"
  const inputClass = "flex h-8 w-full max-w-[300px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>
  if (!team) return <div className="text-center text-muted-foreground py-10">Team not found</div>

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/teams')} className={cn(btnGhost, 'gap-1')}>
        <ArrowLeft size={16} /> Back to Teams
      </button>

      {editingName ? (
        <div className="flex items-center gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus className={inputClass} />
          <button onClick={handleRename} className={btnPrimary}>Save</button>
          <button onClick={() => setEditingName(false)} className={btnOutline}>Cancel</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            {isAdmin && (
              <button onClick={() => { setNewName(team.name); setEditingName(true) }} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                <Pencil size={14} />
              </button>
            )}
            <span className={roleBadge(team.role)}>{team.role}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {team.slug} &middot; {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
            {team.description && <> &middot; {team.description}</>}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg py-2 px-3">{error}</p>}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Members</h2>
          {isAdmin && <button onClick={handleCreateInvite} className={btnPrimary}>Invite</button>}
        </div>

        {inviteToken && (
          <div className="flex items-center gap-2 mb-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm">
            <span>
              Invite token: <code className="rounded bg-background px-2 py-0.5 text-xs font-mono">{inviteToken}</code>
            </span>
            <button onClick={copyToken} className={btnOutline}>
              <Copy size={14} className="mr-1" /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {members.length === 0 && <p className="text-sm text-muted-foreground py-6 col-span-full text-center">No members</p>}
          {members.map(m => (
            <div key={m.id} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-3 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {((m.firstName?.[0] || '') + (m.lastName?.[0] || '')).toUpperCase() || m.userId.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-medium truncate max-w-full">{(m.firstName || '') + ' ' + (m.lastName || '')}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{m.userId.slice(0, 8)}…</span>
              <span className={roleBadge(m.role)}>{m.role}</span>
              {isAdmin && m.role !== 'MASTER_ADMIN' && (
                <div className="flex items-center gap-1 mt-1">
                  <select value={m.role} onChange={e => handleUpdateRole(m.userId, e.target.value)}
                    className="flex h-6 rounded border border-input bg-background px-1 text-[10px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                  <button onClick={() => handleRemoveMember(m.userId)} title="Remove member"
                    className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Project</h2>
          {isAdmin && project && !editingProject && (
            <div className="flex gap-2">
              <button onClick={() => { setNewProjectName(project.name); setEditingProject(true) }} className={btnOutline}>Rename</button>
              <button onClick={handleDeleteProject} className={btnDanger}>Delete</button>
            </div>
          )}
        </div>

        {project ? (
          editingProject ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} autoFocus className={inputClass} />
                <button onClick={handleRenameProject} className={btnPrimary}>Save</button>
                <button onClick={() => setEditingProject(false)} className={btnOutline}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">{project.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <p className="text-sm text-muted-foreground py-6 text-center">No project for this team</p>
          </div>
        )}
      </section>
    </div>
  )
}
