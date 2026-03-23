// blocker.js
let overlay = null;
let originalVolume = 1;

// Check if extension is still valid
function isExtensionValid() {
  try {
    return chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.sync;
  } catch (e) {
    return false;
  }
}

// Function to create the blocker overlay
function createBlocker() {
  if (overlay) return;
  
  console.log("Creating blocker overlay");
  
  // Block all audio on the page
  blockAllAudio();
  
  overlay = document.createElement('div');
  overlay.id = 'scroll-blocker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0a0a0a;
    z-index: 9999999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: system-ui, -apple-system, 'Inter', sans-serif;
    color: #e0e0e0;
    overflow-y: auto;
    overflow-x: hidden;
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
          ✨ ALTERNATIVE ACTIONS ✨
        </p>
        <ul style="list-style: none; text-align: left; padding: 0; margin: 0;">
          <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;">
            <span style="opacity: 0.7;">📚</span>
            <span style="opacity: 0.9;">Watch a study video on YouTube</span>
          </li>
          <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;">
            <span style="opacity: 0.7;">📝</span>
            <span style="opacity: 0.9;">Review your notes</span>
          </li>
          <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;">
            <span style="opacity: 0.7;">🧠</span>
            <span style="opacity: 0.9;">Take a short break (5 min)</span>
          </li>
          <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 10px;">
            <span style="opacity: 0.7;">🎯</span>
            <span style="opacity: 0.9;">Complete one task from your list</span>
          </li>
        </ul>
      </div>
      <p style="font-size: 0.7rem; opacity: 0.4; margin-bottom: 0;">
        Disable in extension popup to access this site
      </p>
    </div>
  `;
  
  if (document.body) {
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  } else {
    setTimeout(createBlocker, 100);
  }
}

function removeBlocker() {
  if (overlay) {
    console.log("Removing blocker overlay");
    overlay.remove();
    overlay = null;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    // Restore audio when blocker is removed
    restoreAudio();
  }
}

// Function to block all audio on the page
function blockAllAudio() {
  try {
    // Mute all video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      try {
        if (video.volume > 0) {
          originalVolume = video.volume;
        }
        video.volume = 0;
        video.muted = true;
      } catch (e) {
        // Ignore individual video errors
      }
    });
    
    // Mute all audio elements
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      try {
        audio.volume = 0;
        audio.muted = true;
      } catch (e) {
        // Ignore individual audio errors
      }
    });
    
    // Mute all iframes that might contain audio (like embedded players)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        if (iframe.contentDocument && iframe.contentDocument.body) {
          const iframeVideos = iframe.contentDocument.querySelectorAll('video');
          iframeVideos.forEach(video => {
            try {
              video.muted = true;
              video.volume = 0;
            } catch (e) {}
          });
          
          const iframeAudios = iframe.contentDocument.querySelectorAll('audio');
          iframeAudios.forEach(audio => {
            try {
              audio.muted = true;
              audio.volume = 0;
            } catch (e) {}
          });
        }
      } catch (e) {
        // Cross-origin iframes can't be accessed - ignore silently
      }
    });
  } catch (e) {
    console.log("Error blocking audio:", e);
  }
}

// Function to restore audio when blocker is removed
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
  } catch (e) {
    console.log("Error restoring audio:", e);
  }
}

// Observer to catch dynamically added audio/video elements
const audioObserver = new MutationObserver(() => {
  if (overlay) {
    try {
      // If blocker is active, mute any new audio/video that appears
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        try {
          if (!video.muted) {
            video.muted = true;
            video.volume = 0;
          }
        } catch (e) {}
      });
      
      const audios = document.querySelectorAll('audio');
      audios.forEach(audio => {
        try {
          if (!audio.muted) {
            audio.muted = true;
            audio.volume = 0;
          }
        } catch (e) {}
      });
    } catch (e) {}
  }
});

// Start observing for new audio/video elements
try {
  audioObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
} catch (e) {
  console.log("Could not start audio observer");
}

// Safe storage get function
function safeStorageGet(keys, callback) {
  if (!isExtensionValid()) {
    console.log("Extension not valid");
    callback({});
    return;
  }
  
  try {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        console.log("Storage error:", chrome.runtime.lastError);
        callback({});
        return;
      }
      callback(result || {});
    });
  } catch (e) {
    console.log("Storage access error:", e);
    callback({});
  }
}

// Check current URL and settings to see if we should block
function checkAndBlock() {
  // Check if extension is valid
  if (!isExtensionValid()) {
    console.log("Extension context invalid, stopping");
    return;
  }
  
  const url = window.location.href;
  console.log("Checking URL:", url);
  
  safeStorageGet(['instagram', 'twitter', 'tiktok', 'reddit', 'pinterest'], (result) => {
    // Check again after async call
    if (!isExtensionValid()) {
      console.log("Extension context invalid after storage");
      return;
    }
    
    console.log("Block settings:", result);
    
    let shouldBlock = false;
    let blockedSite = "";
    
    if (url.includes('instagram.com') && result.instagram === true) {
      shouldBlock = true;
      blockedSite = "Instagram";
    }
    if ((url.includes('twitter.com') || url.includes('x.com')) && result.twitter === true) {
      shouldBlock = true;
      blockedSite = "Twitter/X";
    }
    if (url.includes('tiktok.com') && result.tiktok === true) {
      shouldBlock = true;
      blockedSite = "TikTok";
    }
    if (url.includes('reddit.com') && result.reddit === true) {
      shouldBlock = true;
      blockedSite = "Reddit";
    }
    if (url.includes('pinterest.com') && result.pinterest === true) {
      shouldBlock = true;
      blockedSite = "Pinterest";
    }
    
    console.log(`Should block ${blockedSite}:`, shouldBlock);
    
    if (shouldBlock && !overlay) {
      createBlocker();
    } else if (!shouldBlock && overlay) {
      removeBlocker();
    }
  });
}

// Safe storage listener
function initStorageListener() {
  if (!isExtensionValid()) {
    return;
  }
  
  try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (!isExtensionValid()) {
        return;
      }
      console.log("Storage changed:", changes);
      checkAndBlock();
    });
  } catch (e) {
    console.log("Could not add storage listener:", e);
  }
}

// Run check when page loads
function init() {
  if (isExtensionValid()) {
    checkAndBlock();
    initStorageListener();
  } else {
    console.log("Extension not valid on init");
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Also run check when page becomes visible (in case user switches tabs)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isExtensionValid()) {
    checkAndBlock();
  }
});