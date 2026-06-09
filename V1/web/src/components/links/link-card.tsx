'use client';

import { useState, useRef, useEffect } from 'react';
import { Link as LinkType } from '@/types';
import { getFaviconUrl, timeAgo, cn } from '@/lib/utils';
import { useToggleFavorite, useDeleteLink, useCollections } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Star,
  Trash2,
  Edit3,
  MoreHorizontal,
  Check,
  FolderOpen,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface LinkCardProps {
  link: LinkType;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function LinkCard({ link, selected, onSelect }: LinkCardProps) {
  const toggleFavorite = useToggleFavorite();
  const deleteLink = useDeleteLink();
  const { data: collections } = useCollections();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title);
  const [editNotes, setEditNotes] = useState(link.notes || '');
  const [editCollectionId, setEditCollectionId] = useState(link.collection.id);
  const [editTags, setEditTags] = useState<string[]>([...link.tags]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const blurRef = useRef<ReturnType<typeof setTimeout>>();
  const pickingRef = useRef(false);

  const handleOpen = () => {
    window.open(link.url, '_blank', 'noopener noreferrer');
  };

  const fetchTagSuggestions = async (q: string) => {
    const tags = await api.getTags(q || undefined);
    setTagSuggestions(tags.filter((t) => !editTags.includes(t)));
  };

  const addTag = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
    }
    setTagInput('');
    tagInputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    setEditTags(editTags.filter((t) => t !== name));
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    if (value.endsWith(',')) {
      addTag(value.slice(0, -1));
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTagSuggestions(value);
      setShowSuggestions(true);
    }, 150);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && editTags.length) {
      removeTag(editTags[editTags.length - 1]);
    }
  };

  const handleSuggestMouseDown = (tag: string) => {
    pickingRef.current = true;
    addTag(tag);
  };

  const handleUpdate = async () => {
    try {
      await api.updateLink(link.id, {
        title: editTitle,
        notes: editNotes,
        collectionId: editCollectionId,
        tags: editTags,
      });
      qc.invalidateQueries({ queryKey: ['links'] });
      setShowEdit(false);
    } catch {}
  };

  useEffect(() => {
    if (showEdit) {
      setEditTitle(link.title);
      setEditNotes(link.notes || '');
      setEditCollectionId(link.collection.id);
      setEditTags([...link.tags]);
      setTagInput('');
      setTagSuggestions([]);
      fetchTagSuggestions('');
      setShowSuggestions(false);
    }
  }, [showEdit]);

  const favicon =
    link.faviconUrl || getFaviconUrl(link.url);

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all',
        selected && 'border-primary/50 bg-primary/5',
      )}
    >
      {onSelect && (
        <button
          onClick={() => onSelect(link.id)}
          className={cn(
            'absolute top-2 left-2 w-5 h-5 rounded border border-muted-foreground/30 flex items-center justify-center transition-colors',
            selected && 'bg-primary border-primary',
          )}
        >
          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
        </button>
      )}

      <img
        src={favicon || ''}
        alt=""
        className="w-6 h-6 rounded flex-shrink-0 mt-0.5"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`;
        }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <button
              onClick={handleOpen}
              className="text-sm font-medium hover:text-primary transition-colors text-left line-clamp-1"
            >
              {link.title}
            </button>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {link.url}
            </p>
            {link.addedBy && (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                added by {link.addedBy}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleFavorite.mutate(link.id)}
            >
              <Star
                className={cn(
                  'w-3.5 h-3.5',
                  link.isFavorite
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-muted-foreground',
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowEdit(true)}
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => {
                if (confirm('Delete this link?')) deleteLink.mutate(link.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {link.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {link.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge
            variant="tag"
            className="text-[10px] px-1.5 py-0"
            style={{ backgroundColor: link.collection.color + '20', color: link.collection.color }}
          >
            {link.collection.name}
          </Badge>
          {link.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="tag" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {timeAgo(link.createdAt)}
          </span>
        </div>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Collection</label>
              <Select
                value={editCollectionId}
                onValueChange={setEditCollectionId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {collections?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags</label>
              <div className="relative">
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all min-h-[42px] cursor-text"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {editTags.map((tag) => (
                    <Badge key={tag} variant="tag" className="flex items-center gap-1 text-xs px-2 py-0.5">
                      {tag}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onFocus={() => {
                      clearTimeout(blurRef.current);
                      pickingRef.current = false;
                      fetchTagSuggestions(tagInput);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      blurRef.current = setTimeout(() => {
                        if (!pickingRef.current) setShowSuggestions(false);
                        pickingRef.current = false;
                      }, 180);
                    }}
                    placeholder={editTags.length ? '' : 'Type to search or add tags...'}
                    className="flex-1 min-w-[100px] border-none outline-none bg-transparent text-sm placeholder:text-muted-foreground"
                  />
                </div>
                {showSuggestions && (
                  <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                    <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Existing tags
                    </div>
                    {tagSuggestions.length > 0 ? (
                      <div className="max-h-36 overflow-y-auto py-1">
                        {tagSuggestions.map((tag) => (
                          <button
                            key={tag}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                            onMouseDown={() => handleSuggestMouseDown(tag)}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                        {tagInput ? `Press Enter to add "${tagInput}"` : 'No existing tags'}
                      </div>
                    )}
                    {tagInput && (
                      <div className="border-t border-border px-2.5 py-1.5">
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm text-primary font-medium rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                          onMouseDown={() => handleSuggestMouseDown(tagInput)}
                        >
                          <span className="flex items-center justify-center w-4 h-4 rounded border border-primary/40 text-primary text-[10px]">+</span>
                          Add "{tagInput}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
