import { Shield, ShieldCheck, Eye } from 'lucide-react'

const roles = [
  { icon: Shield, name: 'MASTER_ADMIN', email: 'master@sn.com', password: 'password123', color: 'text-destructive', bg: 'bg-destructive/15' },
  { icon: ShieldCheck, name: 'ADMIN', email: 'admin@test.com', password: 'password123', color: 'text-amber-500', bg: 'bg-amber-500/15' },
  { icon: Eye, name: 'MEMBER', email: 'member@test.com', password: 'password123', color: 'text-primary', bg: 'bg-primary/15' },
]

export default function Help() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Help</h1>
        <p className="text-sm text-muted-foreground mt-1">Login credentials for testing</p>
      </div>

      <div className="space-y-3">
        {roles.map(r => {
          const Icon = r.icon
          return (
            <div key={r.name} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-1.5 rounded-md ${r.bg}`}>
                  <Icon size={16} className={r.color} />
                </div>
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${r.bg} ${r.color} border-transparent`}>
                  {r.name}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Email:</span> {r.email}</p>
                <p><span className="text-muted-foreground">Password:</span> {r.password}</p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">All 3 users are members of the RevEx team. Login at /login to test role-based access.</p>
    </div>
  )
}
