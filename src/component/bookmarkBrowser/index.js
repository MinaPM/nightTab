import { state } from '../state';
import { data } from '../data';
import { bookmark } from '../bookmark';
import { bookmarkDefault } from '../bookmarkDefault';
import { groupDefault } from '../groupDefault';
import { groupAndBookmark } from '../groupAndBookmark';

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

bookmarkBrowser.createBookmarkItem = (treeNode, existingMap) => {
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
    return clone;
  }

  const item = JSON.parse(JSON.stringify(bookmarkDefault));
  item.url = treeNode.url;
  item.timestamp = treeNode.dateAdded || Date.now();
  item.display.name.show = true;
  item.display.name.text = treeNode.title || treeNode.url;
  item.display.visual.show = true;
  item.display.visual.type = 'letter';
  item.display.visual.letter.text = bookmarkBrowser.getInitials(treeNode.title, treeNode.url);

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
      if (child.url) {
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
      if (child.url) {
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
    if (item.isFolder) {
      return `F:${item.display?.name?.text || ''}:[${(item.items || []).map(serializeItem).join(',')}]`;
    }
    return `${item.url}|${item.display?.name?.text || ''}`;
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

