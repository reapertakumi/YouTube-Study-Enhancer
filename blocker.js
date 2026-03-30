(function() {
  'use strict';
  
  if (window.__studyEnhancerBlockerLoaded) {
    console.log('Blocker already loaded, skipping');
    return;
  }
  window.__studyEnhancerBlockerLoaded = true;
  
  let overlay = null;
  let originalVolume = 1;
  let audioObserver = null;
  let isBlocking = false;
  let retryCount = 0;
  const MAX_RETRIES = 5;
  
  function isExtensionValid() {
    try {
      if (typeof chrome === 'undefined' && typeof browser === 'undefined') {
        return false;
      }
      const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;
      return runtime && runtime.id;
    } catch (e) {
      return false;
    }
  }
  
  function safeStorageGet(keys, callback) {
    if (!isExtensionValid()) {
      if (callback) callback({});
      return;
    }
    
    try {
      const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
      storage.sync.get(keys, (result) => {
        const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;
        if (runtime.lastError) {
          if (callback) callback({});
          return;
        }
        if (callback) callback(result || {});
      });
    } catch (e) {
      if (callback) callback({});
    }
  }
  
  function blockAllAudio() {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        try {
          if (!video.muted) {
            if (video.volume > 0) {
              originalVolume = video.volume;
            }
            video.volume = 0;
            video.muted = true;
          }
        } catch (e) {}
      });
      
      const audios = document.querySelectorAll('audio');
      audios.forEach(audio => {
        try {
          audio.volume = 0;
          audio.muted = true;
        } catch (e) {}
      });
    } catch (e) {}
  }
  
  function restoreAudio() {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        try {
          video.volume = originalVolume;
          video.muted = false;
        } catch (e) {}
      });
      
      const audios = document.querySelectorAll('audio');
      audios.forEach(audio => {
        try {
          audio.muted = false;
        } catch (e) {}
      });
    } catch (e) {}
  }
  
  function createBlocker() {
    if (overlay || document.getElementById('study-enhancer-blocker')) {
      return;
    }
    
    console.log("Creating blocker overlay");
    blockAllAudio();
    
    overlay = document.createElement('div');
    overlay.id = 'study-enhancer-blocker';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: #0a0a0a !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      font-family: system-ui, -apple-system, 'Inter', sans-serif !important;
      color: #e0e0e0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      pointer-events: auto !important;
    `;
    
    overlay.innerHTML = `
      <div style="text-align: center; padding: 2rem; max-width: 450px; width: 90%; margin: auto;">
        <div style="margin-bottom: 2rem;">
          <span style="font-size: 5rem; display: inline-block;">🎓</span>
        </div>
        <h1 style="font-size: 2rem; font-weight: 500; margin-bottom: 0.75rem; letter-spacing: -0.02em; color: #ffffff;">
          Study Mode
        </h1>
        <p style="font-size: 0.95rem; margin-bottom: 2rem; opacity: 0.6; line-height: 1.5;">
          This site is temporarily blocked to help you maintain focus
        </p>
        <div style="background: rgba(30, 30, 40, 0.8); border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid rgba(62, 166, 255, 0.2);">
          <p style="font-weight: 500; margin-bottom: 1.25rem; color: #3ea6ff; font-size: 0.85rem; letter-spacing: 0.5px;">
            ALTERNATIVE ACTIONS
          </p>
          <ul style="list-style: none; text-align: left; padding: 0; margin: 0;">
            <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;"><span>📚</span><span>Watch a study video on YouTube</span></li>
            <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;"><span>📝</span><span>Review your notes</span></li>
            <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;"><span>🧠</span><span>Take a short break (5 min)</span></li>
            <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;"><span>🎯</span><span>Complete one task from your list</span></li>
          </ul>
        </div>
        <p style="font-size: 0.7rem; opacity: 0.4;">Disable in extension popup to access this site</p>
      </div>
    `;
    
    const addOverlay = () => {
      if (document.body) {
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        isBlocking = true;
        startAudioObserver();
      } else if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(addOverlay, 100);
      }
    };
    
    addOverlay();
  }
  
  function removeBlocker() {
    if (overlay) {
      overlay.remove();
      overlay = null;
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      restoreAudio();
      isBlocking = false;
      
      if (audioObserver) {
        audioObserver.disconnect();
        audioObserver = null;
      }
    } else {
      const existingOverlay = document.getElementById('study-enhancer-blocker');
      if (existingOverlay) {
        existingOverlay.remove();
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        restoreAudio();
        isBlocking = false;
      }
    }
  }
  
  function startAudioObserver() {
    if (audioObserver) {
      audioObserver.disconnect();
    }
    
    try {
      audioObserver = new MutationObserver(() => {
        if (isBlocking && overlay) {
          const videos = document.querySelectorAll('video');
          videos.forEach(video => {
            if (!video.muted) {
              video.muted = true;
              video.volume = 0;
            }
          });
          
          const audios = document.querySelectorAll('audio');
          audios.forEach(audio => {
            if (!audio.muted) {
              audio.muted = true;
              audio.volume = 0;
            }
          });
        }
      });
      
      audioObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    } catch (e) {}
  }
  
  function getCurrentSite(url) {
    if (url.includes('youtube.com')) return 'blockYoutube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('pinterest.com')) return 'pinterest';
    return null;
  }
  
  // Improved domain matching function that handles all URL variations
  function matchesCustomDomain(url, customDomains) {
    try {
      // Parse the URL to get hostname
      let hostname = '';
      try {
        const urlObj = new URL(url);
        hostname = urlObj.hostname.toLowerCase();
      } catch (e) {
        // If URL parsing fails, try to extract domain manually
        let match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/?#]+)/i);
        if (match) {
          hostname = match[1].toLowerCase();
        } else {
          hostname = url.toLowerCase();
        }
      }
      
      // Remove 'www.' prefix if present for better matching
      const cleanHostname = hostname.replace(/^www\./, '');
      
      console.log("Checking domain - Original URL:", url);
      console.log("Hostname:", hostname);
      console.log("Clean hostname:", cleanHostname);
      console.log("Custom domains to check:", customDomains);
      
      for (const domain of Object.keys(customDomains)) {
        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
        
        // Exact match
        if (cleanHostname === cleanDomain) {
          console.log(`Exact domain match: ${cleanHostname} === ${cleanDomain}`);
          return domain;
        }
        
        // Subdomain match (e.g., mail.google.com matches google.com)
        if (cleanHostname.endsWith('.' + cleanDomain)) {
          console.log(`Subdomain match: ${cleanHostname} ends with .${cleanDomain}`);
          return domain;
        }
        
        // Also check the original hostname with www
        if (hostname === cleanDomain || hostname === 'www.' + cleanDomain) {
          console.log(`WWW domain match: ${hostname} matches ${cleanDomain}`);
          return domain;
        }
      }
    } catch (e) {
      console.error("Error in domain matching:", e);
      // Fallback to simple string matching
      for (const domain of Object.keys(customDomains)) {
        if (url.toLowerCase().includes(domain.toLowerCase())) {
          console.log(`Simple string match: ${url} includes ${domain}`);
          return domain;
        }
      }
    }
    return null;
  }
  
  function checkAndBlock() {
    if (!isExtensionValid()) {
      return;
    }
    
    const url = window.location.href;
    
    // Skip chrome://, edge://, about:, and extension pages
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
        url.startsWith('edge://') || url.startsWith('about:') ||
        url.startsWith('moz-extension://')) {
      return;
    }
    
    const currentSite = getCurrentSite(url);
    
    if (currentSite) {
      safeStorageGet([currentSite], (result) => {
        if (!isExtensionValid()) return;
        
        const shouldBlock = result[currentSite] === true;
        console.log(`Built-in site: ${currentSite}, Should block: ${shouldBlock}`);
        
        if (shouldBlock && !isBlocking) {
          createBlocker();
        } else if (!shouldBlock && isBlocking) {
          removeBlocker();
        }
      });
    } else {
      // Check custom domains for ANY site
      safeStorageGet(['customDomains'], (result) => {
        if (!isExtensionValid()) return;
        
        const customDomains = result.customDomains || {};
        console.log("Checking custom domains for URL:", url);
        
        const matchedDomain = matchesCustomDomain(url, customDomains);
        
        if (matchedDomain && customDomains[matchedDomain] === true) {
          console.log(`Custom domain matched: ${matchedDomain}, blocking`);
          if (!isBlocking) createBlocker();
        } else if (!matchedDomain && isBlocking) {
          console.log("No custom domain match, removing blocker");
          removeBlocker();
        } else if (matchedDomain && customDomains[matchedDomain] === false && isBlocking) {
          console.log(`Custom domain ${matchedDomain} is disabled, not blocking`);
          removeBlocker();
        }
      });
    }
  }
  
  function initStorageListener() {
    if (!isExtensionValid()) return;
    
    try {
      const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
      storage.onChanged.addListener((changes, namespace) => {
        if (!isExtensionValid()) return;
        
        const relevantKeys = ['blockYoutube', 'instagram', 'twitter', 'tiktok', 'reddit', 'pinterest', 'customDomains'];
        const hasRelevantChange = relevantKeys.some(key => changes[key]);
        
        if (hasRelevantChange) {
          console.log("Storage changed, re-checking");
          setTimeout(checkAndBlock, 100);
        }
      });
    } catch (e) {}
  }
  
  function initUrlWatcher() {
    let lastUrl = window.location.href;
    
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log("URL changed to:", currentUrl);
        setTimeout(checkAndBlock, 200);
      }
    };
    
    setInterval(checkUrlChange, 1000);
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      checkUrlChange();
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      checkUrlChange();
    };
    
    window.addEventListener('popstate', checkUrlChange);
  }
  
  function initMessageListener() {
    const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime : browser.runtime;
    runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SETTINGS_UPDATED') {
        console.log("Received settings update, re-checking");
        setTimeout(checkAndBlock, 100);
        sendResponse({ success: true });
      }
      return true;
    });
  }
  
  function init() {
    console.log("Initializing blocker for:", window.location.href);
    
    if (!isExtensionValid()) {
      console.log("Extension not valid, will retry");
      setTimeout(init, 1000);
      return;
    }
    
    setTimeout(() => {
      checkAndBlock();
      initStorageListener();
      initUrlWatcher();
      initMessageListener();
    }, 500);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isExtensionValid()) {
      setTimeout(checkAndBlock, 100);
    }
  });
})();