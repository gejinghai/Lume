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
│   ├── main.cjs             # Main process entry
│   └── preload.cjs          # Preload script
├── public/                  # Static assets
│   ├── images/              # Images
│   └── sounds/             # Audio files
├── src/                     # React source
│   ├── components/         # UI components
│   ├── App.tsx             # Main app component
│   ├── index.css           # Global styles
│   └── main.tsx            # React entry
├── index.html              # HTML entry
├── package.json            # Project config
├── scripts/                # Build scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── .gitignore             # Git ignore
```

## Key Files

### Electron

- **main.cjs**: App entry, creates windows, handles menus and shortcuts
- **preload.cjs**: Bridge between main and renderer processes

### Components

- **Editor.tsx**: Core editor with title, subtitle and content
- **WelcomePage.tsx**: Welcome screen when no document is open
- **SideBar.tsx**: Document list with search
- **TopBar.tsx**: Tab bar for open documents
- **SettingsPanel.tsx**: Settings for backgrounds, volume, fonts
- **BottomBar.tsx**: Status bar with word count

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