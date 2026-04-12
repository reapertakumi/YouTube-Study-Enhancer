let settings = {
  shorts: false,
  speed: false,
  sidebar: false,
  comments: false,
  hideFeedMode: "remove"
};

let speedInterval = null;
let speedObservers = [];
let originalPlaybackRates = new WeakMap(); // store original rates per video
let rateChangeHandlers = new WeakMap();    // store bound handlers for removal

let isInitialized = false;
let feedOriginalDisplay = null;
let resizeTimeout = null;

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

// Listen for setting changes
storage.onChanged.addListener(changes => {
  let needsUpdate = false;
  Object.keys(changes).forEach(key => {
    if (key in settings) {
      settings[key] = changes[key].newValue;
      needsUpdate = true;
    }
  });
  if (needsUpdate) {
    console.log("Settings updated, reapplying:", settings);
    applyAllFeatures();
  }
});

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED' && message.settings) {
      Object.keys(message.settings).forEach(key => {
        if (key in settings) {
          settings[key] = message.settings[key];
        }
      });
      console.log("Received settings from popup:", settings);
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
  hideShorts();
  handleVideoFeed();
  handleComments();
  handleSpeed();
}

// ============ HIDE SHORTS ============
function hideShorts() {
  if (!settings.shorts) {
    document.querySelectorAll("[data-study-blocked='shorts']").forEach(el => {
      el.removeAttribute("data-study-blocked");
      el.style.display = "";
    });
    return;
  }
  
  document.querySelectorAll("a[href*='/shorts/']").forEach(link => {
    let container = link.closest("ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer");
    if (container && container.style.display !== "none") {
      container.setAttribute("data-study-blocked", "shorts");
      container.style.display = "none";
    }
  });

  document.querySelectorAll("ytd-reel-shelf-renderer, ytd-rich-section-renderer").forEach(el => {
    if (el.style.display !== "none") {
      el.setAttribute("data-study-blocked", "shorts");
      el.style.display = "none";
    }
  });

  document.querySelectorAll("ytd-guide-entry-renderer").forEach(el => {
    if (el.innerText.includes("Shorts") && el.style.display !== "none") {
      el.setAttribute("data-study-blocked", "shorts");
      el.style.display = "none";
    }
  });
}

// ============ VIDEO FEED HANDLING ============
function findFeedElement() {
  return document.querySelector('#secondary, #secondary.style-scope.ytd-watch-flexy, ytd-watch-flexy #secondary');
}

function getComputedDisplay(element) {
  if (!element) return null;
  const display = window.getComputedStyle(element).display;
  return display && display !== 'none' ? display : null;
}

function storeFeedDisplay(element) {
  if (!element) return;
  const currentDisplay = getComputedDisplay(element);
  feedOriginalDisplay = currentDisplay || 'block';
}

function applyFullWidthToVideo() {
  const primary = document.querySelector('#primary, #primary.style-scope.ytd-watch-flexy');
  if (primary) {
    primary.style.maxWidth = '100%';
    primary.style.width = '100%';
    primary.style.marginTop = '0';
  }
  
  const selectors = [
    '#player-container-outer', '#player-container', '#movie_player',
    '.html5-video-player', 'video', '#player-container-inner',
    '#ytd-player', '.ytp-player-wrapper', '.ytp-chrome-bottom',
    '.ytp-progress-bar', '.ytp-progress-list'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        el.style.width = '100%';
        el.style.maxWidth = '100%';
      }
    });
  });
  
  const watchFlexy = document.querySelector('ytd-watch-flexy');
  if (watchFlexy) {
    watchFlexy.style.setProperty('--ytd-watch-flexy-secondary-width', '0px', 'important');
  }
  
  const content = document.querySelector('#content.style-scope.ytd-page-manager');
  if (content) {
    content.style.maxWidth = '100%';
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
    }
    .html5-video-player, .ytp-player-wrapper {
      width: 100% !important;
      max-width: 100% !important;
    }
    .ytp-chrome-bottom {
      width: 100% !important;
      left: 0 !important;
    }
    .ytp-progress-bar, .ytp-progress-list {
      width: 100% !important;
    }
  `;
}

function restoreOriginalVideoWidth() {
  const primary = document.querySelector('#primary, #primary.style-scope.ytd-watch-flexy');
  if (primary) {
    primary.style.maxWidth = '';
    primary.style.width = '';
    primary.style.marginTop = '';
  }
  
  const selectors = [
    '#player-container-outer', '#player-container', '#movie_player',
    '.html5-video-player', 'video', '#player-container-inner',
    '#ytd-player', '.ytp-player-wrapper', '.ytp-chrome-bottom',
    '.ytp-progress-bar', '.ytp-progress-list'
  ];
  
  selectors.forEach(selector => {
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
  }
  
  const content = document.querySelector('#content.style-scope.ytd-page-manager');
  if (content) {
    content.style.maxWidth = '';
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
  
  // Hide the fullscreen grid/stills container
  const fullscreenGrid = document.querySelector('.ytp-fullscreen-grid-stills-container');
  if (fullscreenGrid) {
    fullscreenGrid.style.display = 'none';
  }
}

function applyRemoveMode() {
  const feed = findFeedElement();
  if (!feed) return;
  
  feed.style.visibility = '';
  feed.style.opacity = '';
  feed.style.pointerEvents = '';
  
  if (feedOriginalDisplay === null || feed.style.display !== 'none') {
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
  
  if (feedOriginalDisplay === null) {
    storeFeedDisplay(feed);
  }
  
  if (feed.style.display === 'none') {
    feed.style.display = feedOriginalDisplay || '';
  }
  
  feed.style.visibility = 'hidden';
  feed.style.opacity = '0';
  feed.style.pointerEvents = 'none';
}

function restoreVideoFeed() {
  const feed = findFeedElement();
  if (!feed) return;
  
  feed.style.display = feedOriginalDisplay || '';
  feed.style.visibility = '';
  feed.style.opacity = '';
  feed.style.pointerEvents = '';
  
  const primary = document.querySelector('#primary, #primary.style-scope.ytd-watch-flexy');
  if (primary && (primary.style.width === '100%' || primary.style.maxWidth === '100%')) {
    restoreOriginalVideoWidth();
  }
  
  if (primary) {
    primary.style.maxWidth = '';
    primary.style.width = '';
    primary.style.marginTop = '';
  }
  
  // Restore the fullscreen grid container
  const fullscreenGrid = document.querySelector('.ytp-fullscreen-grid-stills-container');
  if (fullscreenGrid) {
    fullscreenGrid.style.display = '';
  }
  
  feedOriginalDisplay = null;
}

// ============ COMMENTS HANDLING ============
function handleComments() {
  const comments = document.querySelector("#comments, #comments.style-scope.ytd-watch-flexy");
  if (!comments) return;
  comments.style.display = settings.comments ? "none" : "";
}

// ============ FIXED SPEED BLOCK WITH RESTORE ============
function handleSpeed() {
  // Clear previous interval and observers
  if (speedInterval) {
    clearInterval(speedInterval);
    speedInterval = null;
  }
  
  // Disconnect all observers
  speedObservers.forEach(obs => obs.disconnect());
  speedObservers = [];
  
  // Remove ratechange event listeners from all videos and restore original rates if any
  const allVideos = document.querySelectorAll("video");
  allVideos.forEach(video => {
    const handler = rateChangeHandlers.get(video);
    if (handler) {
      video.removeEventListener('ratechange', handler);
      rateChangeHandlers.delete(video);
    }
    // Restore original playback rate if we had stored it
    if (originalPlaybackRates.has(video)) {
      const originalRate = originalPlaybackRates.get(video);
      video.playbackRate = originalRate;
      originalPlaybackRates.delete(video);
    }
  });
  
  // If speed blocking is disabled, we're done
  if (!settings.speed) return;
  
  // Helper to enforce speed = 1 and store original rate if not already stored
  const enforceSpeed = (video) => {
    if (!video) return;
    // Store original rate only once
    if (!originalPlaybackRates.has(video)) {
      originalPlaybackRates.set(video, video.playbackRate);
    }
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
      console.log("Speed reset to 1");
    }
  };
  
  // Apply to all existing videos
  allVideos.forEach(video => {
    enforceSpeed(video);
    // Attach ratechange listener if not already attached
    if (!rateChangeHandlers.has(video)) {
      const handler = () => enforceSpeed(video);
      video.addEventListener('ratechange', handler);
      rateChangeHandlers.set(video, handler);
    }
  });
  
  // Periodic check (every 200ms) for any missed changes
  speedInterval = setInterval(() => {
    const currentVideos = document.querySelectorAll("video");
    currentVideos.forEach(video => enforceSpeed(video));
  }, 200);
  
  // Observe for dynamically added video elements
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

// ============ WATCH FOR NAVIGATION ============
function startObservers() {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl && url.includes('youtube.com')) {
      lastUrl = url;
      console.log("URL changed to:", url);
      setTimeout(() => {
        feedOriginalDisplay = null;
        applyAllFeatures();
      }, 500);
    }
  }).observe(document, { subtree: true, childList: true });
  
  document.addEventListener('yt-navigate-finish', () => {
    console.log("YouTube navigation finished");
    setTimeout(() => {
      feedOriginalDisplay = null;
      applyAllFeatures();
    }, 300);
  });
  
  const observer = new MutationObserver(() => {
    if (document.querySelector("#secondary") || document.querySelector("#comments") || document.querySelector("video")) {
      applyAllFeatures();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ============ INITIALIZE ============
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}