'use client';

import { useState } from 'react';
import { useLinks } from '@/lib/hooks';
import { LinkCard } from '@/components/links/link-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Trash2, FolderOpen, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollections } from '@/lib/hooks';
import type { ExportData } from '@/types';

export default function LinksPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const params: Record<string, string> = { page: String(page), limit: '50', sort };
  if (search) params.search = search;
  if (collectionFilter && collectionFilter !== 'all') params.collectionId = collectionFilter;

  const { data, isLoading } = useLinks(params);
  const { data: collections } = useCollections();

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} links?`)) return;
    await api.bulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ['links'] });
    qc.invalidateQueries({ queryKey: ['collections'] });
  };

  const handleBulkMove = async (collectionId: string) => {
    await api.bulkMove(Array.from(selectedIds), collectionId);
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ['links'] });
  };

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkvault-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      const result = await api.importData({ links: data.links });
      alert(`Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
    } catch {
      alert('Invalid file format');
    }
    e.target.value = '';
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">All Links</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} total links
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Plus className="w-4 h-4 mr-1" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={collectionFilter} onValueChange={(v) => { setCollectionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="alphabetical">A-Z</SelectItem>
            <SelectItem value="most_opened">Most Opened</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground mr-2">
            {selectedIds.size} selected
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <Select onValueChange={handleBulkMove}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              {collections?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : data?.links.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No links found</p>
          <p className="text-sm mt-1">Save your first link to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              selected={selectedIds.has(link.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-4">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
