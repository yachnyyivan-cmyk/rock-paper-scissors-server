# Rock Paper Scissors Game

A web-based Rock Paper Scissors game with AI opponents and multiplayer support.

## Project Structure

```
├── client/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles/            # CSS stylesheets
│   │   └── main.css       # Main stylesheet
│   └── js/                # Client-side JavaScript
│       └── main.js        # Main application logic
├── server/                # Backend files
│   └── server.js          # Express server with Socket.IO
├── shared/                # Shared utilities and types
│   ├── types.js           # Type definitions (JSDoc)
│   └── gameUtils.js       # Game logic utilities
├── package.json           # Project dependencies
└── README.md              # This file
```

## Features

- **Player vs AI**: Play against intelligent AI with three difficulty levels
- **Player vs Player**: Real-time multiplayer using WebSockets
- **Responsive Design**: Works on desktop and mobile devices
- **Modern Web Technologies**: Built with Express.js, Socket.IO, and vanilla JavaScript

## Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Production

To run in production mode:
```bash
npm start
```

## Game Modes

### Player vs AI
- **Easy**: Random moves with no strategy
- **Medium**: Basic pattern recognition and counter-strategies
- **Hard**: Advanced algorithms with adaptive learning

### Player vs Player
- Create or join game rooms with unique codes
- Real-time synchronization between players
- Automatic reconnection handling

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode

### Architecture

The game follows a client-server architecture:

- **Client**: Vanilla JavaScript with Socket.IO for real-time communication
- **Server**: Express.js with Socket.IO for WebSocket handling
- **Shared**: Common utilities and type definitions used by both client and server

## License

MIT License - see LICENSE file for details