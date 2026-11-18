<div align="center">

<img src="icons/icon128.png" alt="YouTube Study Enhancer logo" width="96" height="96">

# YouTube Study Enhancer

**Block YouTube Shorts, hide recommendations and comments, block distracting websites, and focus with a Pomodoro timer, lofi music and ambient sounds — all in one free Chrome extension.**

![Version](https://img.shields.io/badge/version-0.5.4-7c7ff5)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34a853)
![Chrome](https://img.shields.io/badge/Chrome-extension-4285F4?logo=googlechrome&logoColor=white)
![No tracking](https://img.shields.io/badge/tracking-none-3fcf8e)

[**Install from the Chrome Web Store**](CHROME_WEB_STORE_LINK) · [Changelog](CHANGELOG.md) · [Report a bug](https://github.com/reapertakumi/YouTube-Study-Enhancer/issues)

</div>

---

YouTube Study Enhancer is a **distraction blocker and focus tool for students, researchers and anyone who wants to watch YouTube intentionally**. It removes YouTube Shorts, the recommended videos sidebar, comments and notifications, stops you from speeding through lectures at 2x, and blocks time-wasting sites like Instagram, TikTok, X (Twitter) and Reddit — on your own schedule.

When a site is blocked you land on a calm **study home page** with a Pomodoro timer, to-do list, lofi music player, ambient sound mixer and brainwave sounds, so you go straight back to focusing instead of scrolling.

## ✨ Features

### 🎬 YouTube without distractions
| Feature | What it does |
|---|---|
| **Hide YouTube Shorts** | Removes Shorts from the homepage, search results, subscriptions and the sidebar. Opening a Shorts link takes you back to the YouTube homepage. |
| **Block Short Scroll** | Lets you watch one Short but stops endless scrolling to the next one (mouse wheel, trackpad, arrow keys and swipes). |
| **Hide Video Feed** | Hides the recommended videos / "Up next" sidebar. *Remove* mode also widens the video (theater mode); *Hide* mode keeps the player size. |
| **Hide Comments** | Hides the comment section on videos and the comment button on Shorts. |
| **Block 2x Speed** | Stops playback from being sped up above 1x, so you actually take in the lecture. Slowing down still works. |
| **Remove Notifications** | Hides the YouTube notification bell. |
| **Customize Features** | Choose which YouTube toggles appear in the popup. |

### 🚫 Website blocker
- One-click blocking for **YouTube, YouTube Shorts, Instagram, X (Twitter), TikTok, Reddit and Pinterest**.
- **Block any website** by adding your own domains (subdomains are blocked too, e.g. blocking `facebook.com` also blocks `m.facebook.com`).
- Sites are blocked **before they load**, so they never flash on screen.
- Choose what you see instead: the full **study home page** or a minimal "Site Blocked" page.

### ⏰ Schedule & self-control
- **Scheduled blocking:** pick the days, start time and end time (overnight ranges like 22:00–06:00 work), and which sites and features to block.
- **Password lock:** lock your settings so you can't switch blocking off on impulse.

### 🍅 Study home page (focus mode)
- **Pomodoro timer** with custom focus, short break and long break lengths, auto-start of the next session and gentle chimes. Keeps accurate time even in background tabs.
- **Clock mode** with 12/24-hour formats and several date formats.
- **To-do list** with a progress bar and keyboard shortcuts.
- **Lofi music player** with built-in study music, ⭐ favorites pinned to the top, search, repeat, and support for **uploading your own music**.
- **Spotify player** — paste any Spotify playlist, album, song or podcast link.
- **Ambient sound mixer** with 12 sounds: rain, thunder, ocean, river, fire, birds, morning, night, coffee shop, and brown, white and pink noise, each with its own volume.
- **Brainwave / binaural sounds**: theta (4–7 Hz), alpha (8–12 Hz), beta (16–24 Hz) and gamma (35–45 Hz) for relaxation, focus and concentration.
- **Backgrounds**: a gallery of high-quality wallpapers (downloaded only when you pick one) or upload your own.
- **Website shortcuts** in the taskbar and rotating **motivational quotes**.

### 🛠️ Extras
- **Hotkeys**: open your favourite websites with your own keyboard shortcuts. Open the popup with `Ctrl+Shift+Y`.
- **Right-click tools**: save any image as **PNG or JPG** (instead of WebP), and take a **screenshot** of the visible area or the **full page**.
- **Themes**: dark and light mode, 9 colour presets (Sunset, Ocean, Midnight, Sakura, Winter, Lofi, Retro, Neon…), 10 fonts and optional Sakura / snow particles.

## 📦 Installation

### Chrome Web Store (recommended)
Install it from the [**Chrome Web Store**](CHROME_WEB_STORE_LINK). Updates install automatically.

### Manual install (developer mode)
1. Download the latest release ZIP from [Releases](https://github.com/reapertakumi/YouTube-Study-Enhancer/releases) and unzip it, or clone the repo:
   ```bash
   git clone https://github.com/reapertakumi/YouTube-Study-Enhancer.git
   ```
2. Open `chrome://extensions/` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the extension folder.

## 🚀 How to use
1. Click the extension icon (or press `Ctrl+Shift+Y`) to open the popup.
2. Under **YouTube Features**, switch on what you want hidden — for example *Hide Video Feed* and *Hide Comments*.
3. Under **Block Sites**, switch on the sites that distract you, or click **Add Custom Domain**.
4. Open **Settings ⚙️** to set a **schedule**, a **password lock**, hotkeys, themes and fonts.
5. Click the 🏠 button any time to open the study home page with the Pomodoro timer and music.

## 🔒 Privacy
- **No accounts, no ads, no analytics, no tracking.** The extension doesn't collect or sell any data.
- Your settings are stored with Chrome's own storage (synced to your Chrome profile if you use Chrome sync). Your tasks, uploaded music and backgrounds stay in your browser.
- The extension only connects to other services to load content you use: preset backgrounds, sounds and music from this GitHub repository, website icons for your shortcuts (Google favicon service), fonts (Google Fonts) and the Spotify player if you use it.

### Why the permissions are needed
| Permission | Used for |
|---|---|
| Access to all websites | Blocking the sites you choose (including your own custom domains) and applying the YouTube features |
| `declarativeNetRequestWithHostAccess` | Redirecting blocked sites before they load |
| `storage` | Saving your settings |
| `alarms` | Starting and ending your blocking schedule on time |
| `scripting` | Measuring the page for full-page screenshots |
| `contextMenus`, `downloads` | The right-click "Save image as PNG/JPG" and screenshot options |
| `debugger` | Capturing full-page screenshots (only while a screenshot is being taken) |

## 🧾 Changelog
See [CHANGELOG.md](CHANGELOG.md) for every release, from 0.1 to the latest version.

## 💬 Feedback & contributing
Found a bug or have an idea? [Open an issue](https://github.com/reapertakumi/YouTube-Study-Enhancer/issues). Pull requests are welcome.

## ❤️ Credits
Made by **@reapertakumi** and **yasmin**.

Built-in music by fassounds, Lofi Music Library, LofiDreams, Mondamusic, Sonican and Watermello.

---

<sub>Keywords: YouTube Shorts blocker · hide YouTube recommendations · hide YouTube comments · YouTube distraction blocker · website blocker · site blocker · block Instagram, TikTok, Reddit, Twitter/X · focus mode · study mode · productivity extension · Pomodoro timer · study timer · lofi study music · ambient sounds · white noise · binaural beats · screen time · digital wellbeing · Chrome extension</sub>
