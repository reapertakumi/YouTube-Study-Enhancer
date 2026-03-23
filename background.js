// background.js

// When a tab is updated, inject blocker if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a site we might need to block
    const sitesToCheck = ['instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'reddit.com', 'pinterest.com'];
    const shouldCheck = sitesToCheck.some(site => tab.url.includes(site));
    
    if (shouldCheck) {
      console.log("Injecting blocker into:", tab.url);
      
      // Check if scripting API is available
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

console.log("Background script loaded");