# Changelog

All notable changes to **YouTube Study Enhancer** are documented here, newest first.

YouTube Study Enhancer is a Chrome extension that removes YouTube distractions (Shorts, suggested videos, comments, 2x speed) and blocks distracting sites with a focus-friendly home page that has a Pomodoro timer, tasks, ambient sounds and lofi music.

---

## [0.5.4] - 2026-11-18

### Highlights
- 🎵 **Redesigned music player** with a "now playing" card, playback times and favorites
- ⭐ **Favorite songs** with a star to pin them to the top of your library
- 🚀 **Much faster first start**: the home page shows up after downloading one 366 KB background instead of ~28 MB
- 🖼️ **Smaller, sharper backgrounds** in WebP format (134 MB → 32 MB for the full set)

### Added
- **Favorites:** click the ⭐ on any song to pin it to the top of the library. Favorites are remembered between sessions.
- **Song details:** every song now shows its title with the artist underneath, in the library and in the "now playing" card.
- **Playback time:** elapsed and total time are shown under the seek bar, and the seek and volume bars fill in as they move.
- **Now playing animation:** the cover turns into animated equalizer bars while music is playing.
- **Library count and empty state:** the library shows how many songs it has, and a short hint when it's empty.
- **Loading progress:** the first-start screen says what it's doing ("Downloading background...", "Applying background...").
- **New backgrounds on GitHub** are picked up automatically (checked once a week).
- WebP support for preset backgrounds.

### Changed
- **Music player redesign:** a big play button, repeat on the left, an always-visible volume slider, numbered tracks, an always-visible search box and a clearer **+ Add** button for your own music.
- **Easier song names:** all 13 built-in tracks were renamed to short, memorable titles (artist credit kept). Your play history and removed songs carry over automatically.
- **Faster music library:** the song list is cached for 12 hours, so opening new tabs no longer asks GitHub every time (and won't hit GitHub's hourly request limit). If GitHub can't be reached, the last known list is used.
- **Loading screen waits until the page is really ready.** It stays until the background is visible, the music library is loaded and the page has finished loading, instead of disappearing after a fixed 2 seconds. It gives up after 20 seconds so you are never stuck.
- **Preset backgrounds download on demand.** Only the default background is downloaded on first start; others download the first time you pick them.
- **No more black flash:** on later visits the home page fades in together with your saved background.
- Popup credit now reads "made by @reapertakumi, yasmin".

### Fixed
- Deleting all built-in backgrounds made the page re-download every one of them (~28 MB) on the next visit. Deleted presets now stay deleted.
- Removing a song listed above the one that's playing made the wrong song look active.

### Performance
- First start downloads 366 KB instead of ~28 MB of backgrounds before showing the page.
- Backgrounds are decoded before being shown, so they appear in one go instead of painting in slowly.
- Connections to GitHub are opened early so remaining downloads start sooner.

---

## [0.5.3] - 2026-11-18

A big stability and performance release: about 25 bug fixes and a much lighter extension.

### Security & Privacy
- Removed the `tabs` and `activeTab` permissions, which weren't needed. The extension no longer asks to "read your browsing history".
- Fixed the password lock: pressing Enter in "Change password" could save a new password **without checking the current one**.
- Song file names are now displayed as plain text, so a file name can't inject HTML.

### Added
- **Instant site blocking:** blocked sites are now redirected by Chrome itself before any of their content loads, so they no longer flash on screen first.
- **Overnight schedules:** time ranges like 22:00 – 06:00 now work.
- The full-page screenshot fallback now joins the captured parts into one image and saves it (before, it threw them away).

### Changed
- **The schedule only adds blocks:** it turns on the features you picked and leaves the rest of your settings alone (before, it switched off blocks you had on permanently).
- **"Block 2x Speed" only blocks speeding up:** you can still slow a video down.

### Fixed
- **Wrong sites were blocked:** with X/Twitter on, sites like netflix.com and dropbox.com (anything containing "x.com") were blocked, and so was any Google search mentioning a blocked site. Matching now uses the real domain and its subdomains only.
- **Schedule:** the background and the popup ran separate schedule checks and could overwrite your original settings; schedules stopped firing when Chrome put the background to sleep; turning off a schedule that hadn't started restored outdated settings; the "Pending" status kept its yellow colour when active.
- **Shorts scroll lock:** moving between Shorts stacked up extra listeners and timers that never stopped, and taps stopped working on touchscreens.
- **YouTube:** "Remove notifications" didn't apply when a page first loaded; hiding comments, the feed and notifications often failed because YouTube loads them late; theater mode forgot its original state after clicking another video and toggled when leaving a page; videos added after the page loaded weren't speed-limited.
- **Music player:** "Next" bounced between the same two songs forever; repeat showed as on after reloading but didn't repeat; uploaded music didn't load when GitHub was unreachable.
- **Timer:** pausing left the countdown in the tab title; an empty duration showed `NaN:NaN`; the timer ran slow in background tabs.
- **Hotkeys:** a custom hotkey no longer also triggers the browser's or the page's own action for the same keys.

### Performance
- The site blocker used to react to every change on every page of every site. It now only runs when the address changes.
- YouTube features use a single stylesheet instead of a page-wide watcher and three repeating timers.
- The schedule checks once a minute with Chrome alarms instead of two separate once-per-second checks.
- Ambient sounds download the first time you play each one instead of all 12 every time the home page opens.
- Background images are no longer recreated (and leaked) on every gallery render.
- The popup loads only your chosen font instead of all 9, and checks GitHub for the latest version at most every 6 hours.
- Removed duplicate script injection, messages sent to every tab on each toggle, and debug logging.

---

## [0.5.2] - 2026-09-28

### Added
- **Time-based blocking:** a schedule that applies your chosen blocks on selected days and times.
- A loading screen on the first visit to the home/block page so everything can load.
- A second sound tab with brainwave sounds for different situations.

### Changed
- The home/block page is faster, and the background settings panel opens more smoothly, uses fewer resources and has a new design.

### Fixed
- Block Short Scroll sometimes still allowed scrolling, including with the mouse while comments were open (new blocking method).
- Hide Video Feed: hide mode sometimes didn't apply, and remove mode could turn the video black.
- Other small bug fixes.

## [0.4.8] - 2026-07-28

### Changed
- The YouTube Shorts button is removed while Block Short Scroll is on (clicking it loaded another Short).
- Small UX improvements to the hotkey menu in the popup settings.

### Fixed
- Block Short Scroll didn't prevent scrolling when enabled while already watching a Short.

## [0.4.7] - 2026-06-29

### Added
- **Customize features:** choose which YouTube features appear in the popup.
- **Remove notifications:** hides the YouTube notification bell.
- **Block Short Scroll:** lets you watch a Short but stops scrolling to the next one (mouse wheel, trackpad and arrow keys). The original Block Shorts, which removes Shorts and redirects to YouTube, is still available.

### Changed
- Fonts now apply to the whole popup.
- Small redesign of the settings window in the popup; removed popup scrollbars.

### Fixed
- Hiding comments now also removes the comments button on YouTube Shorts.
- The settings tab underline didn't display properly when opening settings.

## [0.4.6] - 2026-05-30

### Home / block page 2.0 (complete rewrite)
- **Ambient sound mixer** with 12 sounds (Rain, Thunder, Ocean, Morning, Night, River, Fire, Birds, Coffee Shop, Brown/White/Pink Noise), each with its own volume.
- **Music player** with a library, play/pause, next/previous, seeking, volume, repeat, search and uploading your own music.
- **Spotify tab** with an embedded player; paste any playlist or song link.
- **Pomodoro timer** with custom Pomodoro/short/long break lengths, auto-play next timer and a preferred break.
- **Task list** with a progress bar, inline editing and keyboard shortcuts (Enter for a new task, Backspace to delete an empty one, Shift+Enter for a new line).
- **Clock mode** with 4 time formats and 4 date formats.
- **Backgrounds:** preset gallery, custom uploads and remembering your last background.
- **Taskbar** with 4 customizable website shortcuts (favicons, right-click to edit).
- 30 motivational quotes that rotate every 5 minutes.
- Storage moved to IndexedDB for large files (backgrounds and uploaded music).

### Fixed
- Full-page screenshot capture.
- Settings being applied before they had loaded.
- A memory leak and slow page lookups on YouTube.
- Video feed hide mode, faster comment hiding, and a partially broken Shorts hiding feature.
- Resources are now cleaned up properly when the extension is disabled.

## [0.4.3] - 2026-05-22

### Added
- New themes, including a Winter snow particle effect.
- **Screenshots** in the right-click menu (visible area and full page).
- Opening a Shorts link while Shorts are blocked redirects to the YouTube homepage.

### Changed
- YouTube features are only re-applied when something changes, not every 200 ms, and new settings reach other open tabs.
- Hotkeys only listen for the keys you've set.
- Thinner, nicer scrollbars in every theme.
- Improved popup start animation.

### Removed
- The Aurora theme (it looked too much like Ocean; let us know if you want it back).

### Fixed
- Popup GPU usage dropped from about 20% to 3% by removing heavy CSS.
- Removed GPU-heavy layers from the block page.
- Video feed remove and hide modes.

## [0.4.2] - 2026-05-06

### Fixed
- Performance issues.

## [0.4.1] - 2026-05-06

### Changed
- Smoother UI and light animations (requires hardware acceleration).
- Hotkeys are displayed more clearly.

## [0.4.0] - 2026-05-05

### Added
- **Hotkeys** to open websites, the extension and the lock.
- Sakura particle effect for the Sakura theme (can be turned off).
- Save images as PNG or JPG from the right-click menu.

### Changed
- New tabbed settings layout and better overall performance.
- Scrollbars keep their styling.

## [0.3.9] - 2026-05-02

### Added
- Music library with support for your own music.
- Hide UI mode.

### Changed
- Better audio downloads with hash checks and more accurate size estimates.
- Better saving.

## [0.3.8] - 2026-05-02

### Changed
- Extension size reduced from over 50 MB to under 1 MB: sounds and lofi music are now downloaded separately from a new download menu on the block page.
- The block page noise is now generated and stored.
- The light size is saved and restored.
- Better overall stability.

## [0.3.7] - 2026-04-30

### Fixed
- The block page settings menu resizing incorrectly.
- The Pomodoro timer didn't play sounds when a break started and ended.

## [0.3.6] - 2026-04-30

### Block page
- **Rewritten as a redirect** instead of injected scripts: faster and more reliable on every site.
- New design with a wave text animation (4 speeds), a two-light system with custom colours, movement types and position presets.
- **Pomodoro timer**, **sticky notes / to-do list**, **ambient sound mixer** (6 sounds with a master volume) and a **lofi music player** (13 tracks).

### Popup
- Removable default sites with a hover delete button.
- New tabbed settings with Reset to Default, theme presets, a font selector and a new tab page option.
- **Video feed mode:** Remove (hides the feed and widens the video) or Hide (keeps the video size).
- **Password lock** with first-time setup and password changes.

### Fixed
- Domain matching for redirects and custom domain blocking.
- Theme and collapsed sections not being remembered.
- Pomodoro timer state when changing durations, sticky note drag limits and closing windows by clicking outside.
- Settings syncing across tabs, plus several performance and memory improvements.

## [0.3.1] - 2026-04-15

### Added
- Themes and fonts.
- The extension and GitHub versions are shown in settings.

### Fixed
- Settings being re-applied without checking whether they were on or off (video feed glitches).

## [0.3] - 2026-04-15

### Added
- Settings lock with a password.
- New music.
- Collapsible categories.
- New settings layout.

## [0.2.7] - 2026-04-13

### Changed
- Improved Shorts hiding; the Shorts button in the side menu is hidden too.
- Removed the update checker; settings just show the current version (Chrome installs updates automatically).

### Fixed
- Shorts reappearing after a search.

## [0.2.5] - 2026-04-09

First **Chrome Web Store** release.

### Changed
- The video feed is also hidden in fullscreen.
- Hiding comments also removes the comment button in fullscreen and on Shorts.
- Better handling of blockers, features and errors.

## [0.2.3] - 2026-03-31

### Added
- **Study mode block page** with an immersive background, background music and a settings cogwheel.

### Changed
- Rewritten code and bug fixes.

## [0.2] - 2026-03-30

### Added
- **Settings** with a hide feed mode: Remove (also widens the video) or Hide (keeps the layout).
- Custom domains accept `google.com`, `www.google.com` and full `https://` links, and block subdomains too.

### Fixed
- YouTube features not re-applying after moving between videos.
- Custom domain blocking with `www.`.
- Theme toggle consistency across the popup.

## [0.1.7] - 2026-03-26

### Changed
- Rewritten code with better error handling.

### Fixed
- Comment and video feed hiding, plus many other fixes.

## [0.1.6] - 2026-03-23

### Changed
- Updated the file chooser.

### Fixed
- Bug fixes.

## [0.1.5] - 2026-03-23

### Added
- Update detector and installer.
- Dark/light theme toggle.
- Muting all audio and video on blocked sites.
- Scroll blocker.
- New logo and a reorganized header.

### Fixed
- Extension context errors, iframe cross-origin errors and script injection errors.

## [0.1.1] - 2026-03-23

### Added
- Hide comments.
- Extension icons.

### Fixed
- Bug fixes.

## [0.1] - 2026-03-22

First release.

### Added
- **Hide Shorts** from the homepage, search results and sidebar.
- **Hide suggested videos** (the "Up next" sidebar).
- **Block 2x speed** (the hold-to-speed-up feature).
- A dark popup with toggle switches; settings are saved automatically.

[0.5.4]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.5.4
[0.5.3]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.5.3
[0.5.2]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.5.2
[0.4.8]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.4.8
[0.4.7]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.4.7
[0.4.6]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.4.6
[0.4.3]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.4.3
[0.4.2]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.4.2
[0.4.1]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.4.1
[0.4.0]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.4.0
[0.3.9]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.3.9
[0.3.8]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.3.8
[0.3.7]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.3.7
[0.3.6]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.3.6
[0.3.1]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.3.1
[0.3]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.3
[0.2.7]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.2.7
[0.2.5]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.2.5
[0.2.3]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.2.3
[0.2]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.2
[0.1.7]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.1.7
[0.1.6]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.1.6
[0.1.5]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.1.5
[0.1.1]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.1.1
[0.1]: https://github.com/reapertakumi/YouTube-Study-Enhancer/releases/tag/0.1
