export const isPrivateUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return true;
  try {
    let urlToParse = rawUrl.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(urlToParse)) {
        urlToParse = 'https://' + urlToParse;
      } else {
        return true;
      }
    }
    const parsed = new URL(urlToParse);
    if (!parsed.protocol || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
      return true;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || hostname.indexOf('.') === -1) {
      return true;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }
    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^169\.254\./.test(hostname)) {
      return true;
    }
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      return true;
    }
    if (/\.(local|internal|corp|lan|home|arpa|onion|test|example|invalid)$/i.test(hostname)) {
      return true;
    }
    if (parsed.search) {
      const sensitiveKeys = ['token', 'auth', 'key', 'secret', 'password', 'session', 'ticket', 'sig', 'signature', 'unsubscribe', 'verify', 'reset'];
      for (const [k] of parsed.searchParams) {
        const lowerKey = k.toLowerCase();
        if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    return true;
  }
};

export const getNativeFaviconUrl = (rawUrl, size = 64) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent && /firefox|fxios/i.test(navigator.userAgent);
    if (!isFirefox) {
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(rawUrl)}&size=${size}`;
    }
  }
  return '';
};

export const getFaviconUrl = (rawUrl, provider = 'native', cache = {}) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (provider === 'none') return '';

  if (cache) {
    if (cache[rawUrl]) return cache[rawUrl];
    try {
      const origin = new URL(rawUrl).origin;
      if (cache[origin]) return cache[origin];
    } catch (e) {
      // ignore
    }
  }

  const nativeUrl = getNativeFaviconUrl(rawUrl);
  if (nativeUrl && (provider === 'native' || provider === 'auto')) {
    return nativeUrl;
  }

  if (provider === 'native') {
    return '';
  }

  if (isPrivateUrl(rawUrl)) {
    return nativeUrl || '';
  }

  try {
    let urlToParse = rawUrl.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = 'https://' + urlToParse;
    }
    const parsed = new URL(urlToParse);
    const hostname = parsed.hostname;

    if (provider === 'duckduckgo') {
      return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
    }

    if (provider === 'google' || provider === 'auto') {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
    }
  } catch (e) {
    return '';
  }

  return '';
};
