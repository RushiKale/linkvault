import { getToken, getCollections, saveLink, getPageMetadata, login, fetchTags, searchLinks } from './utils/api.js';
import type { Collection } from './types/index.js';

let collections: Collection[] = [];
let token: string | null = null;

async function init() {
  token = await getToken();

  if (!token) {
    showLogin();
    return;
  }

  try {
    collections = await getCollections();
    showPopup();
  } catch {
    showLogin();
  }
}

function showLogin() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="p-4 space-y-3" style="width: 320px;">
      <a href="http://localhost:2000/dashboard" target="_blank" style="text-decoration:none;color:inherit">
        <h2 class="text-lg font-semibold">LinkSaver</h2>
      </a>
      <p class="text-sm text-muted">Sign in to save links</p>
      <input id="email" type="email" placeholder="Email" class="input" />
      <input id="password" type="password" placeholder="Password" class="input" />
      <button id="login-btn" class="btn btn-primary w-full">Sign In</button>
      <p id="error" class="text-sm text-red-500 hidden"></p>
      <a href="http://localhost:2000/login" target="_blank" class="text-sm text-center block text-primary">
        Create an account
      </a>
    </div>
  `;

  document.getElementById('login-btn')!.addEventListener('click', async () => {
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    try {
      await login(email, password);
      init();
    } catch (e: any) {
      const err = document.getElementById('error')!;
      err.textContent = e.message;
      err.classList.remove('hidden');
    }
  });
}

function showPopup() {
  getPageMetadata().then((meta) => {
    const state = {
      selectedTags: [] as string[],
      tagInput: '',
      tagSuggestions: [] as string[],
      showSuggestions: false,
      pickingRef: false,
    };
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let blurTimer: ReturnType<typeof setTimeout> | null = null;
    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    let searchActiveTag: string | null = null;

    const app = document.getElementById('app')!;
    app.innerHTML = `
      <div style="width: 360px; padding: 16px;">
        <div class="flex items-center gap-2 mb-4">
          <a href="http://localhost:2000/dashboard" target="_blank" class="flex items-center gap-2" style="text-decoration:none;color:inherit">
            <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold">L</div>
            <h2 class="font-semibold text-sm">LinkSaver</h2>
          </a>
          <div class="flex-1"></div>
          <div class="tabs">
            <button class="tab" data-view="save">Save</button>
            <button class="tab tab-active" data-view="search">Search</button>
          </div>
        </div>

        <div id="view-save" class="hidden">
          <div class="mb-3">
            <label class="text-xs font-medium text-muted mb-1 block">Title</label>
            <input id="title" class="input" value="${escapeHtml(meta.title)}" />
          </div>

          <div class="mb-3">
            <label class="text-xs font-medium text-muted mb-1 block">URL</label>
            <input id="url" class="input" value="${escapeHtml(meta.url)}" />
          </div>

          <div class="mb-3">
            <label class="text-xs font-medium text-muted mb-1 block">Collection</label>
            <select id="collection" class="input">
              ${collections.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>

          <div class="mb-3">
            <label class="text-xs font-medium text-muted mb-1 block">Tags</label>
            <div class="relative">
              <div id="tag-container" class="tag-container">
                <input id="tag-input" class="tag-input" placeholder="Type to search or add tags..." autocomplete="off" />
              </div>
              <div id="tag-suggestions" class="tag-suggestions hidden">
                <div class="suggestions-header">Existing tags</div>
                <div id="suggestions-list" class="suggestions-list"></div>
                <div id="suggestions-add" class="suggestions-add hidden">
                  <button>
                    <span class="suggestions-add-icon">+</span>
                    Add "<span id="suggestions-add-text"></span>"
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="text-xs font-medium text-muted mb-1 block">Notes</label>
            <textarea id="notes" class="input" rows="2" placeholder="Optional notes..."></textarea>
          </div>

          <button id="save-btn" class="btn btn-primary w-full">Save Link</button>
          <p id="status" class="text-sm mt-2 text-center hidden"></p>
        </div>

        <div id="view-search">
          <input id="search-input" class="search-input" placeholder="Search your links..." autocomplete="off" />
          <div class="popup-tag-filter-area">
            <div id="popup-tag-filter" class="popup-tag-filter relative">
              <input id="popup-tag-filter-input" class="popup-tag-filter-input" type="text" placeholder="Filter by tag..." autocomplete="off" />
              <div id="popup-tag-filter-suggestions" class="popup-tag-filter-suggestions hidden"></div>
            </div>
            <div id="popup-tag-filter-chip" class="popup-tag-filter-chip hidden">
              <span>tag: <strong id="popup-tag-filter-chip-label"></strong></span>
              <button id="popup-tag-filter-chip-clear">&times;</button>
            </div>
          </div>
          <div id="search-results" class="search-results"></div>
        </div>
      </div>
    `;

    // Tab switching
    document.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('tab-active'));
        btn.classList.add('tab-active');
        const view = (btn as HTMLElement).dataset.view!;
        document.getElementById('view-save')!.classList.toggle('hidden', view !== 'save');
        document.getElementById('view-search')!.classList.toggle('hidden', view !== 'search');
        if (view === 'search') {
          document.getElementById('search-input')!.focus();
        }
      });
    });

    // --- Save view ---
    const tagInputEl = document.getElementById('tag-input') as HTMLInputElement;
    const tagContainerEl = document.getElementById('tag-container')!;
    const suggestionsEl = document.getElementById('tag-suggestions')!;
    const suggestionsListEl = document.getElementById('suggestions-list')!;
    const suggestionsAddEl = document.getElementById('suggestions-add')!;
    const suggestionsAddTextEl = document.getElementById('suggestions-add-text')!;
    const suggestionsAddBtn = suggestionsAddEl.querySelector('button')!;

    function renderChips() {
      tagContainerEl.querySelectorAll('.tag-badge').forEach((el) => el.remove());
      state.selectedTags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'tag-badge';
        chip.innerHTML = `${escapeHtml(tag)}<button data-tag="${escapeHtml(tag)}">&times;</button>`;
        chip.querySelector('button')!.addEventListener('click', (e) => {
          e.stopPropagation();
          state.selectedTags = state.selectedTags.filter((t) => t !== tag);
          renderChips();
          tagInputEl.focus();
        });
        tagContainerEl.insertBefore(chip, tagInputEl);
      });
    }

    function renderSuggestions() {
      if (!state.showSuggestions) {
        suggestionsEl.classList.add('hidden');
        suggestionsListEl.innerHTML = '';
        suggestionsAddEl.classList.add('hidden');
        return;
      }
      suggestionsEl.classList.remove('hidden');

      if (state.tagSuggestions.length > 0) {
        suggestionsListEl.innerHTML = state.tagSuggestions
          .map((t) => `<button class="suggestion-item" data-tag="${escapeHtml(t)}"><span class="suggestion-dot"></span>${escapeHtml(t)}</button>`)
          .join('');
        suggestionsListEl.querySelectorAll('.suggestion-item').forEach((btn) => {
          btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            state.pickingRef = true;
            const tag = (e.currentTarget as HTMLElement).dataset.tag!;
            addTag(tag);
          });
        });
      } else {
        suggestionsListEl.innerHTML = '';
      }

      if (state.tagInput) {
        suggestionsAddTextEl.textContent = state.tagInput;
        suggestionsAddEl.classList.remove('hidden');
      } else {
        suggestionsAddEl.classList.add('hidden');
      }
    }

    function addTag(name: string) {
      const trimmed = name.trim().toLowerCase();
      if (trimmed && !state.selectedTags.includes(trimmed)) {
        state.selectedTags.push(trimmed);
        renderChips();
      }
      state.tagInput = '';
      tagInputEl.value = '';
      tagInputEl.focus();
      fetchSuggestions('');
    }

    async function fetchSuggestions(q: string) {
      try {
        const tags = await fetchTags(q || undefined);
        state.tagSuggestions = tags.filter((t) => !state.selectedTags.includes(t));
        renderSuggestions();
      } catch {
        state.tagSuggestions = [];
        renderSuggestions();
      }
    }

    tagInputEl.addEventListener('input', () => {
      state.tagInput = tagInputEl.value;
      if (state.tagInput.endsWith(',')) {
        addTag(state.tagInput.slice(0, -1));
        return;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchSuggestions(state.tagInput);
        state.showSuggestions = true;
        renderSuggestions();
      }, 150);
    });

    tagInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        if (state.tagInput) addTag(state.tagInput);
      }
      if (e.key === 'Backspace' && !state.tagInput && state.selectedTags.length > 0) {
        state.selectedTags.pop();
        renderChips();
      }
    });

    tagInputEl.addEventListener('focus', () => {
      if (blurTimer) clearTimeout(blurTimer);
      state.pickingRef = false;
      state.showSuggestions = true;
      fetchSuggestions(state.tagInput);
      renderSuggestions();
    });

    tagInputEl.addEventListener('blur', () => {
      blurTimer = setTimeout(() => {
        if (!state.pickingRef) {
          state.showSuggestions = false;
          renderSuggestions();
        }
        state.pickingRef = false;
      }, 180);
    });

    tagContainerEl.addEventListener('click', () => tagInputEl.focus());

    suggestionsAddBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      state.pickingRef = true;
      if (state.tagInput) addTag(state.tagInput);
    });

    document.getElementById('save-btn')!.addEventListener('click', async () => {
      const title = (document.getElementById('title') as HTMLInputElement).value;
      const url = (document.getElementById('url') as HTMLInputElement).value;
      const collectionId = (document.getElementById('collection') as HTMLSelectElement).value;
      const notes = (document.getElementById('notes') as HTMLTextAreaElement).value;

      if (!url) return;

      try {
        await saveLink({
          url,
          title: title || url,
          collectionId,
          tags: state.selectedTags,
          notes,
          faviconUrl: meta.faviconUrl,
          description: meta.description,
          imageUrl: meta.imageUrl,
        });
        const status = document.getElementById('status')!;
        status.textContent = '✓ Saved successfully!';
        status.className = 'text-sm mt-2 text-center text-green-500';
        status.classList.remove('hidden');
        setTimeout(() => window.close(), 1500);
      } catch (e: any) {
        const status = document.getElementById('status')!;
        status.textContent = `Error: ${e.message}`;
        status.className = 'text-sm mt-2 text-center text-red-500';
        status.classList.remove('hidden');
      }
    });

    fetchSuggestions('');

    // Focus search input by default (Search tab is active)
    document.getElementById('search-input')?.focus();

    // --- Search view ---
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const searchResults = document.getElementById('search-results')!;
    setupPopupTagFilter();

    function setupPopupTagFilter() {
      const container = document.getElementById('popup-tag-filter')!;
      const input = document.getElementById('popup-tag-filter-input') as HTMLInputElement;
      const suggestionsEl = document.getElementById('popup-tag-filter-suggestions')!;
      const chipEl = document.getElementById('popup-tag-filter-chip')!;
      const chipLabel = document.getElementById('popup-tag-filter-chip-label')!;
      const chipClear = document.getElementById('popup-tag-filter-chip-clear')!;

      let allTags: string[] = [];
      let tagTimer: ReturnType<typeof setTimeout> | null = null;

      fetchTags().then((tags) => { allTags = tags; }).catch(() => {});

      function showSuggestions(matching: string[]) {
        if (matching.length === 0) { suggestionsEl.classList.add('hidden'); return; }
        suggestionsEl.classList.remove('hidden');
        suggestionsEl.innerHTML = matching
          .map((t) => `<button class="popup-tag-filter-option" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`)
          .join('');
        suggestionsEl.querySelectorAll('.popup-tag-filter-option').forEach((btn) => {
          btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            selectTag((e.currentTarget as HTMLElement).dataset.tag!);
          });
        });
      }

      function selectTag(tag: string) {
        searchActiveTag = tag;
        chipLabel.textContent = tag;
        chipEl.classList.remove('hidden');
        container.classList.add('hidden');
        doPopupSearch();
      }

      function clearTag() {
        searchActiveTag = null;
        chipEl.classList.add('hidden');
        container.classList.remove('hidden');
        input.value = '';
        suggestionsEl.classList.add('hidden');
        doPopupSearch();
      }

      input.addEventListener('input', () => {
        if (tagTimer) clearTimeout(tagTimer);
        const val = input.value.trim().toLowerCase();
        if (!val) { suggestionsEl.classList.add('hidden'); return; }
        tagTimer = setTimeout(() => {
          showSuggestions(allTags.filter((t) => t.toLowerCase().includes(val)));
        }, 100);
      });

      input.addEventListener('blur', () => {
        setTimeout(() => suggestionsEl.classList.add('hidden'), 200);
      });

      input.addEventListener('focus', () => {
        const val = input.value.trim().toLowerCase();
        if (val) showSuggestions(allTags.filter((t) => t.toLowerCase().includes(val)));
      });

      chipClear.addEventListener('click', clearTag);
    }

    async function doPopupSearch() {
      if (searchTimer) clearTimeout(searchTimer);
      const q = searchInput.value.trim();
      if (!q && !searchActiveTag) {
        searchResults.innerHTML = '';
        return;
      }
      searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
      try {
        const res = await searchLinks(q || '', searchActiveTag || undefined);
        renderPopupResults(res.links);
      } catch {
        searchResults.innerHTML = '<div class="search-empty">Search failed</div>';
      }
    }

    function getFaviconHostname(url: string): string {
      try { return new URL(url).hostname; } catch { return ''; }
    }

    function getFaviconPlaceholder(hostname: string): string {
      return hostname.charAt(0).toUpperCase() || '•';
    }

    function getPopupLinkTags(link: any): string[] {
      if (Array.isArray(link.tags)) {
        return link.tags.map((t: any) => t.tag?.name || t.name || t).filter(Boolean);
      }
      return [];
    }

    function renderPopupResults(links: any[]) {
      if (links.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">No links found</div>';
        return;
      }
      searchResults.innerHTML = links
        .map((link: any) => {
          const hostname = getFaviconHostname(link.url);
          const faviconSrc = link.faviconUrl || `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
          const placeholder = getFaviconPlaceholder(hostname);
          const linkTags = getPopupLinkTags(link);
          const tagsHtml = linkTags.length > 0
            ? `<span class="popup-result-tags">${linkTags.map((t: string) => `<span class="popup-result-tag">${escapeHtml(t)}</span>`).join('')}</span>`
            : '';
          return `<div class="search-result" data-url="${escapeHtml(link.url)}">
            <img class="search-result-favicon" src="${escapeHtml(faviconSrc)}" alt="" />
            <span class="search-result-favicon-placeholder" style="display:none;background:rgba(99,102,241,0.12);color:#6366f1">${escapeHtml(placeholder)}</span>
            <div class="search-result-info">
              <div class="search-result-title">${escapeHtml(link.title || link.url)}</div>
              <div class="search-result-url">${escapeHtml(link.url)}</div>
              ${tagsHtml}
            </div>
            <span class="search-result-meta">${escapeHtml(link.collection?.name || '')}</span>
          </div>`;
        })
        .join('');
      searchResults.querySelectorAll('.search-result').forEach((el) => {
        const img = el.querySelector('.search-result-favicon') as HTMLImageElement;
        const placeholder = el.querySelector('.search-result-favicon-placeholder') as HTMLElement;
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
          chrome.tabs.create({ url });
          window.close();
        });
      });
    }

    searchInput.addEventListener('input', () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(doPopupSearch, 300);
    });
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

init();
