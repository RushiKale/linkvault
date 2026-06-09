const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2001';

let toastError: ((msg: string) => void) | null = null;

export function setToastErrorHandler(fn: (msg: string) => void) {
  toastError = fn;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    options?: RequestInit,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      const msg = error.message || error.error || 'Request failed';
      toastError?.(msg);
      throw new Error(msg);
    }

    if (res.headers.get('content-type')?.includes('application/json')) {
      return res.json();
    }

    return undefined as T;
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: any) {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: any) {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }

  // Auth
  login(email: string, password: string) {
    return this.post<{ token: string }>('/auth/login', { email, password });
  }

  register(email: string, password: string, firstName?: string, lastName?: string) {
    return this.post<{ token: string }>('/auth/register', { email, password, firstName, lastName });
  }

  getProfile() {
    return this.get<{ id: string; email: string; firstName?: string; lastName?: string }>('/auth/me');
  }

  // Links
  getLinks(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<import('@/types').LinksResponse>(`/links${qs}`);
  }

  getLink(id: string) {
    return this.get<import('@/types').Link>(`/links/${id}`);
  }

  createLink(data: any) {
    return this.post<import('@/types').Link>('/links', data);
  }

  updateLink(id: string, data: any) {
    return this.put<import('@/types').Link>(`/links/${id}`, data);
  }

  deleteLink(id: string) {
    return this.delete<{ deleted: boolean }>(`/links/${id}`);
  }

  bulkDelete(ids: string[]) {
    return this.post<{ deleted: number }>('/links/bulk/delete', { ids });
  }

  bulkMove(ids: string[], collectionId: string) {
    return this.post<{ moved: number }>('/links/bulk/move', { ids, collectionId });
  }

  // Search
  search(q: string, filters?: Record<string, string>) {
    const params = new URLSearchParams({ q, ...filters });
    return this.get<import('@/types').SearchResult[]>(`/search?${params}`);
  }

  // Collections
  getCollections() {
    return this.get<import('@/types').Collection[]>('/collections');
  }

  createCollection(data: { name: string; color?: string }) {
    return this.post<import('@/types').Collection>('/collections', data);
  }

  updateCollection(id: string, data: any) {
    return this.put<import('@/types').Collection>(`/collections/${id}`, data);
  }

  deleteCollection(id: string) {
    return this.delete<{ deleted: boolean }>(`/collections/${id}`);
  }

  // Favorites
  toggleFavorite(linkId: string) {
    return this.post<{ favorited: boolean }>(`/favorites/${linkId}`);
  }

  getFavorites() {
    return this.get<import('@/types').Link[]>('/favorites');
  }

  // Tags
  getTags(q?: string) {
    const params = q ? '?' + new URLSearchParams({ q }).toString() : '';
    return this.get<string[]>(`/tags${params}`);
  }

  // Import/Export
  exportData() {
    return this.get<import('@/types').ExportData>('/export');
  }

  importData(data: { links: any[] }) {
    return this.post<{ imported: number; skipped: number; errors: number }>(
      '/import',
      data,
    );
  }
}

export const api = new ApiClient();
