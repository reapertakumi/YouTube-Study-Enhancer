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
})();