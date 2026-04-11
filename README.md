# Lume

A minimalist immersive writing application for macOS, built with Electron and React.

## Features

- **Immersive Writing Experience**: Full-screen writing mode with dynamic backgrounds
- **Tab-based Document Management**: Multiple documents with drag-to-reorder tabs
- **Document List Sidebar**: Quick access to all documents with search functionality
- **Dynamic Backgrounds**: Choose between rain, snow, stars, or aurora effects
- **Dark Mode**: Beautiful dark theme with glass-morphism effects
- **Auto-save**: Documents are automatically saved to local storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the application:

```bash
npm run build
```

### Running

To run the Electron app:

```bash
npm run electron:start
```

### Development

For development with hot reload:

```bash
npm run dev
```

Note: This runs the Vite dev server. For full Electron development, build first then run with `npm run electron:start`.

## Project Structure

```
Lume/
├── electron/           # Electron main process
│   ├── main.cjs       # Main process entry
│   └── preload.js     # Preload scripts
├── src/               # React source code
│   ├── components/    # UI components
│   │   ├── AuroraBackground.tsx
│   │   ├── BottomBar.tsx
│   │   ├── Editor.tsx
│   │   ├── RainBackground.tsx
│   │   ├── SideBar.tsx
│   │   ├── SnowBackground.tsx
│   │   ├── StarsBackground.tsx
│   │   └── TopBar.tsx
│   ├── App.tsx        # Main app component
│   ├── main.tsx      # React entry point
│   └── index.css     # Global styles
├── dist/              # Build output
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Keyboard Shortcuts

- `Cmd+N` - New Document
- `Cmd+S` - Save Document
- `Cmd+W` - Close Tab
- `Cmd+Shift+S` - Toggle Sidebar

## Technologies

- Electron 33
- React 19
- Vite 6
- Tailwind CSS 4
- Framer Motion
- TypeScript

## License

MIT