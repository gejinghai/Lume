# Lume

[English](README.md) | [中文](README.zh-CN.md)

A minimalist immersive writing app for macOS, built with Electron and React.

## Features

- **Immersive Writing Experience**: Fullscreen writing mode with dynamic background effects
- **Tab-based Document Management**: Multiple document tabs with drag-to-reorder
- **Sidebar Document List**: Quick access to all documents with search functionality
- **Dynamic Backgrounds**: Choose from Rain, Snow, Stars, or Aurora effects
- **Dark Mode**: Beautiful dark theme with glassmorphism effects
- **Auto-save**: Documents automatically saved to local storage

## Quick Start

### Requirements

- Node.js 18+
- npm 9+

### Installation

1. Clone the repository:

```bash
git clone https://github.com/gejinghai/Lume.git
```

2. Install dependencies:

```bash
cd Lume
npm install
```

3. Build:

```bash
npm run build
```

### Run

Start the Electron app:

```bash
npm run electron:start
```

### Build

Build macOS app:

```bash
npm run electron:build
```

Build with China mirror (for Chinese network):

```bash
npm run electron:build:cn
```

One-click build script (recommended):

```bash
cd scripts
./build-dmg.sh
```

After building, the DMG file contains:
- **Lume.app** - Main application
- **InitLume.app** - First launch helper to remove security restrictions
- **Installation Guide.txt** - Installation instructions
- **Applications** - Shortcut to Applications folder

**Installation Steps:**

1. Open DMG file
2. Drag Lume.app to Applications folder
3. Run **InitLume.app** to remove security restrictions
4. Launch Lume normally

### Development

Hot reload development:

```bash
npm run dev
```

Note: This starts Vite dev server. For full Electron development, build first then run `npm run electron:start`.

## Project Structure

```
Lume/
├── electron/                 # Electron main process
│   ├── main.cjs             # Main process entry, handles window creation, menus, shortcuts
│   └── preload.cjs          # Preload script, exposes safe API to renderer
├── public/                  # Static assets
│   ├── images/              # Image resources
│   │   ├── logo.png         # Application icon
│   │   ├── music.jpg        # Music cover image
│   │   ├── rain.jpg         # Rain background image
│   │   └── winter.jpg       # Winter background image
│   └── sounds/              # Audio resources
│       ├── cricket.mp3      # Cricket sound
│       ├── nightsound.mp3   # Night ambient sound
│       ├── rain.mp3         # Rain sound
│       ├── thunder.mp3      # Thunder sound
│       └── wind.mp3         # Wind sound
├── src/                     # React source code
│   ├── components/          # UI components
│   │   ├── AmbientMusicPlayer.tsx  # Ambient music player, manages background music playback
│   │   ├── AuroraBackground.tsx    # Aurora background animation component
│   │   ├── BottomBar.tsx           # Bottom status bar, displays word count
│   │   ├── Editor.tsx              # Text editor, core writing area
│   │   ├── RainBackground.tsx       # Rain background animation component
│   │   ├── SettingsPanel.tsx       # Settings panel, configures background, font, sound
│   │   ├── SideBar.tsx             # Sidebar, document list management
│   │   ├── SnowBackground.tsx      # Snow background animation component
│   │   ├── StarsBackground.tsx     # Stars background animation component
│   │   ├── TopBar.tsx              # Top tab bar, manages document tabs
│   │   └── WelcomePage.tsx         # Welcome page, new user guide
│   ├── App.tsx           # Main app component, state management and coordination
│   ├── electron.d.ts     # Electron API type definitions
│   ├── index.css         # Global styles, includes Tailwind and theme variables
│   └── main.tsx         # React app entry
├── index.html            # HTML entry file
├── metadata.json         # Electron app metadata
├── package.json          # Project config and dependencies
├── scripts/              # Build scripts
│   ├── build-dmg.sh      # One-click build script
│   └── create-init-app.sh # Create first launch helper script
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite build config
└── .gitignore           # Git ignore config
```

## Key Files

### Electron Main Process (electron/)

- **main.cjs**: App entry, creates windows, handles menus, registers shortcuts, manages file read/write operations
- **preload.cjs**: Preload script, establishes secure communication bridge between main and renderer processes

### React Components (src/components/)

- **Editor.tsx**: Core editor component with title, subtitle and content editing
- **WelcomePage.tsx**: Welcome page shown when no document is open
- **SideBar.tsx**: Sidebar displaying all documents with search and delete support
- **TopBar.tsx**: Top tab bar showing currently open document tabs
- **SettingsPanel.tsx**: Settings panel for background effects, volume, fonts
- **BottomBar.tsx**: Bottom status bar showing word and character count
- **Background Components**: Rain, Snow, Stars, Aurora four dynamic background effects

### Config Files

- **package.json**: Project dependencies and scripts with common commands:
  - `npm run dev` - Start dev server
  - `npm run build` - Build production version
  - `npm run electron:start` - Run Electron app
  - `npm run electron:build` - Package macOS app
- **vite.config.ts**: Vite build config with base path and plugins
- **tsconfig.json**: TypeScript compilation options

## Keyboard Shortcuts

- `Cmd+N` - New document
- `Cmd+S` - Save document
- `Cmd+W` - Close tab
- `Cmd+Shift+S` - Toggle sidebar

## Tech Stack

- Electron 33
- React 19
- Vite 6
- Tailwind CSS 4
- Framer Motion
- TypeScript

## License

MIT