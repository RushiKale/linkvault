import { API_URL } from './config.js';

async function request<T>(
  method: string,
  path: string,
  body?: any,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return res.json();
}

export function getToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['token'], (result) => {
      resolve(result.token || null);
    });
  });
}

export async function getCollections() {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  return request<any[]>('GET', '/collections', undefined, token);
}

export async function getTeams() {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  return request<any[]>('GET', '/teams', undefined, token);
}

export async function saveLink(data: any) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  return request<any>('POST', '/links', data, token);
}

export async function login(email: string, password: string) {
  const result = await request<{ token: string }>('POST', '/auth/login', {
    email,
    password,
  });
  await chrome.storage.sync.set({ token: result.token });
  return result;
}

export async function fetchTags(q?: string): Promise<string[]> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const params = q ? `?q=${encodeURIComponent(q)}` : '';
  return request<string[]>('GET', `/tags${params}`, undefined, token);
}

export function getPageMetadata(): Promise<{
  title: string;
  url: string;
  description: string;
  faviconUrl: string;
  imageUrl: string;
}> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      resolve({
        title: tab.title || '',
        url: tab.url || '',
        description: '',
        faviconUrl: tab.favIconUrl || '',
        imageUrl: '',
      });
    });
  });
}

export async function searchLinks(q: string, tag?: string): Promise<{ links: any[]; total: number }> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  let path = `/search?q=${encodeURIComponent(q)}&limit=20`;
  if (tag) path += `&tag=${encodeURIComponent(tag)}`;
  const res = await request<any>('GET', path, undefined, token);
  return { links: res.links || [], total: res.total || 0 };
}

export async function saveAllTabs(collectionId: string) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const tabs = await chrome.tabs.query({});

  let saved = 0;
  for (const tab of tabs) {
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      try {
        await saveLink({
          url: tab.url,
          title: tab.title || tab.url,
          collectionId,
          faviconUrl: tab.favIconUrl || '',
        });
        saved++;
      } catch {}
    }
  }

  return saved;
}
