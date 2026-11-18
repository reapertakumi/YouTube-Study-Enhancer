// YouTube Study Enhancer - YouTube page features.
//
// Visual features are applied through one injected <style> element, so they also
// cover elements YouTube renders lazily (comments, sidebar, notifications) without
// MutationObservers or polling. Speed blocking uses document-level capture listeners.
(function() {
  if (window.__studyEnhancerContentLoaded) return;
  window.__studyEnhancerContentLoaded = true;

  const SETTING_KEYS = ["shorts", "blockShortScroll", "speed", "sidebar", "comments", "removeNotifications", "hideFeedMode"];
  const STYLE_ID = 'study-enhancer-styles';

  let settings = {
    shorts: false,
    blockShortScroll: false,
    speed: false,
    sidebar: false,
    comments: false,
    removeNotifications: false,
    hideFeedMode: "remove"
  };

  // Theater-mode state for "remove" feed mode. The original state is captured once
  // when remove mode turns on and survives SPA navigations, so it can be restored.
  let removeModeActive = false;
  let originalTheaterState = null;
  let theaterRetryTimer = null;

  const CSS = {
    shorts: `
      a[href="/shorts/"], a[href="/shorts"],
      ytd-mini-guide-entry-renderer a[href*="/shorts/"],
      ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
      ytd-rich-shelf-renderer[is-shorts],
      ytd-reel-shelf-renderer,
      ytd-rich-item-renderer:has([href*="/shorts/"]),
      ytd-video-renderer:has([href*="/shorts/"]),
      ytd-guide-entry-renderer:has(a[title="Shorts"]),
      ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
      ytd-topbar-menu-button-renderer[aria-label="Shorts"],
      .ytGridShelfViewModelGridShelfRow,
      ytm-shorts-lockup-view-model-v2,
      ytm-shorts-lockup-view-model,
      [class*="GridShelf"]:has(ytm-shorts-lockup-view-model) {
        display: none !important;
      }`,
    shortsGuideOnly: `
      ytd-guide-entry-renderer:has(a[title="Shorts"]),
      ytd-guide-entry-renderer a[href="/shorts"],
      ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
      ytd-mini-guide-entry-renderer a[href="/shorts"] {
        display: none !important;
      }`,
    comments: `
      ytd-comments#comments,
      ytd-watch-flexy #comments,
      ytd-reel-video-renderer #comments-button,
      .ytwReelActionBarViewModelHostDesktopActionButton:has(button[aria-label*="omment"]) {
        display: none !important;
      }`,
    notifications: `
      ytd-notification-topbar-button-renderer {
        display: none !important;
      }`,
    feedHide: `
      ytd-watch-flexy #secondary {
        display: none !important;
      }`,
    // visibility instead of display:none keeps the player from turning black
    feedRemove: `
      ytd-watch-flexy #secondary {
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }`
  };

  function buildCss() {
    const parts = [];
    if (settings.shorts) parts.push(CSS.shorts);
    else if (settings.blockShortScroll) parts.push(CSS.shortsGuideOnly);
    if (settings.comments) parts.push(CSS.comments);
    if (settings.removeNotifications) parts.push(CSS.notifications);
    if (settings.sidebar) parts.push(settings.hideFeedMode === 'hide' ? CSS.feedHide : CSS.feedRemove);
    return parts.join('\n');
  }

  function applyStyles() {
    const css = buildCss();
    let style = document.getElementById(STYLE_ID);
    if (!css) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }

  // ============ THEATER MODE ============
  function isWatchPage() {
    return location.pathname === '/watch';
  }

  function isTheaterModeActive() {
    const watchFlexy = document.querySelector('ytd-watch-flexy');
    return !!watchFlexy && watchFlexy.hasAttribute('theater');
  }

  function findTheaterButton() {
    return document.querySelector('.ytp-size-button') ||
           document.querySelector('button[data-tooltip-target-id="ytp-size-button"]');
  }

  // Click YouTube's own button (the player may not exist yet right after navigation)
  function setTheaterMode(enable, attempt = 0) {
    clearTimeout(theaterRetryTimer);
    if (!isWatchPage()) return;
    if (document.querySelector('ytd-watch-flexy') && isTheaterModeActive() === enable) return;

    const button = findTheaterButton();
    if (button && document.querySelector('ytd-watch-flexy')) {
      button.click();
      return;
    }
    if (attempt < 20) {
      theaterRetryTimer = setTimeout(() => setTheaterMode(enable, attempt + 1), 250);
    }
  }

  function updateTheaterMode() {
    const wantRemoveMode = settings.sidebar && settings.hideFeedMode !== 'hide';

    if (wantRemoveMode) {
      if (!removeModeActive) {
        removeModeActive = true;
        originalTheaterState = isWatchPage() ? isTheaterModeActive() : null;
      }
      if (isWatchPage()) {
        if (originalTheaterState === null) originalTheaterState = isTheaterModeActive();
        setTheaterMode(true);
      }
    } else if (removeModeActive) {
      removeModeActive = false;
      if (originalTheaterState === false) setTheaterMode(false);
      originalTheaterState = null;
    }
  }

  // ============ SPEED BLOCK ============
  // Caps playback above 1x back to 1x (slowing down is still allowed).
  function enforceSpeed(media) {
    if (settings.speed && media instanceof HTMLMediaElement && media.playbackRate > 1) {
      media.playbackRate = 1;
    }
  }

  function onMediaEvent(e) {
    enforceSpeed(e.target);
  }

  // ratechange/play don't bubble, but capture-phase listeners on document still see them
  ['ratechange', 'play', 'loadedmetadata'].forEach(type => {
    document.addEventListener(type, onMediaEvent, true);
  });

  function applySpeed() {
    if (settings.speed) document.querySelectorAll('video').forEach(enforceSpeed);
  }

  // ============ APPLY ============
  function applyAllFeatures() {
    applyStyles();
    updateTheaterMode();
    applySpeed();
  }

  chrome.storage.sync.get(SETTING_KEYS, (data) => {
    settings = { ...settings, ...data };
    applyAllFeatures();
  });

  let updateTimer = null;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    let changed = false;
    SETTING_KEYS.forEach(key => {
      if (key in changes) {
        settings[key] = changes[key].newValue;
        changed = true;
      }
    });
    if (changed) {
      clearTimeout(updateTimer);
      updateTimer = setTimeout(applyAllFeatures, 30);
    }
  });

  // YouTube is a SPA: re-apply theater mode / speed after each in-app navigation.
  document.addEventListener('yt-navigate-finish', applyAllFeatures);
})();
