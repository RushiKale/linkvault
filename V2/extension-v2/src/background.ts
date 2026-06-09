import { getToken, saveLink, getCollections } from './utils/api.js';

const MENU_COLLECTIONS: Record<string, string> = {
  'save-to-learning': 'Learning',
  'save-to-work': 'Work',
  'save-to-ai': 'AI',
  'save-to-personal': 'Personal',
};

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

function createContextMenus() {
  chrome.contextMenus.create({
    id: 'save-current-page',
    title: 'Save Current Page to LinkSaver',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'save-link',
    title: 'Save This Link to LinkSaver',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: 'save-all-tabs',
    title: 'Save All Tabs to LinkSaver',
    contexts: ['action'],
  });

  ['Learning', 'Work', 'AI', 'Personal'].forEach((name) => {
    chrome.contextMenus.create({
      id: `save-to-${name.toLowerCase()}`,
      title: `Save to ${name}`,
      parentId: 'save-current-page',
      contexts: ['page'],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const token = await getToken();
  if (!token) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon-48.svg',
      title: 'LinkSaver',
      message: 'Please log in to the web app first.',
    });
    return;
  }

  try {
    if (info.menuItemId === 'save-current-page' && tab) {
      await saveLink({
        url: tab.url,
        title: tab.title,
        faviconUrl: tab.favIconUrl,
      });
      showNotification('Page saved successfully');
    }

    if (info.menuItemId === 'save-link' && info.linkUrl) {
      await saveLink({
        url: info.linkUrl,
        title: info.linkUrl,
      });
      showNotification('Link saved successfully');
    }

    if (info.menuItemId === 'save-all-tabs') {
      chrome.windows.getCurrent({ populate: true }, async (window) => {
        const tabs = window.tabs?.filter(
          (t) => t.url && !t.url.startsWith('chrome://'),
        );
        if (!tabs) return;
        let saved = 0;
        let errors = 0;
        for (const t of tabs) {
          try {
            await saveLink({
              url: t.url,
              title: t.title,
              faviconUrl: t.favIconUrl,
            });
            saved++;
          } catch {
            errors++;
          }
        }
        showNotification(errors > 0 ? `Saved ${saved} tabs (${errors} failed)` : `Saved ${saved} tabs`);
      });
    }

    if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('save-to-')) {
      const name = MENU_COLLECTIONS[info.menuItemId];
      if (name && tab) {
        const collections = await getCollections();
        const collection = collections.find((c: any) => c.name === name);
        if (collection && tab.url) {
          await saveLink({
            url: tab.url,
            title: tab.title,
            collectionId: collection.id,
            faviconUrl: tab.favIconUrl,
          });
          showNotification(`✓ Saved to ${name}`);
        } else {
          showNotification(`Collection "${name}" not found`);
        }
      }
    }
  } catch (error: any) {
    showNotification(`Error: ${error.message}`);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'search-links') {
    const token = await getToken();
    if (!token) {
      showNotification('Please log in to the web app first.');
      return;
    }
    chrome.tabs.create({ url: chrome.runtime.getURL('search.html') });
  }
});

function showNotification(message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon-48.svg',
    title: 'LinkSaver',
    message,
  });
}
