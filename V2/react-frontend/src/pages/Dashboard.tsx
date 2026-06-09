import { useEffect, useState } from 'react'
import { getLinks, getCollections, getActivity } from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState({ totalLinks: 0, collections: 0, recentActivity: 0 })

  useEffect(() => {
    Promise.all([
      getLinks({ limit: '1' }),
      getCollections(),
      getActivity(),
    ]).then(([links, cols, acts]) => {
      setStats({
        totalLinks: (links as any).total || 0,
        collections: (cols as any[]).length,
        recentActivity: (acts as any[]).length,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your link vault</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-3xl font-bold text-primary">{stats.totalLinks}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Links</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-3xl font-bold text-primary">{stats.collections}</div>
          <div className="text-sm text-muted-foreground mt-1">Collections</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-3xl font-bold text-primary">{stats.recentActivity}</div>
          <div className="text-sm text-muted-foreground mt-1">Activities</div>
        </div>
      </div>
    </div>
  )
}
