(function() {
  // Prevent duplicate execution
  if (window.__hotkeyListenerInstalled) return;
  window.__hotkeyListenerInstalled = true;

  const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
  const REMOVED_SITES_KEY = "removedDefaultSites";

  // Cache storage data to reduce async calls
  let cachedSettings = null;
  let settingsLoaded = false;

  // Load all settings at once and cache them
  function loadSettings(callback) {
    if (settingsLoaded && cachedSettings) {
      if (callback) callback(cachedSettings);
      return;
    }

    storage.sync.get([
      'blockYoutube', 'instagram', 'twitter', 'tiktok', 'reddit', 'pinterest',
      'customDomains', REMOVED_SITES_KEY, 'shorts', 'blockShortScroll'
    ], (data) => {
      cachedSettings = data;
      settingsLoaded = true;
      if (callback) callback(cachedSettings);
    });
  }

  function checkAndRedirect(settings) {
    const currentUrl = window.location.href.toLowerCase();
    let shouldBlock = false;

    // Get removed default sites
    const removedSites = settings[REMOVED_SITES_KEY] || [];

    // Check default sites (skip if removed)
    const defaultSites = [
      { domain: 'youtube.com', enabled: settings.blockYoutube, id: 'blockYoutube' },
      { domain: 'instagram.com', enabled: settings.instagram, id: 'instagram' },
      { domain: 'twitter.com', enabled: settings.twitter, id: 'twitter' },
      { domain: 'x.com', enabled: settings.twitter, id: 'twitter' },
      { domain: 'tiktok.com', enabled: settings.tiktok, id: 'tiktok' },
      { domain: 'reddit.com', enabled: settings.reddit, id: 'reddit' },
      { domain: 'pinterest.com', enabled: settings.pinterest, id: 'pinterest' }
    ];

    for (const site of defaultSites) {
      if (removedSites.includes(site.id)) continue;
      if (site.enabled && currentUrl.includes(site.domain)) {
        shouldBlock = true;
        break;
      }
    }

    // Check custom domains
    if (!shouldBlock && settings.customDomains) {
      for (const [domain, enabled] of Object.entries(settings.customDomains)) {
        if (enabled && currentUrl.includes(domain.toLowerCase())) {
          shouldBlock = true;
          break;
        }
      }
    }

    if (shouldBlock) {
      window.location.replace(chrome.runtime.getURL('blocker.html'));
    }
  }

  // Redirect YouTube Shorts to homepage when shorts blocking is enabled
  function redirectShortsToHomepage(settings) {
    // Only run on youtube.com
    if (!window.location.hostname.includes('youtube.com')) return;

    // Check if current URL is a Shorts URL
    if (window.location.pathname.includes('/shorts/')) {
      if (settings.shorts === true) {
        // Redirect to YouTube homepage
        window.location.replace('https://www.youtube.com/');
      }
    }
  }

  // Block scrolling on YouTube Shorts when blockShortScroll is enabled
  function blockShortScroll(settings) {
    // Only run on youtube.com
    if (!window.location.hostname.includes('youtube.com')) return;

    // Check if current URL is a Shorts URL
    if (window.location.pathname.includes('/shorts/')) {
      if (settings.blockShortScroll === true) {
        // Prevent scrolling by intercepting wheel and touch events
        function preventScroll(e) {
          // Check if the event target is within the comments panel or other scrollable areas
          const commentsPanel = e.target.closest('ytd-comments') ||
                               e.target.closest('#comments') ||
                               e.target.closest('.ytd-comments') ||
                               e.target.closest('[role="dialog"]') ||
                               e.target.closest('ytd-popup-container') ||
                               e.target.closest('ytd-notification-renderer') ||
                               e.target.closest('ytd-guide') ||
                               e.target.closest('ytd-mini-guide') ||
                               e.target.closest('#guide') ||
                               e.target.closest('.ytd-guide') ||
                               e.target.closest('ytd-guide-section-renderer') ||
                               e.target.closest('#sections') ||
                               e.target.closest('.ytd-guide-section-renderer') ||
                               e.target.closest('ytd-guide-entry-renderer') ||
                               e.target.closest('ytd-guide-collapsible-section-entry-renderer') ||
                               e.target.closest('ytd-guide-signin-promo-renderer') ||
                               e.target.closest('tp-yt-app-drawer') ||
                               e.target.closest('#contentContainer') ||
                               e.target.closest('#guide-wrapper') ||
                               e.target.closest('#guide-content') ||
                               e.target.closest('#guide-inner-content');

          // Allow scrolling in comments panel, dialogs, notifications, and sidebar
          if (commentsPanel) {
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Block keyboard navigation (arrow keys, space, etc.)
        function preventKeyScroll(e) {
          const scrollKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End'];

          // Check if the event target is within the comments panel or other scrollable areas
          const commentsPanel = e.target.closest('ytd-comments') ||
                               e.target.closest('#comments') ||
                               e.target.closest('.ytd-comments') ||
                               e.target.closest('[role="dialog"]') ||
                               e.target.closest('ytd-popup-container') ||
                               e.target.closest('ytd-notification-renderer') ||
                               e.target.closest('ytd-guide') ||
                               e.target.closest('ytd-mini-guide') ||
                               e.target.closest('#guide') ||
                               e.target.closest('.ytd-guide') ||
                               e.target.closest('ytd-guide-section-renderer') ||
                               e.target.closest('#sections') ||
                               e.target.closest('.ytd-guide-section-renderer') ||
                               e.target.closest('ytd-guide-entry-renderer') ||
                               e.target.closest('ytd-guide-collapsible-section-entry-renderer') ||
                               e.target.closest('ytd-guide-signin-promo-renderer') ||
                               e.target.closest('tp-yt-app-drawer') ||
                               e.target.closest('#contentContainer') ||
                               e.target.closest('#guide-wrapper') ||
                               e.target.closest('#guide-content') ||
                               e.target.closest('#guide-inner-content') ||
                               e.target.closest('input') ||
                               e.target.closest('textarea');

          // Allow keyboard navigation in comments panel, dialogs, notifications, sidebar, and input fields
          if (commentsPanel) {
            return;
          }

          if (scrollKeys.includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }

        // Get the shorts container
        const shortsContainer = document.querySelector('ytd-reel-video-renderer') || document.querySelector('#shorts-container') || document.body;

        // Block mouse wheel scrolling on document (to catch events before YouTube handles them)
        document.addEventListener('wheel', preventScroll, { passive: false, capture: true });
        document.addEventListener('mousewheel', preventScroll, { passive: false, capture: true });

        // Block touch scrolling on document (to catch events before YouTube handles them)
        document.addEventListener('touchstart', preventScroll, { passive: false, capture: true });
        document.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
        document.addEventListener('touchend', preventScroll, { passive: false, capture: true });

        // Block keyboard navigation on document (to catch events before YouTube handles them)
        document.addEventListener('keydown', preventKeyScroll, { capture: true });

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
        }, 100);

        // Store references for cleanup
        window._blockShortScroll = {
          preventScroll,
          preventKeyScroll,
          hideNavigationInterval,
          shortsContainer
        };
      } else {
        // If not on shorts URL, cleanup any active blocking
        cleanupBlockShortScroll();
      }
    } else {
      // If not on shorts URL, cleanup any active blocking
      cleanupBlockShortScroll();
    }
  }

  // Centralized cleanup function for blockShortScroll
  function cleanupBlockShortScroll() {
    if (window._blockShortScroll) {
      const { preventScroll, preventKeyScroll, hideNavigationInterval, shortsContainer } = window._blockShortScroll;

      // Remove event listeners from document
      document.removeEventListener('wheel', preventScroll, { capture: true });
      document.removeEventListener('mousewheel', preventScroll, { capture: true });
      document.removeEventListener('touchstart', preventScroll, { capture: true });
      document.removeEventListener('touchmove', preventScroll, { capture: true });
      document.removeEventListener('touchend', preventScroll, { capture: true });
      document.removeEventListener('keydown', preventKeyScroll, { capture: true });

      // Restore shorts container styles
      if (shortsContainer && shortsContainer !== document.body) {
        shortsContainer.style.overflow = '';
        shortsContainer.style.touchAction = '';
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

  // Run initial checks with cached settings
  loadSettings((settings) => {
    checkAndRedirect(settings);
    redirectShortsToHomepage(settings);
    blockShortScroll(settings);
  });

  // Handle SPA navigation (Instagram, YouTube, etc.)
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        loadSettings((settings) => {
          checkAndRedirect(settings);
          redirectShortsToHomepage(settings);
          blockShortScroll(settings);
        });
      }, 100);
    }
  });
  observer.observe(document, { subtree: true, childList: true });

  window.addEventListener('popstate', () => {
    setTimeout(() => {
      loadSettings((settings) => {
        checkAndRedirect(settings);
        redirectShortsToHomepage(settings);
        blockShortScroll(settings);
      });
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
      // Invalidate settings cache when any relevant setting changes
      if (area === 'sync' && (changes.blockYoutube || changes.instagram || changes.twitter ||
          changes.tiktok || changes.reddit || changes.pinterest || changes.customDomains ||
          changes[REMOVED_SITES_KEY] || changes.shorts || changes.blockShortScroll)) {
        settingsLoaded = false;
        cachedSettings = null;
        // Reload and re-apply with new settings
        loadSettings((settings) => {
          checkAndRedirect(settings);
          redirectShortsToHomepage(settings);
          blockShortScroll(settings);
        });
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