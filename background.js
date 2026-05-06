const CURRENT_VERSION = chrome.runtime.getManifest().version;

console.log("Background script loaded, version:", CURRENT_VERSION);

const injectedTabs = new Set();

// Context menu ID
const CONTEXT_MENU_PARENT = "download_image";
const CONTEXT_MENU_PNG = "download_image_png";
const CONTEXT_MENU_JPG = "download_image_jpg";

// Create context menus on install
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
  
  // Create context menu
  createContextMenus();
});

// Also create context menu when background script wakes up
createContextMenus();

function createContextMenus() {
  // Remove existing menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create parent menu
    chrome.contextMenus.create({
      id: CONTEXT_MENU_PARENT,
      title: "Save Image As",
      contexts: ["image"]
    });
    
    // Create PNG submenu
    chrome.contextMenus.create({
      id: CONTEXT_MENU_PNG,
      parentId: CONTEXT_MENU_PARENT,
      title: "PNG (.png)",
      contexts: ["image"]
    });
    
    // Create JPG submenu
    chrome.contextMenus.create({
      id: CONTEXT_MENU_JPG,
      parentId: CONTEXT_MENU_PARENT,
      title: "JPEG (.jpg)",
      contexts: ["image"]
    });
    
    console.log("Context menus created");
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_PNG) {
    downloadImageAs(info.srcUrl, "png");
  } else if (info.menuItemId === CONTEXT_MENU_JPG) {
    downloadImageAs(info.srcUrl, "jpg");
  }
});

async function downloadImageAs(imageUrl, format) {
  console.log(`Downloading image as ${format}:`, imageUrl);
  
  try {
    // Handle data URLs directly
    if (imageUrl.startsWith('data:image/')) {
      const blob = dataURLToBlob(imageUrl);
      const filename = generateFilename(format);
      await downloadBlobDirect(blob, filename);
      return;
    }
    
    // Fetch the image with proper CORS
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Check if we got a valid image blob
    if (!blob.type.startsWith('image/')) {
      throw new Error('URL does not point to a valid image');
    }
    
    // For images that are already PNG or JPG, we can download directly
    if ((format === 'png' && blob.type === 'image/png') ||
        (format === 'jpg' && blob.type === 'image/jpeg')) {
      const filename = generateFilename(format);
      await downloadBlobDirect(blob, filename);
      return;
    }
    
    // Convert the image to desired format
    const convertedBlob = await convertImageToFormat(blob, format);
    
    // Generate filename and download
    const filename = generateFilename(format);
    await downloadBlobDirect(convertedBlob, filename);
    
  } catch (error) {
    console.error('Error downloading image:', error);
    // Silent fail - no notification shown to user
  }
}

async function convertImageToFormat(blob, format) {
  try {
    // Create an ImageBitmap from the blob
    const imageBitmap = await createImageBitmap(blob);
    
    // Get dimensions
    const width = imageBitmap.width;
    const height = imageBitmap.height;
    
    // Create an OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill with white background for JPG conversion (since JPG doesn't support transparency)
    if (format === 'jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    
    // Draw the image to canvas
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Convert to desired format
    let mimeType;
    let quality;
    
    if (format === 'png') {
      mimeType = 'image/png';
      quality = undefined; // PNG is lossless
    } else { // jpg
      mimeType = 'image/jpeg';
      quality = 0.92; // Good balance of quality and file size
    }
    
    // Convert canvas to blob
    const convertedBlob = await canvas.convertToBlob({
      type: mimeType,
      quality: quality
    });
    
    // Clean up
    imageBitmap.close();
    
    return convertedBlob;
    
  } catch (error) {
    console.error('Error in image conversion:', error);
    throw new Error(`Failed to convert image: ${error.message}`);
  }
}

function dataURLToBlob(dataURL) {
  const parts = dataURL.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([uint8Array], { type: mimeType });
}

function generateFilename(format) {
  const timestamp = new Date();
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  const milliseconds = String(timestamp.getMilliseconds()).padStart(3, '0');
  
  const extension = format === 'png' ? 'png' : 'jpg';
  return `image_${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliseconds}.${extension}`;
}

async function downloadBlobDirect(blob, filename) {
  return new Promise((resolve, reject) => {
    // Convert blob to data URL using FileReader (works in service workers)
    const reader = new FileReader();
    
    reader.onloadend = function() {
      const dataUrl = reader.result;
      
      // Use chrome.downloads.download with the data URL
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('Download started with ID:', downloadId);
          resolve(downloadId);
        }
      });
    };
    
    reader.onerror = function() {
      reject(new Error('Failed to read blob data'));
    };
    
    reader.readAsDataURL(blob);
  });
}

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openHotkeyUrl' && request.url) {
    chrome.tabs.create({ url: request.url }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to open hotkey URL:', chrome.runtime.lastError.message);
      } else {
        console.log('Opened hotkey URL in new tab:', tab.id);
      }
    });
  }
});