export interface Collection {
  id: string;
  name: string;
  color: string;
  order: number;
  count: number;
  teamId?: string;
}

export interface SavePayload {
  url: string;
  title: string;
  description: string;
  faviconUrl: string;
  imageUrl: string;
  collectionId: string;
  tags: string[];
  notes: string;
}

export interface StorageData {
  token: string;
  collections: Collection[];
}
