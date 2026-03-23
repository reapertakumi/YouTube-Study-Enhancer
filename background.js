// background.js

// Get version from manifest.json - no need to update here!
const CURRENT_VERSION = chrome.runtime.getManifest().version;

console.log("Background script loaded, version:", CURRENT_VERSION);

// Check when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Set default settings
    chrome.storage.sync.set({
      speed: false,
      sidebar: false,
      comments: false,
      shorts: false,
      instagram: false,
      twitter: false,
      tiktok: false,
      reddit: false,
      pinterest: false,
      theme: 'dark'
    });
  } else if (details.reason === 'update') {
    console.log(`Extension updated from ${details.previousVersion} to ${CURRENT_VERSION}`);
    showUpdateNotification(details.previousVersion, CURRENT_VERSION);
  }
});

// Function to show update notification
function showUpdateNotification(oldVersion, newVersion) {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'YouTube Study Enhancer Updated',
      message: `Updated from ${oldVersion} to ${newVersion}. Check the popup for new features!`,
      priority: 1
    });
  }
}

// When a tab is updated, inject blocker if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const sitesToCheck = ['instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'reddit.com', 'pinterest.com'];
    const shouldCheck = sitesToCheck.some(site => tab.url.includes(site));
    
    if (shouldCheck) {
      console.log("Injecting blocker into:", tab.url);
      
      if (chrome.scripting && chrome.scripting.executeScript) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['blocker.js']
        }).catch(err => {
          console.log('Error injecting blocker:', err);
        });
      } else {
        console.log("Scripting API not available");
      }
    }
  }
});

// Also inject when tab is created
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url) {
    const sitesToCheck = ['instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'reddit.com', 'pinterest.com'];
    const shouldCheck = sitesToCheck.some(site => tab.url.includes(site));
    
    if (shouldCheck && chrome.scripting && chrome.scripting.executeScript) {
      setTimeout(() => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['blocker.js']
        }).catch(err => {
          console.log('Error injecting blocker on creation:', err);
        });
      }, 1000);
    }
  }
});