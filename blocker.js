(function() {
  // Prevent duplicate execution
  if (window.__hotkeyListenerInstalled) return;
  window.__hotkeyListenerInstalled = true;

  const storage = chrome.storage;
  const REMOVED_SITES_KEY = "removedDefaultSites";
  const SETTINGS_KEYS = [
    'blockYoutube', 'instagram', 'twitter', 'tiktok', 'reddit', 'pinterest',
    'customDomains', REMOVED_SITES_KEY, 'shorts', 'blockShortScroll', 'blockMode'
  ];

  const DEFAULT_SITES = [
    { domain: 'youtube.com', id: 'blockYoutube', setting: 'blockYoutube' },
    { domain: 'instagram.com', id: 'instagram', setting: 'instagram' },
    { domain: 'twitter.com', id: 'twitter', setting: 'twitter' },
    { domain: 'x.com', id: 'twitter', setting: 'twitter' },
    { domain: 'tiktok.com', id: 'tiktok', setting: 'tiktok' },
    { domain: 'reddit.com', id: 'reddit', setting: 'reddit' },
    { domain: 'pinterest.com', id: 'pinterest', setting: 'pinterest' }
  ];

  const isYouTube = () => hostMatches(location.hostname, 'youtube.com');
  const isShortsPage = () => isYouTube() && location.pathname.startsWith('/shorts/');

  // Cache storage data to reduce async calls
  let cachedSettings = null;

  function loadSettings(callback) {
    if (cachedSettings) {
      callback(cachedSettings);
      return;
    }
    storage.sync.get(SETTINGS_KEYS, (data) => {
      cachedSettings = data;
      callback(cachedSettings);
    });
  }

  // True when `host` is `domain` or a subdomain of it. Plain substring checks
  // used to block e.g. netflix.com / dropbox.com for "x.com", or any URL whose
  // query string merely mentioned a blocked domain.
  function hostMatches(host, domain) {
    host = String(host || '').toLowerCase().replace(/\.$/, '');
    domain = String(domain || '').toLowerCase().trim().replace(/^www\./, '').replace(/\/.*$/, '');
    if (!host || !domain) return false;
    return host === domain || host.endsWith('.' + domain);
  }

  function shouldBlockHost(settings, host) {
    const removedSites = settings[REMOVED_SITES_KEY] || [];

    for (const site of DEFAULT_SITES) {
      if (removedSites.includes(site.id)) continue;
      if (settings[site.setting] === true && hostMatches(host, site.domain)) return true;
    }

    for (const [domain, enabled] of Object.entries(settings.customDomains || {})) {
      if (enabled && hostMatches(host, domain)) return true;
    }
    return false;
  }

  function checkAndRedirect(settings) {
    if (!/^https?:$/.test(location.protocol)) return false;
    if (!shouldBlockHost(settings, location.hostname)) return false;

    const blockPage = settings.blockMode === 'simple' ? 'simple_block.html' : 'blocker.html';
    window.location.replace(chrome.runtime.getURL(blockPage));
    return true;
  }

  // Redirect YouTube Shorts to homepage when shorts blocking is enabled
  function redirectShortsToHomepage(settings) {
    if (settings.shorts === true && isShortsPage()) {
      window.location.replace('https://www.youtube.com/');
      return true;
    }
    return false;
  }

  // ========== SHORTS SCROLL LOCK ==========
  const SCROLL_ALLOWED_SELECTOR = [
    'ytd-comments', '#comments', '.ytd-comments', '[role="dialog"]', 'ytd-popup-container',
    'ytd-notification-renderer', 'ytd-guide', 'ytd-mini-guide', '#guide', '.ytd-guide',
    'ytd-guide-section-renderer', '#sections', 'ytd-guide-entry-renderer',
    'ytd-guide-collapsible-section-entry-renderer', 'ytd-guide-signin-promo-renderer',
    'tp-yt-app-drawer', '#contentContainer', '#guide-wrapper', '#guide-content', '#guide-inner-content',
    'ytd-engagement-panel-section-list-renderer'
  ].join(',');
  const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
  const SCROLL_EVENTS = ['wheel', 'touchmove'];
  const SCROLL_LOCK_STYLE_ID = 'yse-block-short-scroll';
  let scrollLockActive = false;

  function isInAllowedArea(target) {
    return target instanceof Element && !!target.closest(SCROLL_ALLOWED_SELECTOR);
  }

  function preventScroll(e) {
    if (isInAllowedArea(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function preventKeyScroll(e) {
    if (!SCROLL_KEYS.has(e.key)) return;
    const t = e.target;
    if (t instanceof Element && (t.closest('input, textarea, [contenteditable="true"]') || isInAllowedArea(t))) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function enableShortScrollLock() {
    if (scrollLockActive) return; // idempotent: no duplicate listeners
    scrollLockActive = true;

    SCROLL_EVENTS.forEach(type => document.addEventListener(type, preventScroll, { passive: false, capture: true }));
    document.addEventListener('keydown', preventKeyScroll, { capture: true });

    // CSS instead of a 100ms polling interval: hides the up/down buttons even when re-rendered.
    if (!document.getElementById(SCROLL_LOCK_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = SCROLL_LOCK_STYLE_ID;
      style.textContent = `
        .navigation-container.ytd-shorts { display: none !important; }
        ytd-shorts #shorts-container, ytd-reel-video-renderer { touch-action: none !important; }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function disableShortScrollLock() {
    if (!scrollLockActive) return;
    scrollLockActive = false;
    SCROLL_EVENTS.forEach(type => document.removeEventListener(type, preventScroll, { capture: true }));
    document.removeEventListener('keydown', preventKeyScroll, { capture: true });
    document.getElementById(SCROLL_LOCK_STYLE_ID)?.remove();
  }

  function blockShortScroll(settings) {
    if (settings.blockShortScroll === true && isShortsPage()) {
      enableShortScrollLock();
    } else {
      disableShortScrollLock();
    }
  }

  function applyAll() {
    loadSettings((settings) => {
      if (checkAndRedirect(settings)) return;
      if (redirectShortsToHomepage(settings)) return;
      blockShortScroll(settings);
    });
  }

  applyAll();

  // ========== SPA NAVIGATION ==========
  // Previously a MutationObserver over the whole document ran on every DOM change
  // of every page. The Navigation API fires only when the URL actually changes.
  let lastUrl = location.href;
  function onPossibleUrlChange() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    applyAll();
  }

  if (window.navigation && typeof window.navigation.addEventListener === 'function') {
    window.navigation.addEventListener('currententrychange', onPossibleUrlChange);
  } else {
    setInterval(onPossibleUrlChange, 500);
  }
  window.addEventListener('popstate', onPossibleUrlChange);

  // ========== GLOBAL HOTKEY LISTENER ==========
  let cachedHotkeys = [];
  let hotkeysLoaded = false;
  let isProcessingHotkey = false;

  storage.sync.get(['hotkeys'], (data) => {
    cachedHotkeys = data.hotkeys || [];
    hotkeysLoaded = true;
  });

  storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.hotkeys) {
      cachedHotkeys = changes.hotkeys.newValue || [];
    }
    if (SETTINGS_KEYS.some(key => key in changes)) {
      cachedSettings = null;
      applyAll();
    }
  });

  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (isProcessingHotkey || !hotkeysLoaded || cachedHotkeys.length === 0) return;

    const combo = normalizeKeyCombo(e);
    if (!combo) return;

    const match = cachedHotkeys.find(hk => hk.key === combo);
    if (!match || !match.url) return;

    // Stop the page / browser from also acting on the shortcut
    e.preventDefault();
    e.stopPropagation();

    isProcessingHotkey = true;
    try {
      chrome.runtime.sendMessage({ action: 'openHotkeyUrl', url: match.url });
    } catch (err) {
      // Extension context invalidated (extension reloaded) - ignore
    }
    setTimeout(() => { isProcessingHotkey = false; }, 100);
  }, { capture: true });

  // Must produce the same strings as normalizeKeyCombo in popup.js (where hotkeys are recorded)
  function normalizeKeyCombo(e) {
    if (!e.key) return null;
    const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];
    if (modifierKeys.includes(e.key)) return null;

    const heldMods = [];
    if (e.ctrlKey) heldMods.push('Ctrl');
    if (e.altKey) heldMods.push('Alt');
    if (e.metaKey) heldMods.push('Meta');
    if (e.shiftKey) heldMods.push('Shift');

    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (heldMods.length === 0) return key.length === 1 ? key : null;
    return heldMods.join('+') + '+' + key;
  }
})();
