<div align="center">
    <img src="icons/icon128.png"
        title="YTSE" alt="YTSE" width="120" />
    <h1>YT Study Enhancer</h1>
    <p>
       Transform YouTube Into Your Study Space
    </p>
    <a href="https://v0-studyflowapps.vercel.app/">
        StudyFlow
    </a>
</div>

## Downloads
> [!NOTE]
> Extension is still under Development, please report any Bugs
- [Chrome Webstore](https://chromewebstore.google.com/detail/youtube-study-enhancer/pamglonmkhcpoilnohgaoghgfnjjmjne)
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/youtube-study-enhancer/gpcplfhahjffeonijapnpkbfmdmkemoa)
<p>
</p>

# Changelog
## Core feature (background.js & content.js)
- Fixed Full Page Capture
- Apply Settings run before settings are being fetched
- Fixed memory leak
- Fixed Performance issue with DOM Queries
- Better Error Handling
- Comment Selector hides faster now
- Fixed Video feed Hide Mode
- Clean up Resources properly when Extension is Disabled
- Debounced Processing
- partially broken short hide feature

# Version 2.0 of BLOCKER PAGE (Complete Rewrite)

### Total Code Refactor: The entire codebase (blocker.css, blocker.html, blocker_ui.js) has been completely rewritten from scratch to improve performance, maintainability, and user experience.

- Enhanced Visual Aesthetics

## New & Improved Features:

Ambient Sound Mixer: Added 12 ambient sound options (Rain, Ocean, Fire, White Noise, etc.) with individual volume controls and visual feedback for active tracks.

## Music Player Overhaul:

- Added a functional music library with play/pause, next/previous, progress bar, volume slider, and loop controls.

- Implemented music search functionality and local music file upload support.

- Added a Spotify embedded player tab alongside the new music player and ambient mixer.

- Spotify URL Input allowing users to change the Playlist or song.

## Pomodoro Timer System:

- Added a dedicated timer settings modal to customize Pomodoro, Short Break, and Long Break durations.

- Introduced "Auto-play next timer" toggle and "Preferred Break" selection.

## Integrated Task List:

- Added a task list with real-time progress bar tracking.

- Tasks now auto-save to localStorage and support inline editing, line breaks, and keyboard shortcuts (Enter for new task, Backspace to delete empty task).

- Clock Mode: Added a full-featured digital clock mode with 4 time formats (12h/24h with/without seconds) and 4 date formats.

## Data Management Improvements:

- Migrated all local storage to IndexedDB for better performance with large files (backgrounds, uploaded music).

- Added persistent storage for all user preferences, backgrounds, tasks, and uploaded music.

- Implemented background and music deletion/removal functionality.

## UX Enhancements:

- Added click-pop animations to taskbar icons for better feedback.

- Implemented smooth sliding transitions for quotes, timer, and clock mode switching.

- Added a collapsible music player panel with state persistence.

- others

Complete Feature List
## 1. Visual & Core Interface
- Glass-morphism UI: Modern translucent design with backdrop blur effects.

- Preset gallery of scenic backgrounds (fetched from GitHub repository).

- Custom background upload support.

- Persistent background selection (remembers last used background).

- Background deletion capability.

- macOS-style Taskbar: Centered, hover-expanding taskbar with 7 icons.

- Browser Shortcuts: Added 4 customizable website shortcut icons on the taskbar with favicon support, right-click editing, and modal configuration.

## Smart Quote Display:

- Library of 30 local motivational quotes.

- Automatic rotation every 5 minutes with slide animation.

## 2. Pomodoro Timer & Clock
- Fully customizable durations (Pomodoro, Short Break, Long Break) via settings modal.

- Auto-play next timer option.

- Preferred break selection (short or long).

- Visual sliding mode indicator.

- Start/Pause/Reset controls.

- Soft chime sound on timer completion.

- System Clock Mode:

- Toggle between Pomodoro and Clock mode.

- 4 time formats: 24h with seconds, 12h with seconds, 24h no seconds, 12h no seconds.

- 4 date formats with click-to-cycle functionality.

- Option to hide/show day of the week.

## 3. Integrated Task List
- Add/delete tasks with inline text editing.

- Checkbox to mark tasks as complete.

- Real-time progress bar tracking completion percentage.

- Clear All" button to reset tasks.

### Keyboard Shortcuts:

- Enter: Create a new task.

- Backspace: Delete empty task.

- Shift + Enter: Add line break in task.

- Persistence: Auto-saves all tasks to localStorage.

## 4. Audio & Music Features
### Ambient Sound Mixer
- Rain, Thunder, Ocean, Morning, Night, River, Fire, Bird, Coffee Shop, Brown Noise, White Noise, Pink Noise.

- Individual volume sliders for each sound.

- Visual active state with collapsible slider interface.

### Music Player:
- Play/Pause, Next, Previous controls.

- Progress bar with seeking functionality.

- Volume control with hover-reveal slider.

- Loop mode toggle.

- Song library with currently playing indicator.

- Search functionality to filter songs.

### Music Sources:

Default library of .opus files from GitHub repository. (freesounds)

- Local music file upload support (multiple files).

- Permanent storage of uploaded music in IndexedDB.

- Ability to delete/hide songs from library.

- Spotify embedded player tab.

- Collapsible Player: Music player can be collapsed to save screen space (state saved).

## 5. Browser Shortcuts
- 4 Customizable Website Shortcuts: on the taskbar. (1 YouTube and 2 Wikipedia Preset, can be changed)

- Right click to edit

- Automatic favicon fetching and display.

- URL normalization (adds https:// if missing).

- Persistent storage in localStorage.

## 6. Settings & Customization
### Background Settings Modal:
- Gallery view of all backgrounds (preset + uploaded).

- Upload custom image button.

- Delete background option.

### Timer Settings Modal:

- Customize durations for Pomodoro, Short Break, Long Break.

- Auto-play next timer toggle.

- Preferred break selection (Short/Long).

- Persistence: All settings (timer durations, preferences, clock formats, collapsed states, last played music, etc.) are saved across sessions.

## 7. Additional Features
- Responsive Design: Adapts to different screen sizes with scrollable galleries and lists.

- Keyboard & Accessibility: Focus management on task inputs, Enter to submit shortcuts.

- Smooth Animations: All UI transitions (modals, taskbar, clock/timer switch, quote rotation) feature smooth CSS animations.

- IndexedDB Storage: Efficient storage for large files (backgrounds, uploaded music) with blob URL management.



## Popup

**Block Sites Management**
- Removable default sites (Instagram, Twitter, TikTok, Pinterest, Reddit)
- Custom Domain, Enter ur custom set Domain for blocking more distractions (https://www. or www. or just url.com) blocks domain wide google.com also blocks home.google.com
- Persistence of removed sites across sessions

**YouTube Features**
- Video Feed Mode: Remove (hides feed, expands video) or Hide (hides feed, keeps video size)
- Block 2x Speed toggle
- Hide Video Feed toggle
- Hide Comments toggle

**Lock System**
- Password protection for settings
- First-time password setup flow
- Change password functionality
- Visual lock/unlock indicators
