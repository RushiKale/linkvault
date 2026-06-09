import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrganizations, createOrganization, getTeams, createTeam } from '../lib/api'
import { cn } from '../lib/utils'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'

interface Org { id: string; name: string; slug: string; createdAt: string }
interface Team { id: string; orgId: string; name: string; slug: string; description?: string; createdAt: string; role: string; memberCount: number }

export default function Teams() {
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamSlug, setTeamSlug] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  const [teamOrgId, setTeamOrgId] = useState('')

  function load() {
    setLoading(true)
    setError('')
    Promise.all([getOrganizations(), getTeams()])
      .then(([o, t]) => { setOrgs(o as Org[]); setTeams(t as Team[]) })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName || !orgSlug) return
    createOrganization({ name: orgName, slug: orgSlug })
      .then(() => { setShowOrgForm(false); setOrgName(''); setOrgSlug(''); load() })
      .catch((e: any) => setError(e.message))
  }

  function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName || !teamSlug || !teamOrgId) return
    createTeam({ orgId: teamOrgId, name: teamName, slug: teamSlug, description: teamDesc || undefined })
      .then(() => { setShowTeamForm(false); setTeamName(''); setTeamSlug(''); setTeamDesc(''); setTeamOrgId(''); load() })
      .catch((e: any) => setError(e.message))
  }

  const isMasterAdmin = teams.some(t => t.role === 'MASTER_ADMIN')

  function toggleOrg(id: string) {
    setExpandedOrgs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const roleBadge = (role: string) => cn(
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors',
    role === 'MASTER_ADMIN' && 'border-transparent bg-destructive/15 text-destructive',
    role === 'ADMIN' && 'border-transparent bg-amber-500/15 text-amber-500',
    role === 'MEMBER' && 'border-transparent bg-primary/15 text-primary',
    role === 'PENDING' && 'border-transparent bg-muted text-muted-foreground',
  )

  const inputClass = "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your organizations and teams</p>
        </div>
        {isMasterAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowTeamForm(!showTeamForm)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-1">
              <Plus size={16} /> New Team
            </button>
            <button onClick={() => setShowOrgForm(!showOrgForm)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-1">
              <Plus size={16} /> New Organization
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg py-2 px-3">{error}</p>}

      {showOrgForm && (
        <form onSubmit={handleCreateOrg} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <input placeholder="Organization name" value={orgName} onChange={e => setOrgName(e.target.value)} required className={inputClass} />
          <input placeholder="Slug (e.g. my-org)" value={orgSlug} onChange={e => setOrgSlug(e.target.value)} required className={inputClass} />
          <button type="submit"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Create Organization
          </button>
        </form>
      )}

      {showTeamForm && (
        <form onSubmit={handleCreateTeam} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <select value={teamOrgId} onChange={e => setTeamOrgId(e.target.value)} required className={inputClass}>
            <option value="">Select organization</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} required className={inputClass} />
          <input placeholder="Slug (e.g. my-team)" value={teamSlug} onChange={e => setTeamSlug(e.target.value)} required className={inputClass} />
          <textarea placeholder="Description (optional)" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} rows={2}
            className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" />
          <button type="submit"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Create Team
          </button>
        </form>
      )}

      {orgs.length === 0 && !loading && (
        <div className="text-center text-muted-foreground py-10">
          <p>No organizations yet</p>
          <p className="text-sm mt-1">Create an organization to start managing teams</p>
        </div>
      )}

      <div className="space-y-4">
        {orgs.map(org => {
          const orgTeamList = teams.filter(t => t.orgId === org.id)
          const isExpanded = expandedOrgs.has(org.id)
          return (
            <div key={org.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleOrg(org.id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  <span className="font-medium">{org.name}</span>
                  <span className="inline-flex items-center rounded-md border border-transparent bg-accent text-accent-foreground px-2 py-0.5 text-xs font-medium">{org.slug}</span>
                </div>
                <span className="text-xs text-muted-foreground">{orgTeamList.length} team{orgTeamList.length !== 1 ? 's' : ''}</span>
              </button>
              {isExpanded && (
                <div className="border-t border-border">
                  {orgTeamList.length === 0 && (
                    <p className="text-sm text-muted-foreground py-6 text-center">No teams in this organization</p>
                  )}
                  {orgTeamList.map(team => (
                    <button
                      key={team.id}
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div>
                        <span className="text-sm font-medium">{team.name}</span>
                        {team.description && <span className="text-xs text-muted-foreground block">{team.description}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={roleBadge(team.role)}>{team.role}</span>
                        <span className="text-xs text-muted-foreground">{team.memberCount}m</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )})}
      </div>
    </div>
  )
}
