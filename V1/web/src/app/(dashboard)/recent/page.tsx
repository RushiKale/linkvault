'use client';

import { useLinks } from '@/lib/hooks';
import { LinkCard } from '@/components/links/link-card';
import { Clock } from 'lucide-react';

export default function RecentPage() {
  const { data, isLoading } = useLinks({ sort: 'recently_opened', limit: '50' });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Recent
        </h1>
        <p className="text-sm text-muted-foreground">Recently viewed and saved links</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : data?.links.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.links.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
