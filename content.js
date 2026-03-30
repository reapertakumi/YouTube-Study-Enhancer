let settings = {
  shorts: false,
  speed: false,
  sidebar: false,
  comments: false,
  hideFeedMode: "remove"
};

let speedInterval = null;
let scrollFixApplied = false;
let isInitialized = false;

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
      applyAllFeatures();
    }
    sendResponse({ success: true });
  });
}

function init() {
  console.log("Initializing YouTube Study Enhancer with mode:", settings.hideFeedMode);
  applyAllFeatures();
  startObservers();
}

function applyAllFeatures() {
  hideShorts();
  handleSidebarAndComments();
  handleSpeed();
}

function hideShorts() {
  if (!settings.shorts) {
    // Show all shorts that were hidden
    document.querySelectorAll("[data-study-blocked='shorts']").forEach(el => {
      el.removeAttribute("data-study-blocked");
      el.style.display = "";
    });
    return;
  }
  
  // Hide shorts links
  document.querySelectorAll("a[href*='/shorts/']").forEach(link => {
    let container = link.closest("ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer");
    if (container && container.style.display !== "none") {
      container.setAttribute("data-study-blocked", "shorts");
      container.style.display = "none";
    }
  });

  // Hide shorts shelf
  document.querySelectorAll("ytd-reel-shelf-renderer, ytd-rich-section-renderer").forEach(el => {
    if (el.style.display !== "none") {
      el.setAttribute("data-study-blocked", "shorts");
      el.style.display = "none";
    }
  });

  // Hide shorts from guide
  document.querySelectorAll("ytd-guide-entry-renderer").forEach(el => {
    if (el.innerText.includes("Shorts") && el.style.display !== "none") {
      el.setAttribute("data-study-blocked", "shorts");
      el.style.display = "none";
    }
  });
}

function handleSidebarAndComments() {
  // Handle Sidebar based on mode
  const sidebar = document.querySelector("#related");
  const secondary = document.querySelector("#secondary");
  const primary = document.querySelector("#primary");
  const player = document.querySelector("#player-container, ytd-watch-flexy");
  
  if (settings.sidebar) {
    if (settings.hideFeedMode === "remove") {
      // REMOVE MODE: Completely remove sidebar and expand video
      if (sidebar) {
        sidebar.style.cssText = "display: none !important; visibility: hidden !important;";
      }
      if (secondary) {
        secondary.style.cssText = "display: none !important; visibility: hidden !important;";
      }
      if (primary) {
        primary.style.cssText = "width: 100% !important; max-width: 100% !important;";
      }
      if (player) {
        player.style.cssText = "max-width: 100% !important; margin-right: 0 !important;";
      }
      console.log("Remove Mode active - Sidebar removed, video expanded");
    } else {
      // HIDE MODE: Just hide visually but keep space (video stays same size)
      if (sidebar) {
        sidebar.style.cssText = "visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;";
        sidebar.style.removeProperty('display');
      }
      if (secondary) {
        secondary.style.cssText = "visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;";
        secondary.style.removeProperty('display');
      }
      if (primary) {
        primary.style.cssText = "";
      }
      if (player) {
        player.style.cssText = "";
      }
      console.log("Hide Mode active - Sidebar hidden but space preserved");
    }
  } else {
    // Show sidebar
    if (sidebar) sidebar.style.cssText = "";
    if (secondary) secondary.style.cssText = "";
    if (primary) primary.style.cssText = "";
    if (player) player.style.cssText = "";
  }
  
  // Handle Comments (always just hide, no resize needed)
  const comments = document.querySelector("#comments");
  if (comments) {
    if (settings.comments) {
      comments.style.cssText = "display: none !important; visibility: hidden !important;";
    } else {
      comments.style.cssText = "";
    }
  }
}

function handleSpeed() {
  const video = document.querySelector("video");
  if (!video) return;

  if (speedInterval) {
    clearInterval(speedInterval);
    speedInterval = null;
  }

  if (settings.speed) {
    // Enforce speed limit immediately
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
    }
    
    speedInterval = setInterval(() => {
      if (video && video.playbackRate !== 1) {
        console.log("Speed reset from", video.playbackRate, "to 1");
        video.playbackRate = 1;
      }
    }, 100);
  }
}

// Watch for YouTube navigation and dynamic content
function startObservers() {
  // Watch for URL changes (SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl && url.includes('youtube.com')) {
      lastUrl = url;
      console.log("URL changed, reapplying features");
      setTimeout(() => applyAllFeatures(), 500);
    }
  }).observe(document, { subtree: true, childList: true });
  
  // YouTube's custom navigation event
  document.addEventListener('yt-navigate-finish', () => {
    console.log("YouTube navigation finished");
    setTimeout(() => applyAllFeatures(), 300);
  });
  
  // Watch for dynamically added elements
  const observer = new MutationObserver(() => {
    // Only reapply if elements might have changed
    if (document.querySelector("#related") || document.querySelector("#comments") || document.querySelector("video")) {
      applyAllFeatures();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initial load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}