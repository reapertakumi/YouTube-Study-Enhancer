let settings = {
  shorts: false,
  speed: false,
  sidebar: false,
  comments: false
};

let speedInterval = null;

/* -------- LOAD SETTINGS -------- */
chrome.storage.sync.get(["shorts", "speed", "sidebar", "comments"], data => {
  settings = { ...settings, ...data };
  init();
});

chrome.storage.onChanged.addListener(changes => {
  Object.keys(changes).forEach(key => {
    settings[key] = changes[key].newValue;
  });
  init();
});

/* -------- MAIN -------- */
function init() {
  hideShorts();
  handleSidebar();
  handleComments();
  handleSpeed();
}

/* -------- SHORTS -------- */
function hideShorts() {
  document.querySelectorAll("a[href*='/shorts/']").forEach(link => {
    const container = link.closest(
      "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer"
    );
    if (container) {
      container.style.display = settings.shorts ? "none" : "";
    }
  });

  document.querySelectorAll(
    "ytd-reel-shelf-renderer, ytd-rich-section-renderer"
  ).forEach(el => {
    el.style.display = settings.shorts ? "none" : "";
  });

  document.querySelectorAll("ytd-guide-entry-renderer").forEach(el => {
    if (el.innerText.includes("Shorts")) {
      el.style.display = settings.shorts ? "none" : "";
    }
  });
}

/* -------- SIDEBAR -------- */
function handleSidebar() {
  const sidebar = document.querySelector("#related");
  if (!sidebar) return;

  sidebar.style.display = settings.sidebar ? "none" : "";
}

/* -------- COMMENTS -------- */
function handleComments() {
  const comments = document.querySelector("#comments");
  if (!comments) return;

  comments.style.display = settings.comments ? "none" : "";
}

/* -------- SPEED -------- */
function handleSpeed() {
  const video = document.querySelector("video");
  if (!video) return;

  if (speedInterval) {
    clearInterval(speedInterval);
    speedInterval = null;
  }

  if (settings.speed) {
    speedInterval = setInterval(() => {
      if (video.playbackRate !== 1) {
        video.playbackRate = 1;
      }
    }, 100);
  }
}

/* -------- OBSERVER -------- */
const observer = new MutationObserver(() => {
  hideShorts();
  handleSidebar();
  handleComments();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

/* -------- YOUTUBE NAVIGATION -------- */
document.addEventListener("yt-navigate-finish", () => {
  init();
});