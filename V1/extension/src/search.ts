import { getToken, searchLinks, fetchTags } from './utils/api.js';

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let activeTag: string | null = null;

async function init() {
  const token = await getToken();

  if (!token) {
    document.getElementById('view-home')!.classList.add('hidden');
    document.getElementById('view-auth')!.classList.remove('hidden');
    return;
  }

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const resultsEl = document.getElementById('results')!;
  setupTagFilter();

  async function doSearch() {
    const q = searchInput.value.trim();
    if (!q && !activeTag) {
      resultsEl.innerHTML = '';
      return;
    }
    resultsEl.innerHTML = '<div class="results-loading">Searching...</div>';
    try {
      const res = await searchLinks(q || '', activeTag || undefined);
      renderResults(res.links, resultsEl);
    } catch {
      resultsEl.innerHTML = '<div class="results-empty">Search failed. Try again.</div>';
    }
  }

  searchInput.addEventListener('input', () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(doSearch, 250);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      if (!activeTag) {
        resultsEl.innerHTML = '';
      } else {
        doSearch();
      }
      searchInput.focus();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !isInputFocused()) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  searchInput.focus();
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function setupTagFilter() {
  const container = document.getElementById('tag-filter')!;
  const input = document.getElementById('tag-filter-input') as HTMLInputElement;
  const suggestionsEl = document.getElementById('tag-filter-suggestions')!;
  const chipEl = document.getElementById('tag-filter-chip')!;
  const chipLabel = document.getElementById('tag-filter-chip-label')!;
  const chipClear = document.getElementById('tag-filter-chip-clear')!;

  let allTags: string[] = [];
  let tagTimer: ReturnType<typeof setTimeout> | null = null;

  fetchTags().then((tags) => {
    allTags = tags;
  }).catch(() => {});

  function showSuggestions(matching: string[]) {
    if (matching.length === 0) {
      suggestionsEl.classList.add('hidden');
      return;
    }
    suggestionsEl.classList.remove('hidden');
    suggestionsEl.innerHTML = matching
      .map((t) => `<button class="tag-filter-option" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`)
      .join('');
    suggestionsEl.querySelectorAll('.tag-filter-option').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectTag((e.currentTarget as HTMLElement).dataset.tag!);
      });
    });
  }

  function selectTag(tag: string) {
    activeTag = tag;
    chipLabel.textContent = tag;
    chipEl.classList.remove('hidden');
    container.classList.add('hidden');
    doFilteredSearch();
  }

  function clearTag() {
    activeTag = null;
    chipEl.classList.add('hidden');
    container.classList.remove('hidden');
    input.value = '';
    suggestionsEl.classList.add('hidden');
    doFilteredSearch();
  }

  async function doFilteredSearch() {
    const q = (document.getElementById('search-input') as HTMLInputElement).value.trim();
    const resultsEl = document.getElementById('results')!;
    if (searchTimer) clearTimeout(searchTimer);
    if (!q && !activeTag) {
      resultsEl.innerHTML = '';
      return;
    }
    resultsEl.innerHTML = '<div class="results-loading">Searching...</div>';
    try {
      const res = await searchLinks(q || '', activeTag || undefined);
      renderResults(res.links, resultsEl);
    } catch {
      resultsEl.innerHTML = '<div class="results-empty">Search failed. Try again.</div>';
    }
  }

  input.addEventListener('input', () => {
    if (tagTimer) clearTimeout(tagTimer);
    const val = input.value.trim().toLowerCase();
    if (!val) {
      suggestionsEl.classList.add('hidden');
      return;
    }
    tagTimer = setTimeout(() => {
      const matching = allTags.filter((t) => t.toLowerCase().includes(val));
      showSuggestions(matching);
    }, 100);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => suggestionsEl.classList.add('hidden'), 200);
  });

  input.addEventListener('focus', () => {
    const val = input.value.trim().toLowerCase();
    if (val) {
      const matching = allTags.filter((t) => t.toLowerCase().includes(val));
      showSuggestions(matching);
    }
  });

  chipClear.addEventListener('click', clearTag);
}

function getLinkTags(link: any): string[] {
  if (Array.isArray(link.tags)) {
    return link.tags.map((t: any) => t.tag?.name || t.name || t).filter(Boolean);
  }
  return [];
}

function renderResults(links: any[], container: HTMLElement) {
  if (links.length === 0) {
    container.innerHTML = '<div class="results-empty">No links found</div>';
    return;
  }
  container.innerHTML = links
    .map((link: any) => {
      const collectionColor = link.collection?.color || '#6366f1';
      const hostname = getHostname(link.url);
      const faviconSrc = link.faviconUrl || `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      const placeholder = getFaviconPlaceholder(hostname);
      const linkTags = getLinkTags(link);
      const tagsHtml = linkTags.length > 0
        ? `<span class="result-tags">${linkTags.map((t: string) => `<span class="result-tag">${escapeHtml(t)}</span>`).join('')}</span>`
        : '';
      return `<div class="result-item" data-url="${escapeHtml(link.url)}">
        <img class="result-favicon" src="${escapeHtml(faviconSrc)}" alt="" loading="lazy" />
        <span class="result-favicon-placeholder" style="display:none;background:${collectionColor}20;color:${collectionColor}">${escapeHtml(placeholder)}</span>
        <div class="result-info">
          <div class="result-title">${escapeHtml(link.title || link.url)}</div>
          <div class="result-url">${escapeHtml(link.url)}</div>
          ${tagsHtml}
        </div>
        <span class="result-collection" style="background:${collectionColor}15;color:${collectionColor}">${escapeHtml(link.collection?.name || '')}</span>
      </div>`;
    })
    .join('');
  container.querySelectorAll('.result-item').forEach((el) => {
    const img = el.querySelector('.result-favicon') as HTMLImageElement;
    const placeholder = el.querySelector('.result-favicon-placeholder') as HTMLElement;
    if (img && placeholder) {
      img.addEventListener('error', () => {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      });
      img.addEventListener('load', () => {
        img.style.display = '';
        placeholder.style.display = 'none';
      });
    }
    el.addEventListener('click', () => {
      const url = (el as HTMLElement).dataset.url!;
      window.location.href = url;
    });
  });
}

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

function getFaviconPlaceholder(hostname: string): string {
  return hostname.charAt(0).toUpperCase() || '•';
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', init);
