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
let feedStyleApplied = false;

let lastApplyTime = 0;
let applyThrottleTimer = null;

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

// Listen for setting changes - optimized with throttle
let updateTimeout = null;
let lastUpdateTime = 0;

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
    
    const now = Date.now();
    if (now - lastUpdateTime < 200) {
      updateTimeout = setTimeout(() => {
        lastUpdateTime = Date.now();
        console.log("Settings updated, reapplying (delayed):", settings);
        applyAllFeatures();
      }, 150);
    } else {
      lastUpdateTime = now;
      updateTimeout = setTimeout(() => {
        console.log("Settings updated, reapplying:", settings);
        applyAllFeatures();
      }, 50);
    }
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
  // THROTTLE: Don't run more than once every 300ms
  const now = Date.now();
  if (now - lastApplyTime < 300) {
    return;
  }
  lastApplyTime = now;
  
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
  const selectors = [
    '#secondary',
    '#secondary.style-scope.ytd-watch-flexy',
    'ytd-watch-flexy #secondary',
    'ytd-watch-flexy #secondary.ytd-watch-flexy',
    '#related',
    'ytd-watch-next-secondary-results-renderer',
    '#related.ytd-watch-flexy',
    'div#secondary'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  
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
  
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    watchFlexy.style.setProperty('--ytd-watch-flexy-secondary-width', '0px', 'important');
    watchFlexy.style.setProperty('--ytd-watch-flexy-primary-width', '100%', 'important');
  }
  
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
  
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    watchFlexy.style.removeProperty('--ytd-watch-flexy-secondary-width');
    watchFlexy.style.removeProperty('--ytd-watch-flexy-primary-width');
  }
  
  const style = document.getElementById('study-enhancer-fullwidth');
  if (style) style.remove();
}

function handleVideoFeed() {
  if (!settings.sidebar) {
    restoreVideoFeed();
    return;
  }
  
  if (settings.hideFeedMode === "remove") {
    applyRemoveMode();
  } else {
    applyHideMode();
  }
}

function applyRemoveMode() {
  const feed = findFeedElement();
  if (!feed) return;
  
  // Check if already applied
  if (feed.style.display === 'none' && feedOriginalDisplay !== null) {
    return;
  }
  
  console.log("Remove mode: Setting feed display to none");
  
  feed.style.visibility = '';
  feed.style.opacity = '';
  feed.style.pointerEvents = '';
  
  if (feedOriginalDisplay === null) {
    storeFeedDisplay(feed);
  }
  
  feed.style.display = 'none';
  applyFullWidthToVideo();
  
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
}

function applyHideMode() {
  const feed = findFeedElement();
  if (!feed) return;
  
  // Check if already applied
  if (feed.style.visibility === 'hidden' && feedOriginalDisplay !== null) {
    return;
  }
  
  console.log("Hide mode: Setting feed visibility to hidden");
  
  if (feedOriginalDisplay === null) {
    storeFeedDisplay(feed);
  }
  
  // Restore display first if it was hidden by remove mode
  if (feed.style.display === 'none') {
    feed.style.display = feedOriginalDisplay || '';
  }
  
  feed.style.visibility = 'hidden';
  feed.style.opacity = '0';
  feed.style.pointerEvents = 'none';
  
  restoreOriginalVideoWidth();
}

function restoreVideoFeed() {
  const feed = findFeedElement();
  if (!feed) return;
  
  // Check if already restored
  if (feed.style.display !== 'none' && feed.style.visibility !== 'hidden') {
    return;
  }
  
  console.log("Restoring video feed");
  
  feed.style.display = feedOriginalDisplay || '';
  feed.style.visibility = '';
  feed.style.opacity = '';
  feed.style.pointerEvents = '';
  
  restoreOriginalVideoWidth();
  feedOriginalDisplay = null;
  
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
  // Prevent duplicate observer initialization
  if (window.__studyEnhancerObserversStarted) {
    console.log("Observers already started, skipping duplicate initialization");
    return;
  }
  window.__studyEnhancerObserversStarted = true;
  
  let urlChangeTimer = null;
  let isApplyingThrottle = false;
  
  // Throttled apply function - prevents rapid successive calls
  const throttledApply = () => {
    if (isApplyingThrottle) return;
    isApplyingThrottle = true;
    
    setTimeout(() => {
      applyAllFeatures();
      isApplyingThrottle = false;
    }, 100);
  };
  
  // Use setInterval for URL checking (much more efficient)
  let lastKnownUrl = location.href;
  
  setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastKnownUrl && currentUrl.includes('youtube.com')) {
      console.log("URL changed from", lastKnownUrl, "to", currentUrl);
      lastKnownUrl = currentUrl;
      feedOriginalDisplay = null;
      throttledApply();
    }
  }, 500);
  
  // YouTube's custom navigation event
  document.addEventListener('yt-navigate-finish', () => {
    console.log("yt-navigate-finish event fired");
    if (urlChangeTimer) clearTimeout(urlChangeTimer);
    urlChangeTimer = setTimeout(() => {
      feedOriginalDisplay = null;
      throttledApply();
    }, 200);
  });
  
  // Use requestIdleCallback for idle checks (much more efficient)
  let lastCheckTime = 0;
  
  const idleCheck = () => {
    const now = Date.now();
    if (now - lastCheckTime > 2000) {
      lastCheckTime = now;
      if (window.location.href.includes('youtube.com')) {
        if (document.querySelector("#secondary") || document.querySelector("#comments") || document.querySelector("video")) {
          throttledApply();
        }
      }
    }
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(idleCheck, { timeout: 3000 });
    } else {
      setTimeout(idleCheck, 2000);
    }
  };
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(idleCheck, { timeout: 3000 });
  } else {
    setTimeout(idleCheck, 2000);
  }
  
  console.log("Observers started successfully (optimized mode)");
}

// ============ INITIALIZE ============
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}