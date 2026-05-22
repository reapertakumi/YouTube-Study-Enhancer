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

const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;

// Load settings and initialize once
storage.sync.get(["shorts", "speed", "sidebar", "comments", "hideFeedMode"], data => {
  console.log("Settings loaded:", data);
  settings = { ...settings, ...data };
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
    }, 50); // Reduced from 100ms to 50ms
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
        }, 30); // Reduced from 50ms to 30ms
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
    [href*="/shorts/"], [href*="/shorts"], a[href*="/shorts"] { display: none !important; }
    ytd-reel-shelf-renderer, ytd-rich-shelf-renderer, ytd-rich-section-renderer { display: none !important; }
    ytd-rich-item-renderer:has([href*="/shorts/"]), ytd-video-renderer:has([href*="/shorts/"]) { display: none !important; }
    ytd-guide-entry-renderer:has([href="/shorts"]), ytd-mini-guide-entry-renderer:has([href="/shorts"]) { display: none !important; }
    ytd-topbar-menu-button-renderer:has([aria-label="Shorts"]) { display: none !important; }
  `;
  
  document.head.appendChild(shortsStyleElement);
}

// ============ THEATER MODE MANAGEMENT - OPTIMIZED ============

let cachedTheaterButton = null;
let lastButtonFindTime = 0;

function findTheaterButtonFast() {
  // Return cached button if found recently (within 5 seconds)
  const now = Date.now();
  if (cachedTheaterButton && document.body.contains(cachedTheaterButton) && now - lastButtonFindTime < 5000) {
    return cachedTheaterButton;
  }
  
  // Fast selectors in order of likelihood
  const selectors = [
    '.ytp-size-button',
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
  // Fastest check - just look for the attribute
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
  
  // Method 1: Click the button (fastest)
  const theaterButton = findTheaterButtonFast();
  if (theaterButton) {
    theaterButton.click();
    return true;
  }
  
  // Method 2: Direct attribute manipulation (instant)
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    if (enable) {
      watchFlexy.setAttribute('theater', '');
    } else {
      watchFlexy.removeAttribute('theater');
    }
    
    // Also update the player class
    const player = document.querySelector('.html5-video-player');
    if (player) {
      if (enable) {
        player.classList.add('ytp-theater-mode');
      } else {
        player.classList.remove('ytp-theater-mode');
      }
    }
    
    // Force layout update
    watchFlexy.style.display = 'none';
    watchFlexy.offsetHeight; // Force reflow
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

// ============ VIDEO FEED HANDLING - OPTIMIZED ============

let cachedFeedElement = null;
let lastFeedFindTime = 0;

function findFeedElementFast() {
  const now = Date.now();
  if (cachedFeedElement && document.body.contains(cachedFeedElement) && now - lastFeedFindTime < 2000) {
    return cachedFeedElement;
  }
  
  // Fast selectors
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
    // ENABLE REMOVE MODE
    if (!isRemoveModeActive) {
      enableRemoveMode(feed);
    } else if (feed && feed.style.display !== 'none') {
      // Ensure feed is still hidden
      feed.style.display = 'none';
    }
  } else if (settings.sidebar && settings.hideFeedMode === "hide") {
    // HIDE MODE
    enableHideMode(feed);
  } else {
    // DISABLED
    if (isRemoveModeActive || feedOriginalDisplay !== null) {
      disableAllModes(feed);
    }
  }
}

function enableRemoveMode(feed) {
  // Save original theater state BEFORE any changes
  saveOriginalTheaterState();
  
  // Hide feed IMMEDIATELY
  if (feed) {
    if (feedOriginalDisplay === null) {
      storeFeedDisplay(feed);
    }
    feed.style.display = 'none';
    
    // Also hide any secondary columns quickly
    const secondaryColumns = document.querySelectorAll('[id*="secondary"], ytd-secondary-column');
    for (const col of secondaryColumns) {
      if (col !== feed && !col.closest('#primary')) {
        col.style.display = 'none';
      }
    }
  }
  
  // Enable theater mode IMMEDIATELY (no setTimeout)
  setTheaterModeInstant(true);
  
  isRemoveModeActive = true;
  console.log("Remove mode enabled instantly");
}

function enableHideMode(feed) {
  if (!feed) return;
  
  // If coming from remove mode, restore theater state
  if (isRemoveModeActive) {
    restoreOriginalTheaterState();
    isRemoveModeActive = false;
  }
  
  // Store original display if needed
  if (feedOriginalDisplay === null) {
    storeFeedDisplay(feed);
  }
  
  // Restore display if it was set to none
  if (feed.style.display === 'none') {
    feed.style.display = feedOriginalDisplay;
  }
  
  // Apply visual hiding
  feed.style.visibility = 'hidden';
  feed.style.opacity = '0';
  feed.style.pointerEvents = 'none';
}

function disableAllModes(feed) {
  // Restore feed visibility immediately
  if (feed) {
    feed.style.display = feedOriginalDisplay || '';
    feed.style.visibility = '';
    feed.style.opacity = '';
    feed.style.pointerEvents = '';
  }
  
  // Restore secondary columns
  const secondaryColumns = document.querySelectorAll('[id*="secondary"], ytd-secondary-column');
  for (const col of secondaryColumns) {
    if (col !== feed && !col.closest('#primary')) {
      col.style.display = '';
    }
  }
  
  // Restore original theater mode instantly
  if (isRemoveModeActive) {
    restoreOriginalTheaterState();
  }
  
  // Reset state
  isRemoveModeActive = false;
  feedOriginalDisplay = null;
}

// ============ COMMENTS HANDLING ============
function handleComments() {
  const comments = document.querySelector("#comments, #comments.ytd-watch-flexy, ytd-comments");
  if (!comments) return;
  comments.style.display = settings.comments ? "none" : "";
}

// ============ SPEED BLOCK ============
function handleSpeed() {
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
    }
  });
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'VIDEO') {
          enforceSpeed(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('video').forEach(enforceSpeed);
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  speedObservers.push(observer);
}

// ============ NAVIGATION OBSERVERS ============
let updateTimer = null;

function startObservers() {
  if (window.__studyEnhancerObserversStarted) return;
  window.__studyEnhancerObserversStarted = true;
  
  let lastUrl = location.href;
  
  // Faster URL checking (reduced from 500ms to 200ms)
  setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl && currentUrl.includes('youtube.com')) {
      lastUrl = currentUrl;
      
      // Clear cache on navigation
      cachedFeedElement = null;
      cachedTheaterButton = null;
      isRemoveModeActive = false;
      feedOriginalDisplay = null;
      
      // Apply faster on navigation
      setTimeout(() => applyAllFeaturesOnce(), 100);
    }
  }, 200);
  
  // YouTube navigation event - apply immediately
  document.addEventListener('yt-navigate-finish', () => {
    cachedFeedElement = null;
    cachedTheaterButton = null;
    isRemoveModeActive = false;
    feedOriginalDisplay = null;
    
    // Apply immediately, no delay
    applyAllFeaturesOnce();
  });
}

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