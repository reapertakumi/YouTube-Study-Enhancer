// newtabredirect.js
(function() {
  const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : browser.storage;
  
  // Check if new tab redirection is enabled
  storage.sync.get(['newTabEnabled'], (data) => {
    // Default to true (enabled) if never set
    const isEnabled = data.newTabEnabled !== false;
    
    if (isEnabled) {
      // Redirect to blocker.html
      const blockerUrl = chrome.runtime.getURL('blocker.html');
      if (window.location.href !== blockerUrl) {
        window.location.replace(blockerUrl);
      }
    } else {
      // Go to Chrome's default new tab page
      window.location.replace('chrome://newtab/');
    }
  });
})();