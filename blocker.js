(function() {
  // Prevent duplicate execution
  if (window.__hotkeyListenerInstalled) return;
  window.__hotkeyListenerInstalled = true;

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

      // Check custom domains
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

  // Redirect YouTube Shorts to homepage when shorts blocking is enabled
  function redirectShortsToHomepage() {
    // Only run on youtube.com
    if (!window.location.hostname.includes('youtube.com')) return;

    // Check if current URL is a Shorts URL
    if (window.location.pathname.includes('/shorts/')) {
      storage.sync.get(['shorts'], (data) => {
        if (data.shorts === true) {
          // Redirect to YouTube homepage
          window.location.replace('https://www.youtube.com/');
        }
      });
    }
  }

  // Block scrolling on YouTube Shorts when blockShortScroll is enabled
  function blockShortScroll() {
    // Only run on youtube.com
    if (!window.location.hostname.includes('youtube.com')) return;

    // Check if current URL is a Shorts URL
    if (window.location.pathname.includes('/shorts/')) {
      storage.sync.get(['blockShortScroll'], (data) => {
        if (data.blockShortScroll === true) {
          // Prevent scrolling by intercepting wheel and touch events
          function preventScroll(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }

          // Block keyboard navigation (arrow keys, space, etc.)
          function preventKeyScroll(e) {
            const scrollKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End'];
            if (scrollKeys.includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }

          // Get the shorts container
          const shortsContainer = document.querySelector('ytd-reel-video-renderer') || document.querySelector('#shorts-container') || document.body;

          // Block mouse wheel scrolling on shorts container
          shortsContainer.addEventListener('wheel', preventScroll, { passive: false });
          shortsContainer.addEventListener('mousewheel', preventScroll, { passive: false });

          // Block touch scrolling on shorts container
          shortsContainer.addEventListener('touchstart', preventScroll, { passive: false });
          shortsContainer.addEventListener('touchmove', preventScroll, { passive: false });
          shortsContainer.addEventListener('touchend', preventScroll, { passive: false });

          // Block keyboard navigation on shorts container
          shortsContainer.addEventListener('keydown', preventKeyScroll, { capture: true });

          // Block swipe gestures on the shorts container
          if (shortsContainer !== document.body) {
            shortsContainer.style.overflow = 'hidden';
            shortsContainer.style.touchAction = 'none';
          }

          // Hide the navigation container
          const navigationContainer = document.querySelector('.navigation-container.style-scope.ytd-shorts');
          if (navigationContainer) {
            navigationContainer.style.display = 'none';
          }

          // Continuously hide the container in case it gets re-rendered
          const hideNavigationInterval = setInterval(() => {
            const navigationContainer = document.querySelector('.navigation-container.style-scope.ytd-shorts');
            if (navigationContainer) {
              navigationContainer.style.display = 'none';
            }
          }, 500);

          // Store references to cleanup
          window._blockShortScroll = {
            preventScroll,
            preventKeyScroll,
            hideNavigationInterval,
            shortsContainer
          };
        } else {
          // Cleanup if feature is disabled
          if (window._blockShortScroll) {
            const { preventScroll, preventKeyScroll, hideNavigationInterval, shortsContainer } = window._blockShortScroll;

            // Remove event listeners from shorts container
            if (shortsContainer) {
              shortsContainer.removeEventListener('wheel', preventScroll);
              shortsContainer.removeEventListener('mousewheel', preventScroll);
              shortsContainer.removeEventListener('touchstart', preventScroll);
              shortsContainer.removeEventListener('touchmove', preventScroll);
              shortsContainer.removeEventListener('touchend', preventScroll);
              shortsContainer.removeEventListener('keydown', preventKeyScroll, { capture: true });

              // Restore shorts container styles
              if (shortsContainer !== document.body) {
                shortsContainer.style.overflow = '';
                shortsContainer.style.touchAction = '';
              }
            }

            // Clear interval
            clearInterval(hideNavigationInterval);

            window._blockShortScroll = null;
          }

          // Show the navigation container again
          const navigationContainer = document.querySelector('.navigation-container.style-scope.ytd-shorts');
          if (navigationContainer) {
            navigationContainer.style.display = '';
          }
        }
      });
    } else {
      // If not on shorts URL, cleanup any active blocking
      if (window._blockShortScroll) {
        const { preventScroll, preventKeyScroll, hideNavigationInterval, shortsContainer } = window._blockShortScroll;

        if (shortsContainer) {
          shortsContainer.removeEventListener('wheel', preventScroll);
          shortsContainer.removeEventListener('mousewheel', preventScroll);
          shortsContainer.removeEventListener('touchstart', preventScroll);
          shortsContainer.removeEventListener('touchmove', preventScroll);
          shortsContainer.removeEventListener('touchend', preventScroll);
          shortsContainer.removeEventListener('keydown', preventKeyScroll, { capture: true });

          if (shortsContainer !== document.body) {
            shortsContainer.style.overflow = '';
            shortsContainer.style.touchAction = '';
          }
        }

        clearInterval(hideNavigationInterval);
        window._blockShortScroll = null;
      }

      // Show the navigation container again
      const navigationContainer = document.querySelector('.navigation-container.style-scope.ytd-shorts');
      if (navigationContainer) {
        navigationContainer.style.display = '';
      }
    }
  }

  // Run initial checks
  checkAndRedirect();
  redirectShortsToHomepage();
  blockShortScroll();

  // Handle SPA navigation (Instagram, YouTube, etc.)
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        checkAndRedirect();
        redirectShortsToHomepage();
        blockShortScroll();
      }, 100);
    }
  });
  observer.observe(document, { subtree: true, childList: true });

  window.addEventListener('popstate', () => {
    setTimeout(() => {
      checkAndRedirect();
      redirectShortsToHomepage();
      blockShortScroll();
    }, 100);
  });

  // ========== OPTIMIZED GLOBAL HOTKEY LISTENER ==========
  let cachedHotkeys = [];
  let hotkeysLoaded = false;
  let isProcessingHotkey = false;

  // Load hotkeys once and cache them
  function loadHotkeys() {
    if (hotkeysLoaded) return;
    
    storage.sync.get(['hotkeys'], (data) => {
      cachedHotkeys = data.hotkeys || [];
      hotkeysLoaded = true;
    });
  }

  // Check if a combo matches any stored hotkey
  function isRegisteredHotkey(combo) {
    return cachedHotkeys.some(hk => hk.key === combo);
  }

  // Load hotkeys on page load
  loadHotkeys();

  // Reload hotkeys when storage changes (user updates preferences)
  if (storage.onChanged) {
    storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.hotkeys) {
        cachedHotkeys = changes.hotkeys.newValue || [];
      }
      // Apply blockShortScroll changes immediately
      if (area === 'sync' && changes.blockShortScroll) {
        blockShortScroll();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    // Ignore typing in input fields
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    
    // Prevent duplicate processing of the same keydown event
    if (isProcessingHotkey) return;
    
    // Only process if hotkeys are loaded
    if (!hotkeysLoaded) return;

    const combo = normalizeKeyCombo(e);
    if (!combo) return;

    // ONLY proceed if this is a registered hotkey
    if (!isRegisteredHotkey(combo)) return;

    // Mark as processing to prevent duplicates
    isProcessingHotkey = true;

    // Find and execute the matching hotkey
    const match = cachedHotkeys.find(hk => hk.key === combo);
    if (match && match.url) {
      try {
        chrome.runtime.sendMessage({ action: 'openHotkeyUrl', url: match.url });
      } catch (err) {
        console.error('[YouTube Study Enhancer] sendMessage failed:', err);
      }
    }
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessingHotkey = false;
    }, 100);
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