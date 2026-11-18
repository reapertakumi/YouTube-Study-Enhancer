const CURRENT_VERSION = chrome.runtime.getManifest().version;

// Context menu IDs
const CONTEXT_MENU_PARENT = "download_image";
const CONTEXT_MENU_PNG = "download_image_png";
const CONTEXT_MENU_JPG = "download_image_jpg";
const CONTEXT_MENU_SCREENSHOT_VISIBLE = "screenshot_page_visible";
const CONTEXT_MENU_SCREENSHOT_FULL = "screenshot_page_full";

// Create context menus on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
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
  }
  
  // Create context menu
  createContextMenus();
});

// Context menus persist across service-worker restarts in MV3, so they only
// need to be (re)created on install/update, not every time the worker wakes.

function createContextMenus() {
  // Remove existing menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create parent menu for image downloads
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
    
    // Create separator (optional, for visual grouping)
    chrome.contextMenus.create({
      id: "separator",
      type: "separator",
      contexts: ["page"]
    });
    
    // Create visible screenshot menu item
    chrome.contextMenus.create({
      id: CONTEXT_MENU_SCREENSHOT_VISIBLE,
      title: "Screenshot (Visible Area)",
      contexts: ["page"]
    });
    
    // Create full page screenshot menu item
    chrome.contextMenus.create({
      id: CONTEXT_MENU_SCREENSHOT_FULL,
      title: "Screenshot (Full Page)",
      contexts: ["page"]
    });
    
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_PNG) {
    downloadImageAs(info.srcUrl, "png");
  } else if (info.menuItemId === CONTEXT_MENU_JPG) {
    downloadImageAs(info.srcUrl, "jpg");
  } else if (info.menuItemId === CONTEXT_MENU_SCREENSHOT_VISIBLE) {
    takeVisibleScreenshot(tab.id);
  } else if (info.menuItemId === CONTEXT_MENU_SCREENSHOT_FULL) {
    takeFullPageScreenshot(tab.id);
  }
});

// Take screenshot of visible area only
async function takeVisibleScreenshot(tabId) {
  
  try {
    const tab = await chrome.tabs.get(tabId);
    
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      console.error("Cannot screenshot browser internal pages");
      return;
    }
    
    // Capture visible tab as base64 PNG
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(
      tab.windowId,
      { format: "png" }
    );
    
    const filename = generateScreenshotFilename("visible");
    
    // Download the screenshot
    chrome.downloads.download({
      url: screenshotDataUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Screenshot download failed:', chrome.runtime.lastError.message);
      }
    });
    
  } catch (error) {
    console.error('Error taking visible screenshot:', error);
  }
}

// Take full page screenshot using debugger API - FIXED VERSION
async function takeFullPageScreenshot(tabId) {
  
  try {
    const tab = await chrome.tabs.get(tabId);
    
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      console.error("Cannot screenshot browser internal pages");
      return;
    }
    
    // First, inject a script to get the full page dimensions
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Get the full page dimensions
        const getFullPageDimensions = () => {
          const scrollWidth = Math.max(
            document.body.scrollWidth,
            document.documentElement.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.offsetWidth,
            document.body.clientWidth,
            document.documentElement.clientWidth
          );
          
          const scrollHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
          );
          
          return { width: scrollWidth, height: scrollHeight };
        };
        
        return getFullPageDimensions();
      }
    });
    
    const scrollWidth = Math.ceil(result.result.width);
    const scrollHeight = Math.ceil(result.result.height);
    
    
    // Limit maximum size to prevent memory issues (max 10000x10000)
    const MAX_DIMENSION = 10000;
    if (scrollWidth > MAX_DIMENSION || scrollHeight > MAX_DIMENSION) {
      console.warn(`Page too large (${scrollWidth}x${scrollHeight}), limiting to ${MAX_DIMENSION}x${MAX_DIMENSION}`);
    }
    
    // Attach debugger to the tab
    await chrome.debugger.attach({ tabId: tabId }, "1.3");
    
    // Enable the Page domain
    await chrome.debugger.sendCommand({ tabId: tabId }, "Page.enable");
    
    // Get device pixel ratio
    const devicePixelRatioResult = await chrome.debugger.sendCommand({ tabId: tabId }, "Runtime.evaluate", {
      expression: "window.devicePixelRatio",
      returnByValue: true
    });
    const devicePixelRatio = devicePixelRatioResult.result.value || 1;
    
    // Override device metrics to capture full page
    await chrome.debugger.sendCommand({ tabId: tabId }, "Emulation.setDeviceMetricsOverride", {
      width: Math.min(scrollWidth, MAX_DIMENSION),
      height: Math.min(scrollHeight, MAX_DIMENSION),
      deviceScaleFactor: devicePixelRatio,
      mobile: false,
      fitWindow: false
    });
    
    // Scroll to top
    await chrome.debugger.sendCommand({ tabId: tabId }, "Runtime.evaluate", {
      expression: "window.scrollTo(0, 0)"
    });
    
    // Wait a bit for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Capture screenshot
    const screenshot = await chrome.debugger.sendCommand({ tabId: tabId }, "Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      fromSurface: true
    });
    
    // Clear device metrics override
    await chrome.debugger.sendCommand({ tabId: tabId }, "Emulation.clearDeviceMetricsOverride");
    
    // Detach debugger
    await chrome.debugger.detach({ tabId: tabId });
    
    // Convert base64 to data URL
    const screenshotDataUrl = `data:image/png;base64,${screenshot.data}`;
    
    // Generate filename
    const filename = generateScreenshotFilename("fullpage");
    
    // Download the screenshot
    chrome.downloads.download({
      url: screenshotDataUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Full page screenshot download failed:', chrome.runtime.lastError.message);
      }
    });
    
  } catch (error) {
    console.error('Error taking full page screenshot:', error);
    
    // Clean up: detach debugger if still attached
    try {
      await chrome.debugger.detach({ tabId: tabId });
    } catch (detachError) {
      console.error('Error detaching debugger:', detachError);
    }
    
    // Fallback: try using chrome.tabs.captureVisibleTab with scrolling
    try {
      await takeFullPageScreenshotFallback(tabId);
    } catch (fallbackError) {
      console.error('Fallback screenshot also failed:', fallbackError);
    }
  }
}

// Fallback for full page screenshots (e.g. when DevTools is already attached):
// scroll through the page, capture each viewport and stitch them on an OffscreenCanvas.
async function takeFullPageScreenshotFallback(tabId) {
  const CAPTURE_GAP_MS = 600; // captureVisibleTab is rate-limited to ~2 calls/second
  const MAX_CANVAS_HEIGHT = 16384;

  const tab = await chrome.tabs.get(tabId);
  const [{ result: page }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      height: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0),
      viewportHeight: window.innerHeight,
      originalScrollY: window.scrollY
    })
  });

  const viewportHeight = Math.max(1, page.viewportHeight);
  const captures = [];
  let lastY = -1;

  for (let y = 0; y < page.height; y += viewportHeight) {
    const [{ result: actualY }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (targetY) => { window.scrollTo(0, targetY); return window.scrollY; },
      args: [y]
    });
    if (actualY === lastY) break; // reached the bottom
    lastY = actualY;

    await new Promise(resolve => setTimeout(resolve, CAPTURE_GAP_MS));
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    captures.push({ y: actualY, bitmap: await createImageBitmap(dataURLToBlob(dataUrl)) });
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (y) => window.scrollTo(0, y),
    args: [page.originalScrollY]
  });

  if (captures.length === 0) return;

  const scale = captures[0].bitmap.height / viewportHeight;
  const width = captures[0].bitmap.width;
  const height = Math.min(Math.round(page.height * scale), MAX_CANVAS_HEIGHT);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (const { y, bitmap } of captures) {
    ctx.drawImage(bitmap, 0, Math.round(y * scale));
    bitmap.close();
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  await downloadBlobDirect(blob, generateScreenshotFilename("fullpage"));
}

function generateScreenshotFilename(type) {
  const timestamp = new Date();
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  const milliseconds = String(timestamp.getMilliseconds()).padStart(3, '0');
  
  return `screenshot_${type}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliseconds}.png`;
}

async function downloadImageAs(imageUrl, format) {
  
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openHotkeyUrl' && /^https?:\/\//i.test(request.url || '')) {
    chrome.tabs.create({ url: request.url }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to open hotkey URL:', chrome.runtime.lastError.message);
      }
    });
  }
});


// ============ SCHEDULE ============
// The background worker is the single owner of schedule activation. It is woken
// once a minute by chrome.alarms (a setInterval would die with the MV3 worker and
// raced with the popup's own copy of this loop).
const SCHEDULE_ALARM = 'scheduleCheck';
const SCHEDULABLE_IDS = ["speed", "sidebar", "comments", "blockShortScroll", "removeNotifications", "shorts", "instagram", "twitter", "tiktok", "reddit", "pinterest", "blockYoutube"];

function parseTimeToMinutes(value) {
  const [h, m] = String(value || '').split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
}

// Supports overnight ranges (e.g. 22:00 - 06:00); the overnight tail counts for
// the day the range started on.
function isWithinSchedule(schedule, now = new Date()) {
  const start = parseTimeToMinutes(schedule.startTime);
  const end = parseTimeToMinutes(schedule.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return false;

  const days = Array.isArray(schedule.days) ? schedule.days : [];
  const today = now.getDay();
  const current = now.getHours() * 60 + now.getMinutes();

  if (start < end) {
    return days.includes(today) && current >= start && current < end;
  }
  if (current >= start) return days.includes(today);
  if (current < end) return days.includes((today + 6) % 7);
  return false;
}

async function activateSchedule(schedule) {
  const features = Array.isArray(schedule.features) ? schedule.features : [];
  const current = await chrome.storage.sync.get([...SCHEDULABLE_IDS, 'customDomains']);
  const currentDomains = current.customDomains || {};

  const pre = { customDomains: { ...currentDomains } };
  const next = {};
  SCHEDULABLE_IDS.forEach(id => {
    pre[id] = current[id] === true;
    // Additive: scheduled features are switched on, anything the user already
    // had on stays on.
    next[id] = pre[id] || features.includes(id);
  });

  const nextDomains = {};
  Object.keys(currentDomains).forEach(domain => {
    nextDomains[domain] = currentDomains[domain] === true || features.includes(`custom_${domain}`);
  });

  await chrome.storage.sync.set({
    preScheduleSettings: pre,
    ...next,
    customDomains: nextDomains,
    scheduleActive: true
  });
}

async function deactivateSchedule() {
  const data = await chrome.storage.sync.get(['preScheduleSettings', 'customDomains']);
  const pre = data.preScheduleSettings;
  const update = { scheduleActive: false };

  if (pre) {
    SCHEDULABLE_IDS.forEach(id => { update[id] = pre[id] === true; });
    // Restore toggles of domains that existed before; keep domains added during the schedule.
    const preDomains = pre.customDomains || {};
    const merged = {};
    Object.entries(data.customDomains || {}).forEach(([domain, enabled]) => {
      merged[domain] = domain in preDomains ? preDomains[domain] === true : enabled;
    });
    update.customDomains = merged;
  }

  await chrome.storage.sync.set(update);
  await chrome.storage.sync.remove('preScheduleSettings');
}

async function evaluateScheduleNow() {
  const data = await chrome.storage.sync.get(['schedule', 'scheduleActive']);
  const schedule = data.schedule;
  // Migrate the old "schedule.active" flag that the popup used to own.
  const active = data.scheduleActive !== undefined ? data.scheduleActive === true : schedule?.active === true;
  const shouldBeActive = !!(schedule && schedule.enabled && isWithinSchedule(schedule));

  if (shouldBeActive && !active) {
    await activateSchedule(schedule);
  } else if (!shouldBeActive && active) {
    await deactivateSchedule();
  }
}

// Serialize evaluations so overlapping triggers can't snapshot settings twice.
let scheduleQueue = Promise.resolve();
function evaluateSchedule() {
  scheduleQueue = scheduleQueue.then(evaluateScheduleNow).catch(err => console.error('Schedule check failed:', err));
  return scheduleQueue;
}

async function syncScheduleAlarm() {
  const { schedule, scheduleActive } = await chrome.storage.sync.get(['schedule', 'scheduleActive']);
  if ((schedule && schedule.enabled) || scheduleActive) {
    const existing = await chrome.alarms.get(SCHEDULE_ALARM);
    if (!existing) {
      // Fire just after each minute boundary so start/end times are honoured promptly.
      const nextMinute = Math.ceil((Date.now() + 1000) / 60000) * 60000 + 500;
      chrome.alarms.create(SCHEDULE_ALARM, { when: nextMinute, periodInMinutes: 1 });
    }
  } else {
    await chrome.alarms.clear(SCHEDULE_ALARM);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCHEDULE_ALARM) evaluateSchedule();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.schedule) {
    syncScheduleAlarm();
    evaluateSchedule();
  }
});

chrome.runtime.onStartup.addListener(() => {
  syncScheduleAlarm();
  evaluateSchedule();
});

syncScheduleAlarm();
evaluateSchedule();

// ============ NETWORK-LEVEL SITE BLOCKING ============
// declarativeNetRequest redirects blocked sites before any of their content loads
// (no flash of the page). blocker.js still handles already-open tabs and
// in-page (SPA) navigations, which never reach the network as a page load.
const BLOCK_RULE_ID = 1;
const SHORTS_RULE_ID = 2;
const BLOCK_SETTING_KEYS = ['blockYoutube', 'instagram', 'twitter', 'tiktok', 'reddit', 'pinterest', 'shorts', 'customDomains', 'removedDefaultSites', 'blockMode'];
const DEFAULT_BLOCK_DOMAINS = [
  { id: 'blockYoutube', domains: ['youtube.com'] },
  { id: 'instagram', domains: ['instagram.com'] },
  { id: 'twitter', domains: ['twitter.com', 'x.com'] },
  { id: 'tiktok', domains: ['tiktok.com'] },
  { id: 'reddit', domains: ['reddit.com'] },
  { id: 'pinterest', domains: ['pinterest.com'] }
];

// requestDomains only accepts lowercase ASCII hostnames; one bad entry would make
// the whole rule update fail, so anything else is dropped.
function normalizeBlockDomain(domain) {
  const clean = String(domain || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '').replace(/\.$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(clean) ? clean : null;
}

function buildBlockRules(settings) {
  const removed = settings.removedDefaultSites || [];
  const domains = new Set();

  DEFAULT_BLOCK_DOMAINS.forEach(site => {
    if (settings[site.id] === true && !removed.includes(site.id)) {
      site.domains.forEach(d => domains.add(d));
    }
  });
  Object.entries(settings.customDomains || {}).forEach(([domain, enabled]) => {
    const clean = enabled ? normalizeBlockDomain(domain) : null;
    if (clean) domains.add(clean);
  });

  const rules = [];
  if (domains.size > 0) {
    const blockPage = settings.blockMode === 'simple' ? '/simple_block.html' : '/blocker.html';
    rules.push({
      id: BLOCK_RULE_ID,
      priority: 2,
      action: { type: 'redirect', redirect: { extensionPath: blockPage } },
      // requestDomains also matches subdomains (www., m., mobile. ...)
      condition: { requestDomains: [...domains], resourceTypes: ['main_frame', 'sub_frame'] }
    });
  }
  if (settings.shorts === true) {
    rules.push({
      id: SHORTS_RULE_ID,
      priority: 1,
      action: { type: 'redirect', redirect: { url: 'https://www.youtube.com/' } },
      condition: { regexFilter: /^https?:\/\/([a-z0-9-]+\.)?youtube\.com\/shorts\//.source, resourceTypes: ['main_frame'] }
    });
  }
  return rules;
}

async function updateBlockRulesNow() {
  const settings = await chrome.storage.sync.get(BLOCK_SETTING_KEYS);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(rule => rule.id),
    addRules: buildBlockRules(settings)
  });
}

let blockRulesQueue = Promise.resolve();
function updateBlockRules() {
  blockRulesQueue = blockRulesQueue.then(updateBlockRulesNow).catch(err => console.error('Updating block rules failed:', err));
  return blockRulesQueue;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && BLOCK_SETTING_KEYS.some(key => key in changes)) {
    updateBlockRules();
  }
});

chrome.runtime.onInstalled.addListener(() => updateBlockRules());
chrome.runtime.onStartup.addListener(() => updateBlockRules());
