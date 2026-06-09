'use client';

import { useParams } from 'next/navigation';
import { useLinks, useCollections } from '@/lib/hooks';
import { LinkCard } from '@/components/links/link-card';

export default function CollectionPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: collections } = useCollections();
  const collection = collections?.find((c) => c.id === id);

  const isPublic = collection?.name === 'Public';
  const queryParams: Record<string, string> = isPublic ? { scope: 'public' } : { collectionId: id };
  const { data: linksData, isLoading } = useLinks(queryParams);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          {isPublic ? (
            <span className="text-green-500">🌍</span>
          ) : collection ? (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: collection.color }}
            />
          ) : null}
          {collection?.name || 'Collection'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {linksData?.total ?? 0} link{linksData?.total !== 1 ? 's' : ''}
          {isPublic ? ' shared across all users' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : linksData?.links.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No links in this collection</p>
          <p className="text-sm mt-1">
            {isPublic ? 'Be the first to share a link here!' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {linksData?.links.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
