import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchLinks, deleteLink, toggleFavorite, createLink, updateLink, getCollections, getTags, getTeams } from '../lib/api'
import { cn } from '../lib/utils'

interface CollectionInfo {
  id: string; name: string; color: string
}
interface Link {
  id: string; url: string; title: string; description?: string; notes?: string; faviconUrl?: string
  collectionId: string; collectionName: string; collection?: CollectionInfo; tags: string[]
  isFavorited: boolean; createdAt: string
}

interface Collection { id: string; name: string }
interface Team { id: string; name: string; projectId?: string }

export default function Links() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [links, setLinks] = useState<Link[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState('newest')
  const [collections, setCollections] = useState<Collection[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [addUrl, setAddUrl] = useState('')
  const [addTitle, setAddTitle] = useState('')
  const [addCollection, setAddCollection] = useState('')
  const [addTagInput, setAddTagInput] = useState('')
  const [addTags, setAddTags] = useState<string[]>([])
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editCollection, setEditCollection] = useState('')
  const [editTagInput, setEditTagInput] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkTargetCol, setBulkTargetCol] = useState('')
  const editRef = useRef<HTMLDialogElement>(null)
  const limit = 10

  const activeCollectionId = searchParams.get('collectionId') || ''
  const activeProjectId = searchParams.get('projectId') || ''

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'title', label: 'Alphabetical' },
  ]

  function loadLinks() {
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (q) params.q = q
    if (tag) params.tag = tag
    if (activeCollectionId) params.collectionId = activeCollectionId
    if (activeProjectId) params.projectId = activeProjectId
    if (sort === 'newest') { params.sort = 'createdAt'; params.order = 'desc' }
    else if (sort === 'oldest') { params.sort = 'createdAt'; params.order = 'asc' }
    else if (sort === 'title') { params.sort = 'title'; params.order = 'asc' }
    searchLinks(params).then((d: any) => {
      setLinks(d.links || [])
      setTotal(d.total || 0)
    })
  }

  useEffect(() => {
    getCollections().then((d) => setCollections(d as Collection[]))
    getTeams().then((d) => setTeams(d as Team[]))
  }, [])

  useEffect(() => {
    setPage(0)
    loadLinks()
  }, [tag, sort, activeCollectionId, activeProjectId])

  useEffect(() => {
    loadLinks()
  }, [page])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(0)
    loadLinks()
  }

  function handleTagInput(v: string) {
    if (v.length >= 1) {
      getTags(v).then((d) => setTagSuggestions(d as string[]))
    } else {
      setTagSuggestions([])
    }
  }

  function addTagToFilter(t: string) {
    setTag(t)
    setTagSuggestions([])
    setPage(0)
  }

  function handleToggleFav(id: string) {
    toggleFavorite(id).then(() => loadLinks())
  }

  function handleDelete(id: string) {
    if (confirm('Delete this link?')) deleteLink(id).then(() => loadLinks())
  }

  function handleAddTag(t: string) {
    if (!addTags.includes(t)) setAddTags([...addTags, t])
    setAddTagInput('')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!addUrl || !addTitle || !addCollection) return
    createLink({ url: addUrl, title: addTitle, collectionId: addCollection, tags: addTags })
      .then(() => {
        setShowAddForm(false)
        setAddUrl(''); setAddTitle(''); setAddCollection(''); setAddTags([])
        loadLinks()
      })
  }

  function openEdit(link: Link) {
    setEditingLink(link)
    setEditTitle(link.title)
    setEditDescription(link.description || '')
    setEditNotes(link.notes || '')
    setEditCollection(link.collectionId)
    setEditTags(link.tags)
    setEditTagInput('')
    editRef.current?.showModal()
  }

  function handleEditSave() {
    if (!editingLink) return
    updateLink(editingLink.id, {
      title: editTitle,
      description: editDescription || undefined,
      notes: editNotes || undefined,
      collectionId: editCollection,
      tags: editTags.length > 0 ? editTags : undefined,
    }).then(() => {
      setEditingLink(null)
      editRef.current?.close()
      loadLinks()
    })
  }

  function handleEditAddTag(t: string) {
    if (!editTags.includes(t)) setEditTags([...editTags, t])
    setEditTagInput('')
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(links.map(l => l.id)))
    }
  }

  function handleBulkDelete() {
    if (!selectedIds.size) return
    if (!confirm(`Delete ${selectedIds.size} links?`)) return
    Promise.all([...selectedIds].map(id => deleteLink(id))).then(() => {
      setSelectedIds(new Set())
      loadLinks()
    })
  }

  function handleBulkMove() {
    if (!selectedIds.size || !bulkTargetCol) return
    // Bulk move via individual updates since backend supports it
    Promise.all([...selectedIds].map(id => updateLink(id, { collectionId: bulkTargetCol }))).then(() => {
      setSelectedIds(new Set())
      setBulkTargetCol('')
      loadLinks()
    })
  }

  function getFaviconUrl(url: string) {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
    } catch { return '' }
  }

  const activeCol = collections.find(c => c.id === activeCollectionId)
  const activeTeam = teams.find(t => t.projectId === activeProjectId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">All Links</h1>
          {activeTeam && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-500 px-2.5 py-0.5 text-xs font-medium">
              {activeTeam.name}
              <button onClick={() => { setSearchParams({}); setPage(0) }} className="hover:text-amber-500/80">&times;</button>
            </span>
          )}
          {activeCol && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
              {activeCol.name}
              <button onClick={() => { setSearchParams({}); setPage(0) }} className="hover:text-primary/80">&times;</button>
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          {showAddForm ? 'Cancel' : '+ Add Link'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <input placeholder="URL" value={addUrl} onChange={e => setAddUrl(e.target.value)} required
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          <input placeholder="Title" value={addTitle} onChange={e => setAddTitle(e.target.value)} required
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          <select value={addCollection} onChange={e => setAddCollection(e.target.value)} required
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">Select collection</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="space-y-1">
            <input placeholder="Add tag" value={addTagInput} onChange={e => { setAddTagInput(e.target.value); handleTagInput(e.target.value) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(addTagInput) } }}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <div className="flex gap-1 flex-wrap">
              {addTags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 rounded-md border border-transparent bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                  {t}
                  <button onClick={() => setAddTags(addTags.filter(x => x !== t))} className="hover:text-foreground">&times;</button>
                </span>
              ))}
            </div>
          </div>
          <button type="submit"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Save
          </button>
        </form>
      )}

      {/* Search + sort + bulk bar */}
      <form onSubmit={handleSearch} className="flex gap-2 items-start flex-wrap">
        <input placeholder="Search links..." value={q} onChange={e => setQ(e.target.value)}
          className="flex h-9 min-w-[200px] flex-1 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        <div className="relative">
          <input placeholder="Filter by tag..." value={tag} onChange={e => handleTagInput(e.target.value)}
            className="flex h-9 min-w-[160px] rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          {tagSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-md max-h-48 overflow-y-auto">
              {tagSuggestions.map(s => (
                <div key={s} onClick={() => addTagToFilter(s)}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button type="submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          Search
        </button>
        {tag && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
            {tag}
            <button onClick={() => { setTag(''); setPage(0) }} className="hover:text-primary/80">&times;</button>
          </span>
        )}
      </form>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 text-sm">
          <span className="font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} className="text-destructive hover:underline">Delete</button>
          <select value={bulkTargetCol} onChange={e => setBulkTargetCol(e.target.value)}
            className="flex h-8 rounded-lg border border-input bg-background px-2 py-0 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">Move to...</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {bulkTargetCol && (
            <button onClick={handleBulkMove} className="text-primary hover:underline">Move</button>
          )}
          <button onClick={() => setSelectedIds(new Set())} className="text-muted-foreground hover:underline ml-auto">Clear</button>
        </div>
      )}

      {/* Link cards */}
      <div className="space-y-2">
        {links.length > 0 && (
          <div className="flex items-center gap-2 px-1 pb-1">
            <input type="checkbox" checked={selectedIds.size === links.length} onChange={toggleSelectAll}
              className="rounded border-border" />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>
        )}
        {links.map(link => (
          <div key={link.id} className={cn(
            'rounded-xl border bg-card p-3 flex items-center gap-3 transition-colors',
            selectedIds.has(link.id) ? 'border-primary/30 bg-primary/5' : 'border-border'
          )}>
            <input type="checkbox" checked={selectedIds.has(link.id)} onChange={() => toggleSelect(link.id)}
              className="rounded border-border shrink-0" />
            {link.faviconUrl ? (
              <img src={link.faviconUrl} alt="" className="w-5 h-5 rounded shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <img src={getFaviconUrl(link.url)} alt="" className="w-5 h-5 rounded shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <div className="flex-1 min-w-0">
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                {link.title}
              </a>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{link.url}</p>
              {link.description && <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="inline-flex items-center rounded-md border border-transparent px-1.5 py-0 text-[10px] font-medium"
                  style={{ backgroundColor: (link.collection?.color || '#6366f1') + '20', color: link.collection?.color || '#6366f1' }}
                >
                  {link.collection?.name || link.collectionName}
                </span>
                {link.tags.slice(0, 3).map(t => (
                  <span key={t} className="inline-flex items-center rounded-md border border-transparent bg-accent text-accent-foreground px-1.5 py-0 text-[10px] font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openEdit(link)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors text-xs" title="Edit">
                ✎
              </button>
              <button onClick={() => handleToggleFav(link.id)}
                className={cn('p-1 rounded text-muted-foreground hover:text-foreground transition-colors', link.isFavorited && 'text-amber-500')}>
                {link.isFavorited ? '★' : '☆'}
              </button>
              <button onClick={() => handleDelete(link.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors text-sm">
                ✕
              </button>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <p>No links found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3 mt-5 text-sm text-muted-foreground">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
            Previous
          </button>
          <span>Page {page + 1} of {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit) - 1} onClick={() => setPage(page + 1)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
            Next
          </button>
        </div>
      )}

      {/* Edit dialog */}
      <dialog ref={editRef} className="rounded-xl border border-border bg-card p-6 w-full max-w-lg backdrop:bg-black/50">
        {editingLink && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Edit Link</h2>
            <input placeholder="Title" value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <input placeholder="Description" value={editDescription} onChange={e => setEditDescription(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <textarea placeholder="Notes" value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" />
            <select value={editCollection} onChange={e => setEditCollection(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="space-y-1">
              <input placeholder="Add tag" value={editTagInput} onChange={e => { setEditTagInput(e.target.value); handleTagInput(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEditAddTag(editTagInput) } }}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <div className="flex gap-1 flex-wrap">
                {editTags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md border border-transparent bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    {t}
                    <button onClick={() => setEditTags(editTags.filter(x => x !== t))} className="hover:text-foreground">&times;</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { editRef.current?.close(); setEditingLink(null) }}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                Cancel
              </button>
              <button onClick={handleEditSave}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                Save
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  )
}
