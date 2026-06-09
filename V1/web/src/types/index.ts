export interface Collection {
  id: string;
  name: string;
  color: string;
  order: number;
  locked: boolean;
  count: number;
  createdAt: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
  collection: { id: string; name: string; color: string };
  tags: string[];
  isFavorite: boolean;
  addedBy: string | null;
}

export interface LinksResponse {
  links: Link[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  tags: string[];
  collection: { id: string; name: string; color: string };
  isFavorite: boolean;
  createdAt: string;
  addedBy: string | null;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  links: {
    url: string;
    title: string;
    description: string | null;
    notes: string | null;
    collection: string;
    tags: string[];
    createdAt: string;
  }[];
}
