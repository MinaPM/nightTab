import { state } from '../state';
import { data } from '../data';
import { bookmark } from '../bookmark';
import { bookmarkDefault } from '../bookmarkDefault';
import { groupDefault } from '../groupDefault';
import { groupAndBookmark } from '../groupAndBookmark';
import { getFaviconUrl } from '../../utility/getFaviconUrl';

const bookmarkBrowser = {};

bookmarkBrowser.lastSummary = '';
bookmarkBrowser.isListening = false;

bookmarkBrowser.getInitials = (title, url) => {
  let text = (title || '').trim();

  if (!text && url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      const parts = host.split('.');
      text = parts.length > 1 ? parts[0] : host;
    } catch (e) {
      text = url;
    }
  }

  const words = text
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  if (words.length === 1) {
    const single = words[0];
    const upperChars = single.match(/[A-Z]/g);
    if (upperChars && upperChars.length >= 2 && upperChars.length <= 3) {
      return upperChars.join('');
    }
    return single.slice(0, 2).toUpperCase();
  }

  return 'B';
};

bookmarkBrowser.faviconCache = null;

bookmarkBrowser.loadFaviconCache = () => {
  if (bookmarkBrowser.faviconCache !== null) return bookmarkBrowser.faviconCache;
  try {
    const raw = localStorage.getItem('nightTabFaviconCache');
    bookmarkBrowser.faviconCache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    bookmarkBrowser.faviconCache = {};
  }
  return bookmarkBrowser.faviconCache;
};

bookmarkBrowser.saveFaviconCache = () => {
  try {
    if (bookmarkBrowser.faviconCache) {
      localStorage.setItem('nightTabFaviconCache', JSON.stringify(bookmarkBrowser.faviconCache));
    }
  } catch (e) {
    // ignore
  }
};

bookmarkBrowser.recordFavicon = (pageUrl, favIconUrl) => {
  if (!pageUrl || !favIconUrl) return;
  if (favIconUrl.startsWith('chrome://') || favIconUrl.startsWith('about:') || favIconUrl.startsWith('moz-extension:')) return;

  const cache = bookmarkBrowser.loadFaviconCache();
  let changed = false;

  try {
    const parsed = new URL(pageUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      if (cache[pageUrl] !== favIconUrl) {
        cache[pageUrl] = favIconUrl;
        changed = true;
      }
      if (cache[parsed.origin] !== favIconUrl) {
        cache[parsed.origin] = favIconUrl;
        changed = true;
      }
    }
  } catch (e) {
    // ignore
  }

  if (changed) {
    bookmarkBrowser.saveFaviconCache();
  }

  const provider = state.get.current()?.bookmark?.faviconService || 'native';
  if (provider === 'none') return;

  let bookmarkUpdated = false;
  const updateItem = (item) => {
    if (!item) return;
    if (item.isFolder && item.items) {
      item.items.forEach(updateItem);
      return;
    }
    if (!item.url) return;
    try {
      const itemParsed = new URL(item.url);
      const targetParsed = new URL(pageUrl);
      if (item.url === pageUrl || itemParsed.origin === targetParsed.origin) {
        if (item.display?.visual?.image?.url !== favIconUrl) {
          if (!item.display) item.display = {};
          if (!item.display.visual) item.display.visual = {};
          if (!item.display.visual.image) item.display.visual.image = { url: '' };
          item.display.visual.image.url = favIconUrl;
          item.display.visual.type = 'image';
          bookmarkUpdated = true;
        }
      }
    } catch (e) {
      // ignore
    }
  };

  if (bookmark.all && Array.isArray(bookmark.all)) {
    bookmark.all.forEach((g) => {
      (g.items || []).forEach(updateItem);
    });
  }

  if (bookmarkUpdated) {
    data.save();
    clearTimeout(bookmarkBrowser.renderTimer);
    bookmarkBrowser.renderTimer = setTimeout(() => {
      groupAndBookmark.render();
    }, 400);
  }
};

bookmarkBrowser.getFaviconUrl = (url) => {
  const provider = state.get.current()?.bookmark?.faviconService || 'native';
  const cache = bookmarkBrowser.loadFaviconCache();
  return getFaviconUrl(url, provider, cache);
};

bookmarkBrowser.createBookmarkItem = (treeNode, existingMap) => {
  const provider = state.get.current()?.bookmark?.faviconService || 'native';
  const cache = bookmarkBrowser.loadFaviconCache();

  const existing = existingMap && existingMap.get(treeNode.url);
  if (existing) {
    const clone = JSON.parse(JSON.stringify(existing));
    if (treeNode.title) {
      clone.display.name.text = treeNode.title;
    }
    clone.url = treeNode.url;
    if (treeNode.dateAdded) {
      clone.timestamp = treeNode.dateAdded;
    }

    if (provider === 'none') {
      clone.display.visual.type = 'letter';
    } else {
      const favicon = getFaviconUrl(treeNode.url, provider, cache);
      if (favicon) {
        clone.display.visual.type = 'image';
        if (!clone.display.visual.image) clone.display.visual.image = { url: '' };
        clone.display.visual.image.url = favicon;
      } else if (clone.display.visual.type === 'image' && !clone.display.visual.image?.url) {
        clone.display.visual.type = 'letter';
      }
    }
    return clone;
  }

  const item = JSON.parse(JSON.stringify(bookmarkDefault));
  item.url = treeNode.url;
  item.timestamp = treeNode.dateAdded || Date.now();
  item.display.name.show = true;
  item.display.name.text = treeNode.title || treeNode.url;
  item.display.visual.show = true;
  item.display.visual.letter.text = bookmarkBrowser.getInitials(treeNode.title, treeNode.url);

  if (provider === 'none') {
    item.display.visual.type = 'letter';
  } else {
    const favicon = getFaviconUrl(treeNode.url, provider, cache);
    if (favicon) {
      item.display.visual.type = 'image';
      if (!item.display.visual.image) item.display.visual.image = { url: '' };
      item.display.visual.image.url = favicon;
    } else {
      item.display.visual.type = 'letter';
    }
  }

  return item;
};

bookmarkBrowser.isSeparatorNode = (node) => {
  if (!node) return false;
  if (node.type === 'separator') return true;
  if (!node.url && !node.children && (!node.title || node.title.trim() === '')) return true;
  if (node.title && (/^[-—_─\s]{3,}$/.test(node.title.trim()) || node.title.trim() === '------' || node.title.trim() === '---')) return true;
  if (node.url) {
    const url = node.url.trim().toLowerCase();
    if (url.startsWith('data:text/html') || url === 'about:blank') return true;
    if (url.includes('separator.mayastudios.com') || url.includes('separator.host') || url.includes('diviide.com')) return true;
    if (url === 'http://-' || url === 'https://-' || url === 'http://--') return true;
  }
  return false;
};

bookmarkBrowser.createSeparatorItem = (node) => {
  const item = JSON.parse(JSON.stringify(bookmarkDefault));
  item.isSeparator = true;
  item.url = '';
  item.timestamp = node?.dateAdded || Date.now();
  item.display.name.show = false;
  item.display.name.text = '';
  item.display.visual.show = false;
  return item;
};

bookmarkBrowser.convertFolder = (node, existingMap) => {
  const folder = JSON.parse(JSON.stringify(bookmarkDefault));
  folder.isFolder = true;
  folder.url = '';
  folder.timestamp = node.dateAdded || Date.now();
  folder.display.name.show = true;
  folder.display.name.text = node.title || 'Folder';
  folder.display.visual.show = true;
  folder.display.visual.type = 'icon';
  folder.display.visual.icon = {
    name: 'folder',
    prefix: 'fas',
    label: 'Folder'
  };

  const children = [];
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      if (bookmarkBrowser.isSeparatorNode(child)) {
        children.push(bookmarkBrowser.createSeparatorItem(child));
      } else if (child.url) {
        if (!child.url.startsWith('javascript:')) {
          children.push(bookmarkBrowser.createBookmarkItem(child, existingMap));
        }
      } else if (child.children) {
        children.push(bookmarkBrowser.convertFolder(child, existingMap));
      }
    });
  }

  folder.items = children;
  return folder;
};

bookmarkBrowser.convertTreeToGroups = (tree, existingMap) => {
  if (!tree || tree.length === 0) return [];
  const root = tree[0];
  const groups = [];

  const processCategory = (categoryNode) => {
    if (!categoryNode || !categoryNode.children || categoryNode.children.length === 0) return;

    const items = [];
    categoryNode.children.forEach((child) => {
      if (bookmarkBrowser.isSeparatorNode(child)) {
        items.push(bookmarkBrowser.createSeparatorItem(child));
      } else if (child.url) {
        if (!child.url.startsWith('javascript:')) {
          items.push(bookmarkBrowser.createBookmarkItem(child, existingMap));
        }
      } else if (child.children) {
        items.push(bookmarkBrowser.convertFolder(child, existingMap));
      }
    });

    if (items.length > 0) {
      const groupObj = JSON.parse(JSON.stringify(groupDefault));
      groupObj.name.text = categoryNode.title || 'Bookmarks';
      groupObj.name.show = true;
      groupObj.items = items;
      groups.push(groupObj);
    }
  };

  if (root.children && root.children.length > 0) {
    root.children.forEach((child) => {
      processCategory(child);
    });
  } else {
    processCategory(root);
  }

  return groups;
};

bookmarkBrowser.isPreset = (groups) => {
  if (!groups || groups.length !== 2) return false;
  return groups[0]?.name?.text === 'Cool stuff' && groups[1]?.name?.text === 'Dev sites';
};

bookmarkBrowser.makeSummary = (groups) => {
  if (!groups || !Array.isArray(groups)) return '';
  const serializeItem = (item) => {
    if (item.isSeparator) {
      return `SEP`;
    }
    if (item.isFolder) {
      return `F:${item.display?.name?.text || ''}:[${(item.items || []).map(serializeItem).join(',')}]`;
    }
    return `${item.url}|${item.display?.name?.text || ''}|${item.display?.visual?.type || ''}|${item.display?.visual?.image?.url || ''}`;
  };
  return groups.map((g) => `${g.name?.text || ''}:${(g.items || []).map(serializeItem).join(',')}`).join(';;;');
};

bookmarkBrowser.getApi = () => {
  if (typeof browser !== 'undefined' && browser.bookmarks) {
    return browser.bookmarks;
  }
  if (typeof chrome !== 'undefined' && chrome.bookmarks) {
    return chrome.bookmarks;
  }
  return null;
};

bookmarkBrowser.getTree = () => {
  return new Promise((resolve) => {
    const api = bookmarkBrowser.getApi();
    if (!api || typeof api.getTree !== 'function') {
      resolve(null);
      return;
    }
    try {
      let isResolved = false;
      const res = api.getTree((tree) => {
        if (!isResolved) {
          isResolved = true;
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
            resolve(null);
          } else {
            resolve(tree);
          }
        }
      });

      // If Promise returned (native in Firefox / modern WebExtension)
      if (res && typeof res.then === 'function') {
        res.then((tree) => {
          if (!isResolved) {
            isResolved = true;
            resolve(tree);
          }
        }).catch(() => {
          if (!isResolved) {
            isResolved = true;
            resolve(null);
          }
        });
      }
    } catch (e) {
      resolve(null);
    }
  });
};

bookmarkBrowser.sync = async ({ force = false, silent = false } = {}) => {
  const currentSettings = state.get.current();
  if (!force && currentSettings?.bookmark?.browserSync === false) {
    return { success: false, reason: 'disabled' };
  }

  const tree = await bookmarkBrowser.getTree();
  if (!tree || tree.length === 0) {
    return { success: false, reason: 'api_unavailable' };
  }

  const existingMap = new Map();
  const populateMap = (items) => {
    if (!items || !Array.isArray(items)) return;
    items.forEach((item) => {
      if (item.url) {
        existingMap.set(item.url, item);
      } else if (item.isFolder && item.items) {
        populateMap(item.items);
      }
    });
  };
  if (bookmark.all && Array.isArray(bookmark.all)) {
    bookmark.all.forEach((g) => {
      populateMap(g.items);
    });
  }

  const newGroups = bookmarkBrowser.convertTreeToGroups(tree, existingMap);
  if (newGroups.length === 0) {
    return { success: false, reason: 'no_bookmarks_found' };
  }

  const isPreset = bookmarkBrowser.isPreset(bookmark.all);
  const currentSummary = bookmark.all ? bookmarkBrowser.makeSummary(bookmark.all) : '';
  const newSummary = bookmarkBrowser.makeSummary(newGroups);

  if (!force && !isPreset && currentSummary === newSummary) {
    return { success: true, changed: false };
  }

  bookmark.all = newGroups;
  bookmarkBrowser.lastSummary = newSummary;
  data.save();
  groupAndBookmark.render();

  let totalCount = 0;
  newGroups.forEach((g) => { totalCount += g.items.length; });

  if (!silent) {
    console.log(`[nightTab] Synced ${totalCount} browser bookmarks across ${newGroups.length} groups.`);
  }

  return {
    success: true,
    changed: true,
    count: totalCount,
    groupCount: newGroups.length
  };
};

bookmarkBrowser.listen = () => {
  if (bookmarkBrowser.isListening) return;
  const api = bookmarkBrowser.getApi();
  if (!api) return;

  bookmarkBrowser.isListening = true;

  let debounceTimer = null;
  const onChange = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentSettings = state.get.current();
      if (currentSettings?.bookmark?.browserSync !== false) {
        bookmarkBrowser.sync({ silent: true });
      }
    }, 400);
  };

  if (api.onCreated) api.onCreated.addListener(onChange);
  if (api.onRemoved) api.onRemoved.addListener(onChange);
  if (api.onChanged) api.onChanged.addListener(onChange);
  if (api.onMoved) api.onMoved.addListener(onChange);
  if (api.onChildrenReordered) api.onChildrenReordered.addListener(onChange);

  const tabsApi = (typeof browser !== 'undefined' && browser.tabs) ? browser.tabs : (typeof chrome !== 'undefined' ? chrome.tabs : null);
  if (tabsApi && tabsApi.onUpdated) {
    tabsApi.onUpdated.addListener((tabId, changeInfo, tab) => {
      const favUrl = changeInfo.favIconUrl || (tab && tab.favIconUrl);
      const pageUrl = (tab && tab.url) || changeInfo.url;
      if (favUrl && pageUrl) {
        bookmarkBrowser.recordFavicon(pageUrl, favUrl);
      }
    });
  }
};

bookmarkBrowser.init = () => {
  bookmarkBrowser.listen();

  const schedule = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        bookmarkBrowser.sync({ silent: true });
      }, { timeout: 1500 });
    } else {
      setTimeout(() => {
        bookmarkBrowser.sync({ silent: true });
      }, 200);
    }
  };

  schedule();
};

export { bookmarkBrowser };

