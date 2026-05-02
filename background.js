const CURRENT_VERSION = chrome.runtime.getManifest().version;

console.log("Background script loaded, version:", CURRENT_VERSION);

const injectedTabs = new Set();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    chrome.storage.sync.set({
      speed: false,
      sidebar: false,
      endcard: false,
      comments: false,
      shorts: false,
      blockYoutube: false,
      instagram: false,
      twitter: false,
      tiktok: false,
      reddit: false,
      pinterest: false,
      theme: 'dark',
      customDomains: {}
    });
  } else if (details.reason === 'update') {
    console.log(`Extension updated from ${details.previousVersion} to ${CURRENT_VERSION}`);
  }
});

async function injectBlocker(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
    return;
  }
  
  if (injectedTabs.has(tabId)) {
    return;
  }
  
  if (chrome.scripting && chrome.scripting.executeScript) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['blocker.js']
      });
      injectedTabs.add(tabId);
      console.log("Successfully injected blocker into tab:", tabId, url);
    } catch (err) {
      console.log('Error injecting blocker:', err);
    }
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    injectBlocker(tabId, tab.url);
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url) {
    setTimeout(() => {
      injectBlocker(tab.id, tab.url);
    }, 1000);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});