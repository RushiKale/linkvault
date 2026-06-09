'use client';

import { useLinks, useCollections, useFavorites } from '@/lib/hooks';
import { Link2, FolderOpen, Star, Activity } from 'lucide-react';

export function StatsCards() {
  const { data: linksData } = useLinks({ limit: '1' });
  const { data: collections } = useCollections();
  const { data: favorites } = useFavorites();

  const totalLinks = linksData?.total ?? 0;
  const totalCollections = collections?.length ?? 0;
  const totalFavorites = favorites?.length ?? 0;

  const cards = [
    { label: 'Total Links', value: totalLinks, icon: Link2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Collections', value: totalCollections, icon: FolderOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Favorites', value: totalFavorites, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Saved This Week', value: '—', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
