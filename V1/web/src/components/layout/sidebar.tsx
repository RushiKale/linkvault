'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCollections } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Link2,
  Star,
  Clock,
  FolderOpen,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Lock,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { CreateCollectionDialog } from '@/components/collections/create-collection-dialog';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/links', label: 'All Links', icon: Link2 },
  { href: '/favorites', label: 'Favorites', icon: Star },
  { href: '/recent', label: 'Recent', icon: Clock },
];

const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: collections } = useCollections();
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleLogout = () => {
    api.setToken(null);
    router.push('/login');
  };

  const startEditing = (e: React.MouseEvent, collection: { id: string; name: string; color: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(collection.id);
    setEditName(collection.name);
    setEditColor(collection.color);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await api.updateCollection(editingId, { name: editName.trim(), color: editColor });
      qc.invalidateQueries({ queryKey: ['collections'] });
    } catch {}
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this collection? Links will move to Learning.')) return;
    try {
      await api.deleteCollection(id);
      qc.invalidateQueries({ queryKey: ['collections'] });
    } catch {}
  };

  return (
    <aside className="w-64 h-screen flex flex-col bg-sidebar border-r border-border">
      <div className="p-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Link2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">LinkSaver</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-muted/50',
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Collections
            </span>
            <button
              onClick={() => setShowCreateCollection(true)}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {collections?.filter((c) => c.locked).map((collection) => {
          const isActive = pathname === `/collections/${collection.id}`;
          return (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-muted/50',
              )}
            >
              {collection.name === 'Private' ? (
                <Lock className="w-3.5 h-3.5 text-sidebar-foreground/60" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-green-500/70" />
              )}
              <span className="flex-1 truncate">{collection.name}</span>
              <span className="text-xs text-sidebar-foreground/60">
                {collection.count}
              </span>
            </Link>
          );
        })}

        <div className="pt-4 pb-2 flex items-center justify-between px-3">
          <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Collections
          </span>
          <button
            onClick={() => setShowCreateCollection(true)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {collections?.filter((c) => !c.locked).map((collection) => {
          const isActive = pathname === `/collections/${collection.id}`;
          const isEditing = editingId === collection.id;

          if (isEditing) {
            return (
              <div
                key={collection.id}
                className="px-3 py-2 rounded-lg bg-sidebar-muted/30 space-y-2"
              >
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          editColor === c ? 'ring-1 ring-offset-1 ring-foreground scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={saveEdit}
                      className="p-1 rounded hover:bg-accent text-green-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 rounded hover:bg-accent text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-muted/50',
              )}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: collection.color }}
              />
              <span className="flex-1 truncate">{collection.name}</span>
              <span className="text-xs text-sidebar-foreground/60">
                {collection.count}
              </span>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => startEditing(e, collection)}
                  className="p-1 rounded hover:bg-sidebar-muted text-sidebar-foreground/60 hover:text-sidebar-foreground"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, collection.id)}
                  className="p-1 rounded hover:bg-sidebar-muted text-sidebar-foreground/60 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-muted/50',
            pathname === '/settings' && 'bg-primary/10 text-primary',
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Link
          href="/help"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-muted/50',
            pathname === '/help' && 'bg-primary/10 text-primary',
          )}
        >
          <HelpCircle className="w-4 h-4" />
          Help
        </Link>
        <Link
          href="/docs"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-muted/50',
            pathname === '/docs' && 'bg-primary/10 text-primary',
          )}
        >
          <FileText className="w-4 h-4" />
          Docs
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-muted/50 w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <CreateCollectionDialog
        open={showCreateCollection}
        onOpenChange={setShowCreateCollection}
      />
    </aside>
  );
}
