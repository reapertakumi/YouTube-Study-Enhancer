(function() {
  const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
  const REMOVED_SITES_KEY = "removedDefaultSites";

  function checkAndRedirect() {
    const currentUrl = window.location.href.toLowerCase();
    
    storage.sync.get(['blockYoutube', 'instagram', 'twitter', 'tiktok', 'reddit', 'pinterest', 'customDomains', REMOVED_SITES_KEY], (data) => {
      let shouldBlock = false;

      // Get removed default sites
      const removedSites = data[REMOVED_SITES_KEY] || [];

      // Check default sites (skip if removed)
      const defaultSites = [
        { domain: 'youtube.com', enabled: data.blockYoutube, id: 'blockYoutube' },
        { domain: 'instagram.com', enabled: data.instagram, id: 'instagram' },
        { domain: 'twitter.com', enabled: data.twitter, id: 'twitter' },
        { domain: 'x.com', enabled: data.twitter, id: 'twitter' },
        { domain: 'tiktok.com', enabled: data.tiktok, id: 'tiktok' },
        { domain: 'reddit.com', enabled: data.reddit, id: 'reddit' },
        { domain: 'pinterest.com', enabled: data.pinterest, id: 'pinterest' }
      ];

      for (const site of defaultSites) {
        if (removedSites.includes(site.id)) continue;
        if (site.enabled && currentUrl.includes(site.domain)) {
          shouldBlock = true;
          break;
        }
      }

      // Check custom domains - FIXED: customDomains is { "domain.com": true/false }
      if (!shouldBlock && data.customDomains) {
        for (const [domain, enabled] of Object.entries(data.customDomains)) {
          if (enabled && currentUrl.includes(domain.toLowerCase())) {
            shouldBlock = true;
            break;
          }
        }
      }

      if (shouldBlock) {
        window.location.replace(chrome.runtime.getURL('blocker.html'));
      }
    });
  }

  checkAndRedirect();
  
  // Handle SPA navigation (Instagram, etc.)
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(checkAndRedirect, 100);
    }
  });
  observer.observe(document, { subtree: true, childList: true });
  
  window.addEventListener('popstate', () => {
    setTimeout(checkAndRedirect, 100);
  });

  // Global hotkey listener — works even when popup is closed
  // Use window + capture phase so page JS can't stopPropagation the event
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;

    const combo = normalizeKeyCombo(e);
    if (!combo) return;

    console.log('[YouTube Study Enhancer] Hotkey combo pressed:', combo);

    storage.sync.get(['hotkeys'], (data) => {
      const hotkeys = data.hotkeys || [];
      console.log('[YouTube Study Enhancer] Stored hotkeys:', hotkeys);
      const match = hotkeys.find(hk => hk.key === combo);
      if (match && match.url) {
        console.log('[YouTube Study Enhancer] Match found, sending to background:', match.url);
        try {
          chrome.runtime.sendMessage({ action: 'openHotkeyUrl', url: match.url });
        } catch (err) {
          console.error('[YouTube Study Enhancer] sendMessage failed:', err);
        }
      } else {
        console.log('[YouTube Study Enhancer] No match for combo:', combo);
      }
    });
  }, { capture: true });

  function normalizeKeyCombo(e) {
    const modMap = {
      'Control': 'Ctrl',
      'Alt': 'Alt',
      'Shift': 'Shift',
      'Meta': 'Meta'
    };

    const heldMods = [];
    if (e.ctrlKey) heldMods.push('Ctrl');
    if (e.altKey) heldMods.push('Alt');
    if (e.metaKey) heldMods.push('Meta');
    if (e.shiftKey) heldMods.push('Shift');

    let key = e.key;
    if (key.length === 1) {
      key = key.toUpperCase();
    }

    if (modMap[key] && heldMods.length === 1) {
      return modMap[key];
    }

    if (modMap[key]) {
      return heldMods.join('+');
    }

    if (heldMods.length === 0) {
      return key;
    }

    return heldMods.join('+') + '+' + key;
  }
})();