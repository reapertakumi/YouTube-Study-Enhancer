let settings = {
  shorts: false,
  speed: false,
  sidebar: false,
  comments: false,
  hideFeedMode: "remove"
};

let speedInterval = null;
let speedObservers = [];
let originalPlaybackRates = new WeakMap();
let rateChangeHandlers = new WeakMap();

let isInitialized = false;
let feedOriginalDisplay = null;
let resizeTimeout = null;
let shortsStyleElement = null;

let originalTheaterStateBeforeEnable = false;
let isRemoveModeActive = false;

// Cache for DOM elements (Fix #4)
let cachedSecondaryColumns = null;
let lastColumnsFindTime = 0;
let cachedFeedElement = null;
let lastFeedFindTime = 0;
let cachedTheaterButton = null;
let lastButtonFindTime = 0;

// Debounce timers (Fix #7)
let debounceTimer = null;
let updateTimer = null;
let pendingVideos = new Set();

// Fix #8: Track all active resources for proper cleanup
let activeMutationObservers = [];
let activeIntervals = [];
let activeEventListeners = [];
let navigationCheckInterval = null;

const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;

// Fix #1 & #5: Proper settings loading with error handling
async function loadSettings() {
  try {
    const data = await storage.sync.get(["shorts", "speed", "sidebar", "comments", "hideFeedMode"]);
    console.log("Settings loaded:", data);
    settings = { ...settings, ...data };
    return true;
  } catch (error) {
    console.error("Failed to load settings:", error);
    // Use default settings
    return true;
  }
}

// Initialize after settings are loaded
loadSettings().then(() => {
  if (!isInitialized) {
    init();
    isInitialized = true;
  } else {
    applyAllFeaturesOnce();
  }
});

// Listen for setting changes
storage.onChanged.addListener(changes => {
  let settingsChanged = false;
  Object.keys(changes).forEach(key => {
    if (key in settings || key === 'hideFeedMode') {
      const oldValue = settings[key];
      const newValue = changes[key].newValue;
      settings[key] = newValue;
      settingsChanged = true;
      console.log(`Setting changed: ${key} = ${newValue} (was: ${oldValue})`);
    }
  });
  
  if (settingsChanged) {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      applyAllFeaturesOnce();
      updateTimer = null;
    }, 50);
  }
});

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED' && message.settings) {
      console.log("Received settings update from popup:", message.settings);
      let changed = false;
      Object.keys(message.settings).forEach(key => {
        if (key in settings || key === 'hideFeedMode') {
          if (settings[key] !== message.settings[key]) {
            const oldValue = settings[key];
            settings[key] = message.settings[key];
            changed = true;
            console.log(`Setting updated from popup: ${key} = ${message.settings[key]} (was: ${oldValue})`);
          }
        }
      });
      if (changed) {
        if (updateTimer) clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
          applyAllFeaturesOnce();
          updateTimer = null;
        }, 30);
      }
    }
    sendResponse({ success: true });
  });
}

function init() {
  console.log("Initializing YouTube Study Enhancer");
  applyAllFeaturesOnce();
}

function applyAllFeaturesOnce() {
  hideShorts();
  handleVideoFeed();
  handleComments();
  handleSpeed();
}

// ============ HIDE SHORTS ============
function hideShorts() {
  if (!settings.shorts) {
    // Remove the style element if shorts hiding is disabled
    if (shortsStyleElement) {
      shortsStyleElement.remove();
      shortsStyleElement = null;
    }
    return;
  }
  
  // If already injected, don't duplicate
  if (shortsStyleElement) return;
  
  shortsStyleElement = document.createElement('style');
  shortsStyleElement.id = 'study-enhancer-hide-shorts';
  shortsStyleElement.textContent = `
    /* Hide sidebar shorts link in mini guide */
    a[href="/shorts/"],
    a[href="/shorts"],
    ytd-mini-guide-entry-renderer a[href*="/shorts/"] {
      display: none !important;
    }
    
    /* Hide the entire shorts shelf on homepage */
    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
    ytd-rich-shelf-renderer[is-shorts],
    ytd-reel-shelf-renderer,
    ytd-rich-item-renderer:has([href*="/shorts/"]),
    ytd-video-renderer:has([href*="/shorts/"]) {
      display: none !important;
    }
    
    /* Hide the shorts tab in guide */
    ytd-guide-entry-renderer a[href="/shorts"],
    ytd-mini-guide-entry-renderer a[href="/shorts"] {
      display: none !important;
    }
    
    /* Hide shorts button in top bar */
    ytd-topbar-menu-button-renderer[aria-label="Shorts"],
    ytd-topbar-menu-button-renderer button[aria-label="Shorts"] {
      display: none !important;
    }
    
    /* Hide shorts guide entry on video pages (full guide) */
    ytd-guide-section-renderer ytd-guide-entry-renderer a[title="Shorts"],
    ytd-guide-section-renderer ytd-guide-entry-renderer a[href="/shorts"],
    ytd-guide-entry-renderer a[title="Shorts"] {
      display: none !important;
    }
    
    /* Hide shorts in search results grid */
    .ytGridShelfViewModelGridShelfRow,
    ytd-item-section-renderer .ytGridShelfViewModelGridShelfRow,
    ytm-shorts-lockup-view-model-v2,
    ytm-shorts-lockup-view-model,
    [class*="GridShelf"]:has(ytm-shorts-lockup-view-model) {
      display: none !important;
    }
  `;
  
  document.head.appendChild(shortsStyleElement);
  console.log("Shorts hiding enabled");
}

// ============ THEATER MODE MANAGEMENT ============

function findTheaterButtonFast() {
  const now = Date.now();
  if (cachedTheaterButton && document.body.contains(cachedTheaterButton) && now - lastButtonFindTime < 5000) {
    return cachedTheaterButton;
  }
  
  const selectors = [
    'button[aria-label="Theater mode"]',
    'button[title="Theater mode"]',
    '.ytp-theater-button'
  ];
  
  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      cachedTheaterButton = btn;
      lastButtonFindTime = now;
      return btn;
    }
  }
  
  cachedTheaterButton = null;
  return null;
}

function isTheaterModeActive() {
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    return watchFlexy.hasAttribute('theater');
  }
  return false;
}

function setTheaterModeInstant(enable) {
  const isCurrentlyTheater = isTheaterModeActive();
  
  if (enable === isCurrentlyTheater) {
    return true;
  }
  
  const theaterButton = findTheaterButtonFast();
  if (theaterButton) {
    theaterButton.click();
    return true;
  }
  
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    if (enable) {
      watchFlexy.setAttribute('theater', '');
    } else {
      watchFlexy.removeAttribute('theater');
    }
    
    const player = document.querySelector('.html5-video-player');
    if (player) {
      if (enable) {
        player.classList.add('ytp-theater-mode');
      } else {
        player.classList.remove('ytp-theater-mode');
      }
    }
    
    watchFlexy.style.display = 'none';
    watchFlexy.offsetHeight;
    watchFlexy.style.display = '';
    
    return true;
  }
  
  return false;
}

function saveOriginalTheaterState() {
  originalTheaterStateBeforeEnable = isTheaterModeActive();
}

function restoreOriginalTheaterState() {
  const currentState = isTheaterModeActive();
  if (currentState !== originalTheaterStateBeforeEnable) {
    setTheaterModeInstant(originalTheaterStateBeforeEnable);
  }
}

// ============ VIDEO FEED HANDLING WITH CACHING (Fix #4) ============

function findFeedElementFast() {
  const now = Date.now();
  if (cachedFeedElement && document.body.contains(cachedFeedElement) && now - lastFeedFindTime < 2000) {
    return cachedFeedElement;
  }
  
  const feedSelectors = [
    '#secondary',
    'ytd-watch-flexy #secondary',
    '#related',
    'ytd-secondary-column'
  ];
  
  for (const selector of feedSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && !element.closest('#primary')) {
        cachedFeedElement = element;
        lastFeedFindTime = now;
        return element;
      }
    } catch(e) {}
  }
  
  cachedFeedElement = null;
  return null;
}

// Fix #4: Cached secondary columns getter
function getSecondaryColumns() {
  const now = Date.now();
  if (cachedSecondaryColumns && now - lastColumnsFindTime < 1000) {
    return cachedSecondaryColumns;
  }
  
  cachedSecondaryColumns = document.querySelectorAll('[id*="secondary"], ytd-secondary-column');
  lastColumnsFindTime = now;
  return cachedSecondaryColumns;
}

function storeFeedDisplay(element) {
  if (!element) return;
  try {
    const computedStyle = window.getComputedStyle(element);
    feedOriginalDisplay = computedStyle.display !== 'none' ? computedStyle.display : 'block';
  } catch(e) {
    feedOriginalDisplay = 'block';
  }
}

function handleVideoFeed() {
  const feed = findFeedElementFast();
  
  if (settings.sidebar && settings.hideFeedMode === "remove") {
    if (!isRemoveModeActive) {
      enableRemoveMode(feed);
    } else if (feed && feed.style.display !== 'none') {
      feed.style.display = 'none';
    }
  } else if (settings.sidebar && settings.hideFeedMode === "hide") {
    enableHideMode(feed);
  } else {
    if (isRemoveModeActive || feedOriginalDisplay !== null) {
      disableAllModes(feed);
    }
  }
}

function enableRemoveMode(feed) {
  saveOriginalTheaterState();
  
  if (feed) {
    if (feedOriginalDisplay === null) {
      storeFeedDisplay(feed);
    }
    feed.style.display = 'none';
    
    // Fix #4: Use cached getter for secondary columns
    const secondaryColumns = getSecondaryColumns();
    for (const col of secondaryColumns) {
      if (col !== feed && !col.closest('#primary')) {
        col.style.display = 'none';
      }
    }
  }
  
  setTheaterModeInstant(true);
  isRemoveModeActive = true;
  console.log("Remove mode enabled instantly");
}

function enableHideMode(feed) {
  if (!feed) return;
  
  if (isRemoveModeActive) {
    restoreOriginalTheaterState();
    isRemoveModeActive = false;
  }
  
  if (feedOriginalDisplay === null) {
    storeFeedDisplay(feed);
  }
  
  if (feed.style.display === 'none') {
    feed.style.display = feedOriginalDisplay;
  }
  
  feed.style.visibility = 'hidden';
  feed.style.opacity = '0';
  feed.style.pointerEvents = 'none';
}

function disableAllModes(feed) {
  if (feed) {
    feed.style.display = feedOriginalDisplay || '';
    feed.style.visibility = '';
    feed.style.opacity = '';
    feed.style.pointerEvents = '';
  }
  
  // Fix #4: Use cached getter for secondary columns
  const secondaryColumns = getSecondaryColumns();
  for (const col of secondaryColumns) {
    if (col !== feed && !col.closest('#primary')) {
      col.style.display = '';
    }
  }
  
  if (isRemoveModeActive) {
    restoreOriginalTheaterState();
  }
  
  isRemoveModeActive = false;
  feedOriginalDisplay = null;
}

// ============ COMMENTS HANDLING (Fix #6) ============
function handleComments() {
  // Fix #6: More efficient selector with fallbacks
  let comments = document.querySelector("#comments");
  if (!comments) comments = document.querySelector("ytd-comments#comments");
  if (!comments) comments = document.querySelector("ytd-comments");
  if (!comments) return;
  
  comments.style.display = settings.comments ? "none" : "";
}

// ============ SPEED BLOCK WITH IMPROVED CLEANUP (Fix #2 & #7) ============
function handleSpeed() {
  // Fix #2: Proper cleanup of observers
  if (speedObservers.length) {
    speedObservers.forEach(obs => {
      try {
        if (obs && typeof obs.disconnect === 'function') {
          obs.disconnect();
          // Fix #8: Remove from active observers tracking
          const index = activeMutationObservers.indexOf(obs);
          if (index > -1) activeMutationObservers.splice(index, 1);
        }
      } catch(e) {}
    });
    speedObservers = [];
  }
  
  // Fix #2: Clean up video event listeners properly
  const allVideos = document.querySelectorAll("video");
  allVideos.forEach(video => {
    const handler = rateChangeHandlers.get(video);
    if (handler) {
      video.removeEventListener('ratechange', handler);
      rateChangeHandlers.delete(video);
      // Fix #8: Remove from active event listeners tracking
      const listenerIndex = activeEventListeners.findIndex(el => el.element === video && el.handler === handler);
      if (listenerIndex > -1) activeEventListeners.splice(listenerIndex, 1);
    }
    if (originalPlaybackRates.has(video)) {
      video.playbackRate = originalPlaybackRates.get(video);
      originalPlaybackRates.delete(video);
    }
  });
  
  if (!settings.speed) return;
  
  const enforceSpeed = (video) => {
    if (!video) return;
    if (!originalPlaybackRates.has(video)) {
      originalPlaybackRates.set(video, video.playbackRate);
    }
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
    }
  };
  
  allVideos.forEach(video => {
    enforceSpeed(video);
    if (!rateChangeHandlers.has(video)) {
      const handler = () => enforceSpeed(video);
      video.addEventListener('ratechange', handler);
      rateChangeHandlers.set(video, handler);
      // Fix #8: Track active event listener
      activeEventListeners.push({ element: video, handler, type: 'ratechange' });
    }
  });
  
  // Fix #7: Debounced mutation observer
  const mutationHandler = (mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'VIDEO') {
          pendingVideos.add(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('video').forEach(video => pendingVideos.add(video));
        }
      });
    });
  };
  
  const customObserver = new MutationObserver(mutationHandler);
  customObserver.observe(document.body, { childList: true, subtree: true });
  speedObservers.push(customObserver);
  
  // Fix #8: Track active observer
  activeMutationObservers.push(customObserver);
}

// ============ NAVIGATION OBSERVERS ============

function startObservers() {
  if (window.__studyEnhancerObserversStarted) return;
  window.__studyEnhancerObserversStarted = true;
  
  let lastUrl = location.href;
  
  // Fix #8: Store interval ID for cleanup
  navigationCheckInterval = setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl && currentUrl.includes('youtube.com')) {
      lastUrl = currentUrl;
      
      // Clear cache on navigation (Fix #4)
      cachedFeedElement = null;
      cachedTheaterButton = null;
      cachedSecondaryColumns = null;
      isRemoveModeActive = false;
      feedOriginalDisplay = null;
      
      setTimeout(() => applyAllFeaturesOnce(), 100);
    }
  }, 200);
  
  // Fix #8: Track interval for cleanup
  activeIntervals.push(navigationCheckInterval);
  
  // Fix #8: Track event listener for cleanup
  const navigateHandler = () => {
    cachedFeedElement = null;
    cachedTheaterButton = null;
    cachedSecondaryColumns = null;
    isRemoveModeActive = false;
    feedOriginalDisplay = null;
    
    applyAllFeaturesOnce();
  };
  
  document.addEventListener('yt-navigate-finish', navigateHandler);
  activeEventListeners.push({ element: document, handler: navigateHandler, type: 'yt-navigate-finish' });
}

// ============ FIX #8: COMPREHENSIVE CLEANUP FUNCTION ============
function cleanup() {
  console.log("Starting comprehensive cleanup...");
  
  // 1. Disconnect all mutation observers
  if (activeMutationObservers.length) {
    activeMutationObservers.forEach(obs => {
      try {
        if (obs && typeof obs.disconnect === 'function') {
          obs.disconnect();
        }
      } catch(e) {
        console.warn("Error disconnecting observer:", e);
      }
    });
    activeMutationObservers = [];
  }
  
  // Also clean up speedObservers array
  if (speedObservers.length) {
    speedObservers.forEach(obs => {
      try {
        if (obs && typeof obs.disconnect === 'function') {
          obs.disconnect();
        }
      } catch(e) {}
    });
    speedObservers = [];
  }
  
  // 2. Clear all intervals
  if (activeIntervals.length) {
    activeIntervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch(e) {
        console.warn("Error clearing interval:", e);
      }
    });
    activeIntervals = [];
  }
  
  // Clear navigation check interval if exists
  if (navigationCheckInterval) {
    clearInterval(navigationCheckInterval);
    navigationCheckInterval = null;
  }
  
  // 3. Remove all event listeners
  if (activeEventListeners.length) {
    activeEventListeners.forEach(listener => {
      try {
        if (listener.element && listener.element.removeEventListener) {
          listener.element.removeEventListener(listener.type, listener.handler);
        }
      } catch(e) {
        console.warn("Error removing event listener:", e);
      }
    });
    activeEventListeners = [];
  }
  
  // 4. Clear all timers
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  
  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }
  
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
  
  // 5. Clear pending videos set
  if (pendingVideos.size) {
    pendingVideos.clear();
  }
  
  // 6. Remove all video event listeners
  const allVideos = document.querySelectorAll("video");
  allVideos.forEach(video => {
    const handler = rateChangeHandlers.get(video);
    if (handler) {
      video.removeEventListener('ratechange', handler);
    }
  });
  
  // 7. Clear WeakMaps (they'll be garbage collected, but we can help by clearing references)
  rateChangeHandlers = new WeakMap();
  originalPlaybackRates = new WeakMap();
  
  // 8. Remove injected styles
  if (shortsStyleElement) {
    try {
      shortsStyleElement.remove();
    } catch(e) {}
    shortsStyleElement = null;
  }
  
  // Remove any other injected styles
  const styleElements = document.querySelectorAll('#study-enhancer-hide-shorts');
  styleElements.forEach(el => {
    try {
      el.remove();
    } catch(e) {}
  });
  
  // 9. Restore feed visibility
  const feed = findFeedElementFast();
  if (feed) {
    try {
      disableAllModes(feed);
    } catch(e) {
      // Fallback manual restoration
      feed.style.display = '';
      feed.style.visibility = '';
      feed.style.opacity = '';
      feed.style.pointerEvents = '';
    }
  }
  
  // Restore secondary columns
  const secondaryColumns = getSecondaryColumns();
  for (const col of secondaryColumns) {
    try {
      col.style.display = '';
    } catch(e) {}
  }
  
  // 10. Restore theater mode
  try {
    restoreOriginalTheaterState();
  } catch(e) {}
  
  // 11. Reset all state variables
  isRemoveModeActive = false;
  feedOriginalDisplay = null;
  cachedFeedElement = null;
  cachedTheaterButton = null;
  cachedSecondaryColumns = null;
  lastFeedFindTime = 0;
  lastButtonFindTime = 0;
  lastColumnsFindTime = 0;
  
  // 12. Reset initialization flag if needed (will re-init on next run)
  window.__studyEnhancerObserversStarted = false;
  
  console.log("Cleanup completed successfully");
}

// ============ FIX #8: PAGE BEFOREUNLOAD CLEANUP ============
// Clean up when page is about to unload
window.addEventListener('beforeunload', () => {
  cleanup();
});

// ============ FIX #8: EXTENSION DISABLE/CONTEXT INVALIDATION ============
// Listen for extension context invalidation (when extension is reloaded/disabled)
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Detect when extension context is invalidated
  const keepAliveInterval = setInterval(() => {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        // Extension still alive
      } else {
        throw new Error('Extension context invalidated');
      }
    } catch(e) {
      // Extension was disabled or reloaded, clean up
      console.log("Extension context invalidated, cleaning up...");
      clearInterval(keepAliveInterval);
      cleanup();
    }
  }, 1000);
  
  activeIntervals.push(keepAliveInterval);
}

// ============ FIX #8: MUTATION OBSERVER FOR DYNAMIC CONTENT CLEANUP ============
// Watch for YouTube's SPA navigation that might leave stale state
const cleanupObserver = new MutationObserver((mutations) => {
  // Check if we're on a completely new page (major DOM change)
  let shouldCleanup = false;
  
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.target === document.body) {
      // If body gets replaced or major children change, might need cleanup
      if (mutation.removedNodes.length > 10) { // Large DOM change
        shouldCleanup = true;
        break;
      }
    }
  }
  
  if (shouldCleanup) {
    console.log("Major DOM change detected, performing partial cleanup");
    // Don't full cleanup, just reset caches
    cachedFeedElement = null;
    cachedTheaterButton = null;
    cachedSecondaryColumns = null;
  }
});

cleanupObserver.observe(document.body, { childList: true, subtree: false });
activeMutationObservers.push(cleanupObserver);

// ============ INITIALIZE ============
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    startObservers();
  });
} else {
  init();
  startObservers();
}

// Expose cleanup for potential use (optional)
if (typeof window !== 'undefined') {
  window.YouTubeStudyEnhancer = { cleanup, settings: () => ({ ...settings }) };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cleanup };
}