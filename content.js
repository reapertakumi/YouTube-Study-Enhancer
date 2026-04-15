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

const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;

// Load settings and initialize
storage.sync.get(["shorts", "speed", "sidebar", "comments", "hideFeedMode"], data => {
  console.log("Settings loaded:", data);
  settings = { ...settings, ...data };
  if (!isInitialized) {
    init();
    isInitialized = true;
  } else {
    applyAllFeatures();
  }
});

// Listen for setting changes - optimized
let updateTimeout = null;
storage.onChanged.addListener(changes => {
  let needsUpdate = false;
  Object.keys(changes).forEach(key => {
    if (key in settings || key === 'hideFeedMode') {
      settings[key] = changes[key].newValue;
      needsUpdate = true;
      console.log(`Setting changed: ${key} = ${changes[key].newValue}`);
    }
  });
  if (needsUpdate) {
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      console.log("Settings updated, reapplying:", settings);
      applyAllFeatures();
    }, 50);
  }
});

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED' && message.settings) {
      console.log("Received settings update from popup:", message.settings);
      Object.keys(message.settings).forEach(key => {
        if (key in settings || key === 'hideFeedMode') {
          settings[key] = message.settings[key];
        }
      });
      applyAllFeatures();
    }
    sendResponse({ success: true });
  });
}

function init() {
  console.log("Initializing YouTube Study Enhancer - Feed Mode:", settings.hideFeedMode);
  applyAllFeatures();
  startObservers();
}

function applyAllFeatures() {
  console.log("Applying all features - settings:", settings);
  hideShorts();
  handleVideoFeed();
  handleComments();
  handleSpeed();
}

// ============ HIDE SHORTS (CSS-based - instant, zero performance impact) ============
function hideShorts() {
  if (!settings.shorts) {
    if (shortsStyleElement) {
      shortsStyleElement.remove();
      shortsStyleElement = null;
    }
    return;
  }
  
  if (shortsStyleElement) return;
  
  shortsStyleElement = document.createElement('style');
  shortsStyleElement.id = 'study-enhancer-hide-shorts';
  shortsStyleElement.textContent = `
    /* Hide ALL Shorts links and containers instantly */
    [href*="/shorts/"],
    [href*="/shorts"],
    a[href*="/shorts"],
    a[href*="/shorts"] * {
      display: none !important;
    }
    
    /* Hide Shorts shelf containers */
    grid-shelf-view-model.ytGridShelfViewModelHost,
    ytd-reel-shelf-renderer,
    ytd-rich-section-renderer,
    ytd-rich-shelf-renderer {
      display: none !important;
    }
    
    /* Hide Shorts video containers */
    ytd-rich-item-renderer:has([href*="/shorts/"]),
    ytd-video-renderer:has([href*="/shorts/"]),
    ytd-grid-video-renderer:has([href*="/shorts/"]),
    ytd-compact-video-renderer:has([href*="/shorts/"]),
    ytm-shorts-lockup-view-model-v2,
    ytm-shorts-lockup-view-model {
      display: none !important;
    }
    
    /* Hide Shorts in side panels */
    ytd-guide-entry-renderer:has([href="/shorts"]),
    ytd-mini-guide-entry-renderer:has([href="/shorts"]) {
      display: none !important;
    }
    
    /* Hide the Shorts button in top navigation */
    ytd-topbar-menu-button-renderer:has([aria-label="Shorts"]),
    ytd-guide-entry-renderer:has([title="Shorts"]),
    a[title="Shorts"],
    [aria-label="Shorts"],
    [aria-label="Shorts"] * {
      display: none !important;
    }
    
    /* Hide Shorts tab in video page */
    ytd-pivot-bar-item-renderer:has([title="Shorts"]),
    .ytp-pivot-shorts,
    [role="tab"][aria-label="Shorts"] {
      display: none !important;
    }
  `;
  
  document.head.appendChild(shortsStyleElement);
}

// ============ VIDEO FEED HANDLING ============
function findFeedElement() {
  // Try all possible YouTube feed selectors
  const selectors = [
    '#secondary',
    '#secondary.style-scope.ytd-watch-flexy',
    'ytd-watch-flexy #secondary',
    'ytd-watch-flexy #secondary.ytd-watch-flexy',
    '#related',
    'ytd-watch-next-secondary-results-renderer',
    '#related.ytd-watch-flexy',
    'div#secondary',
    'ytd-two-column-browse-results-renderer #secondary',
    'ytd-watch-flexy div#secondary'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log("Found feed element with selector:", selector);
      return element;
    }
  }
  
  // Fallback: try to find any sidebar-like element
  const possibleFeed = document.querySelector('[id*="secondary"], [id*="related"], [id*="sidebar"]');
  if (possibleFeed) {
    console.log("Found feed element via fallback:", possibleFeed.id);
    return possibleFeed;
  }
  
  console.log("No feed element found");
  return null;
}

function getComputedDisplay(element) {
  if (!element) return null;
  try {
    const display = window.getComputedStyle(element).display;
    return display && display !== 'none' ? display : null;
  } catch(e) {
    return null;
  }
}

function storeFeedDisplay(element) {
  if (!element) return;
  try {
    const currentDisplay = getComputedDisplay(element);
    feedOriginalDisplay = currentDisplay || 'block';
    console.log("Stored original display:", feedOriginalDisplay);
  } catch(e) {
    feedOriginalDisplay = 'block';
  }
}

function applyFullWidthToVideo() {
  const primary = document.querySelector('#primary, #primary.style-scope.ytd-watch-flexy, ytd-watch-flexy #primary');
  if (primary) {
    primary.style.maxWidth = '100%';
    primary.style.width = '100%';
    primary.style.marginTop = '0';
    primary.style.paddingRight = '0';
  }
  
  // Make video container full width
  const videoContainers = [
    '#player-container-outer',
    '#player-container',
    '#movie_player',
    '.html5-video-player',
    '#player-container-inner',
    '#ytd-player',
    '.ytp-player-wrapper'
  ];
  
  videoContainers.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        el.style.width = '100%';
        el.style.maxWidth = '100%';
      }
    });
  });
  
  // Force YouTube's flex layout to expand
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    watchFlexy.style.setProperty('--ytd-watch-flexy-secondary-width', '0px', 'important');
    watchFlexy.style.setProperty('--ytd-watch-flexy-primary-width', '100%', 'important');
  }
  
  // Add style for full width
  let style = document.getElementById('study-enhancer-fullwidth');
  if (!style) {
    style = document.createElement('style');
    style.id = 'study-enhancer-fullwidth';
    document.head.appendChild(style);
  }
  style.textContent = `
    ytd-watch-flexy #primary.ytd-watch-flexy {
      max-width: 100% !important;
      width: 100% !important;
      flex: 1 !important;
    }
    ytd-watch-flexy[flexy] #primary.ytd-watch-flexy {
      max-width: 100% !important;
    }
    .html5-video-player, .ytp-player-wrapper {
      width: 100% !important;
      max-width: 100% !important;
    }
    .ytp-chrome-bottom {
      width: 100% !important;
      left: 0 !important;
    }
  `;
}

function restoreOriginalVideoWidth() {
  const primary = document.querySelector('#primary, #primary.style-scope.ytd-watch-flexy, ytd-watch-flexy #primary');
  if (primary) {
    primary.style.maxWidth = '';
    primary.style.width = '';
    primary.style.marginTop = '';
    primary.style.paddingRight = '';
  }
  
  const videoContainers = [
    '#player-container-outer',
    '#player-container',
    '#movie_player',
    '.html5-video-player',
    '#player-container-inner',
    '#ytd-player',
    '.ytp-player-wrapper'
  ];
  
  videoContainers.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        el.style.width = '';
        el.style.maxWidth = '';
      }
    });
  });
  
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    watchFlexy.style.removeProperty('--ytd-watch-flexy-secondary-width');
    watchFlexy.style.removeProperty('--ytd-watch-flexy-primary-width');
  }
  
  const style = document.getElementById('study-enhancer-fullwidth');
  if (style) style.remove();
}

function handleVideoFeed() {
  console.log("handleVideoFeed called - sidebar:", settings.sidebar, "mode:", settings.hideFeedMode);
  
  if (!settings.sidebar) {
    restoreVideoFeed();
    return;
  }
  
  if (settings.hideFeedMode === "remove") {
    console.log("Applying REMOVE mode");
    applyRemoveMode();
  } else {
    console.log("Applying HIDE mode");
    applyHideMode();
  }
  
  // Hide fullscreen grid if present
  const fullscreenGrid = document.querySelector('.ytp-fullscreen-grid-stills-container');
  if (fullscreenGrid) {
    fullscreenGrid.style.display = 'none';
  }
}

function applyRemoveMode() {
  const feed = findFeedElement();
  if (!feed) {
    console.log("Feed element not found for remove mode");
    return;
  }
  
  console.log("Apply remove mode - hiding feed completely");
  
  // Clear any previous visibility/opacity styles
  feed.style.visibility = '';
  feed.style.opacity = '';
  feed.style.pointerEvents = '';
  
  // Store original display if needed
  if (feedOriginalDisplay === null) {
    storeFeedDisplay(feed);
  }
  
  // Hide the feed
  feed.style.display = 'none';
  
  // Expand video to full width
  applyFullWidthToVideo();
  
  // Trigger resize to fix any layout issues
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
}

function applyHideMode() {
  const feed = findFeedElement();
  if (!feed) {
    console.log("Feed element not found for hide mode");
    return;
  }
  
  console.log("Apply hide mode - making feed invisible but keeping space");
  
  // Store original display if needed
  if (feedOriginalDisplay === null) {
    storeFeedDisplay(feed);
  }
  
  // Restore display if it was set to none
  if (feed.style.display === 'none') {
    feed.style.display = feedOriginalDisplay || '';
  }
  
  // Hide visually but keep layout space
  feed.style.visibility = 'hidden';
  feed.style.opacity = '0';
  feed.style.pointerEvents = 'none';
  
  // Don't expand video - keep original size
  restoreOriginalVideoWidth();
}

function restoreVideoFeed() {
  const feed = findFeedElement();
  if (!feed) {
    console.log("Feed element not found for restore");
    return;
  }
  
  console.log("Restoring video feed");
  
  // Restore all feed styles
  feed.style.display = feedOriginalDisplay || '';
  feed.style.visibility = '';
  feed.style.opacity = '';
  feed.style.pointerEvents = '';
  
  // Restore original video width
  restoreOriginalVideoWidth();
  
  // Reset stored display
  feedOriginalDisplay = null;
  
  // Trigger resize
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
}

// ============ COMMENTS HANDLING ============
function handleComments() {
  const comments = document.querySelector("#comments, #comments.style-scope.ytd-watch-flexy");
  if (!comments) return;
  comments.style.display = settings.comments ? "none" : "";
}

// ============ FIXED SPEED BLOCK WITH RESTORE ============
function handleSpeed() {
  if (speedInterval) {
    clearInterval(speedInterval);
    speedInterval = null;
  }
  
  speedObservers.forEach(obs => obs.disconnect());
  speedObservers = [];
  
  const allVideos = document.querySelectorAll("video");
  allVideos.forEach(video => {
    const handler = rateChangeHandlers.get(video);
    if (handler) {
      video.removeEventListener('ratechange', handler);
      rateChangeHandlers.delete(video);
    }
    if (originalPlaybackRates.has(video)) {
      const originalRate = originalPlaybackRates.get(video);
      video.playbackRate = originalRate;
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
    }
  });
  
  speedInterval = setInterval(() => {
    const currentVideos = document.querySelectorAll("video");
    currentVideos.forEach(video => enforceSpeed(video));
  }, 200);
  
  const observer = new MutationObserver(() => {
    const newVideos = document.querySelectorAll("video");
    newVideos.forEach(video => {
      if (!originalPlaybackRates.has(video)) {
        enforceSpeed(video);
        if (!rateChangeHandlers.has(video)) {
          const handler = () => enforceSpeed(video);
          video.addEventListener('ratechange', handler);
          rateChangeHandlers.set(video, handler);
        }
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  speedObservers.push(observer);
}

// ============ WATCH FOR NAVIGATION (optimized - minimal impact) ============
function startObservers() {
  let lastUrl = location.href;
  let urlChangeTimer = null;
  
  // Watch for URL changes (SPA navigation)
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl && url.includes('youtube.com')) {
      console.log("URL changed from", lastUrl, "to", url);
      lastUrl = url;
      if (urlChangeTimer) clearTimeout(urlChangeTimer);
      urlChangeTimer = setTimeout(() => {
        feedOriginalDisplay = null; // Reset feed display cache
        applyAllFeatures();
      }, 300);
    }
  });
  urlObserver.observe(document, { subtree: true, childList: true });
  
  // YouTube's custom navigation event
  document.addEventListener('yt-navigate-finish', () => {
    console.log("yt-navigate-finish event fired");
    if (urlChangeTimer) clearTimeout(urlChangeTimer);
    urlChangeTimer = setTimeout(() => {
      feedOriginalDisplay = null;
      applyAllFeatures();
    }, 300);
  });
  
  // Watch for dynamic content changes (but not too aggressive)
  let mutationTimer = null;
  const contentObserver = new MutationObserver(() => {
    if (mutationTimer) clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      // Only reapply if we're on a YouTube page
      if (window.location.href.includes('youtube.com')) {
        // Check if feed or video elements exist
        if (document.querySelector("#secondary") || document.querySelector("#comments") || document.querySelector("video")) {
          applyAllFeatures();
        }
      }
    }, 200);
  });
  contentObserver.observe(document.body, { childList: true, subtree: true });
}

// ============ INITIALIZE ============
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}