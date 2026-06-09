'use client';

import { useFavorites } from '@/lib/hooks';
import { LinkCard } from '@/components/links/link-card';
import { Star } from 'lucide-react';

export default function FavoritesPage() {
  const { data: links, isLoading } = useFavorites();

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          Favorites
        </h1>
        <p className="text-sm text-muted-foreground">Your starred links</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : links?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg">No favorites yet</p>
          <p className="text-sm mt-1">Star your important links for quick access</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links?.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
