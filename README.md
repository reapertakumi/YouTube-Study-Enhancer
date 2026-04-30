# Changelog

## Version 0.3.6 - Major Update (2024)

### 🎯 Core Changes

#### New Blocker Page System
- **Complete rewrite**: Switched from script injection to direct redirection system
- **New UI design**: Completely redesigned blocker page with modern aesthetics
- **Performance boost**: Eliminated injection overhead, resulting in faster page loads
- **Better reliability**: Redirection system works more consistently across all sites

#### Enhanced Visual Experience
- **Wave text animation**: New traveling wave animation for "Study Mode" title
- **4 animation speeds**: Added speed controls (None, Slow, Medium, Fast) for text animation
- **Dual light system**: Main light + secondary light with customizable colors
- **3 movement types**: Static, Smooth Bounce, and Orbit Dance for secondary light
- **Position presets**: Center, Top-Left, Top-Right, Bottom-Left, Bottom-Right for main light
- **Dynamic animations**: Smooth pulse and drift animations with adjustable speeds

#### New Features

**Pomodoro Timer** 🍅
- Built-in focus timer with customizable focus/break durations
- Visual phase indicator (Focus Time / Break Time)
- Local sound notifications when timer completes
- Draggable interface that remembers position
- Start, Pause, and Reset controls

**Sticky Notes / To-Do List** 📝
- Persistent to-do list that saves to localStorage
- Double-click to edit any task
- Add, complete, and delete individual tasks
- Clear all tasks with confirmation
- Draggable window that remembers position
- Animated slide-in for new tasks

**Ambient Sound Mixer** 🌿
- 6 ambient sound channels: Fireplace, Wind, Birds & Nature, Rain, Thunder, Ocean Waves
- Individual volume controls for each sound
- Master volume control
- Persistent settings (saves on/off states and volumes)
- Local audio files for offline use

**Music Player** 🎵
- LoFi study music playlist (13 tracks)
- Play/Pause, Previous, Next controls
- Volume slider with real-time adjustment
- Progress bar with seeking functionality
- Now playing display showing artist and song

#### Popup Enhancements

**Block Sites Management**
- Removable default sites (Instagram, Twitter, TikTok, Pinterest, Reddit)
- New "X" delete button that appears on hover over cards
- Proper animation when removing sites
- Persistence of removed sites across sessions

**Settings Panel**
- New tabbed interface: General, YouTube, Blocker Page
- Reset to Default button - restores all factory settings
- Theme presets: Default, Sunset, Ocean, Forest, Midnight, Coffee, Cyberpunk, Aurora, Sakura
- Font selector with 10 font options
- New Tab Page toggle (Focus Page vs Chrome Default)

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
