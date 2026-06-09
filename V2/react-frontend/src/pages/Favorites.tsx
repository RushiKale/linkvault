import { useEffect, useState } from 'react'
import { Link as LinkIcon, ExternalLink, Trash2, Star } from 'lucide-react'
import { getFavorites, toggleFavorite } from '../lib/api'

interface CollectionInfo {
  id: string; name: string; color: string
}
interface Link {
  id: string; url: string; title: string; description?: string; faviconUrl?: string
  collectionId: string; collectionName: string; collection?: CollectionInfo; tags: string[]
  isFavorited: boolean; createdAt: string; favoritedAt: string
}

export default function Favorites() {
  const [links, setLinks] = useState<Link[]>([])

  function loadFavorites() {
    getFavorites().then((d: any) => setLinks(d || []))
  }

  useEffect(() => { loadFavorites() }, [])

  function handleUnfavorite(id: string) {
    toggleFavorite(id).then(() => loadFavorites())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star size={20} className="text-amber-500" />
        <h1 className="text-2xl font-semibold">Favorites</h1>
      </div>

      <div className="space-y-2">
        {links.map(link => (
          <div key={link.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
            {link.faviconUrl ? (
              <img src={link.faviconUrl} alt="" className="w-5 h-5 rounded shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <LinkIcon size={18} className="shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                {link.title}
                <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
              </a>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{link.url}</p>
              {link.collection?.name && (
                <span
                  className="inline-flex items-center rounded-md border border-transparent px-1.5 py-0 text-[10px] font-medium mt-1"
                  style={{ backgroundColor: (link.collection?.color || '#6366f1') + '20', color: link.collection?.color || '#6366f1' }}
                >
                  {link.collection.name}
                </span>
              )}
            </div>
            <button onClick={() => handleUnfavorite(link.id)}
              className="p-1.5 rounded text-amber-500 hover:text-amber-600 transition-colors" title="Remove from favorites">
              <Star size={16} />
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <p>No favorites yet. Star links to add them here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
