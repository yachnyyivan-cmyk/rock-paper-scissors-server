const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const RoomManager = require('./RoomManager');

class GameServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.NODE_ENV === 'production' 
                    ? ["https://yourdomain.com"] 
                    : ["http://localhost:3000", "http://127.0.0.1:3000"],
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        // Track connected clients
        this.connectedClients = new Map();
        
        // Initialize room manager
        this.roomManager = new RoomManager();
        
        // Move submission tracking for anti-cheat
        this.moveTimeouts = new Map(); // roomId -> Map of playerId -> timeout handle
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }
    
    setupMiddleware() {
        // CORS configuration
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? ["https://yourdomain.com"] 
                : ["http://localhost:3000", "http://127.0.0.1:3000"],
            credentials: true
        }));
        
        // Security middleware
        this.app.use((req, res, next) => {
            // Basic security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });
        
        // Rate limiting for API endpoints
        const rateLimit = {};
        this.app.use('/api', (req, res, next) => {
            const clientIP = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            
            if (!rateLimit[clientIP]) {
                rateLimit[clientIP] = { count: 1, resetTime: now + 60000 };
            } else if (now > rateLimit[clientIP].resetTime) {
                rateLimit[clientIP] = { count: 1, resetTime: now + 60000 };
            } else {
                rateLimit[clientIP].count++;
                if (rateLimit[clientIP].count > 100) { // 100 requests per minute
                    return res.status(429).json({ error: 'Too many requests' });
                }
            }
            next();
        });
        
        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Serve static files from client directory
        this.app.use(express.static(path.join(__dirname, '../client')));
    }
    
    setupRoutes() {
        // Serve the main game page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                connectedClients: this.connectedClients.size,
                uptime: process.uptime()
            });
        });
        
        // API endpoint to get server stats
        this.app.get('/api/stats', (req, res) => {
            res.json({
                connectedClients: this.connectedClients.size,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString(),
                rooms: this.roomManager.getRoomStats()
            });
        });
        
        // API endpoint to get room info by code
        this.app.get('/api/room/:roomCode', (req, res) => {
            try {
                const roomCode = req.params.roomCode.toUpperCase();
                if (!this.roomManager.isValidRoomCode(roomCode)) {
                    return res.status(400).json({ error: 'Invalid room code format' });
                }
                
                const room = this.roomManager.getRoomByCode(roomCode);
                if (!room) {
                    return res.status(404).json({ error: 'Room not found' });
                }
                
                res.json({ room: room.toJSON() });
            } catch (error) {
                console.error('Error getting room info:', error);
                res.status(500).json({ error: 'Server error' });
            }
        });
        
        // Handle 404 for API routes
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({ error: 'API endpoint not found' });
        });
        
        // Catch-all handler for SPA routing
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id} from ${socket.handshake.address}`);
            
            // Store client connection info
            this.connectedClients.set(socket.id, {
                id: socket.id,
                connectedAt: new Date(),
                lastActivity: new Date(),
                address: socket.handshake.address
            });
            
            // Handle client heartbeat
            socket.on('ping', () => {
                const client = this.connectedClients.get(socket.id);
                if (client) {
                    client.lastActivity = new Date();
                }
                socket.emit('pong');
            });
            
            // Handle client identification
            socket.on('identify', (data) => {
                try {
                    const client = this.connectedClients.get(socket.id);
                    if (client && data && typeof data.playerName === 'string') {
                        client.playerName = data.playerName.substring(0, 20); // Limit name length
                        client.lastActivity = new Date();
                        socket.emit('identified', { success: true, playerId: socket.id });
                    } else {
                        socket.emit('identified', { success: false, error: 'Invalid player data' });
                    }
                } catch (error) {
                    console.error('Error handling identify:', error);
                    socket.emit('identified', { success: false, error: 'Server error' });
                }
            });
            
            // Handle room creation
            socket.on('create_room', (data) => {
                try {
                    const client = this.connectedClients.get(socket.id);
                    if (!client || !client.playerName) {
                        socket.emit('room_error', { error: 'Player not identified' });
                        return;
                    }
                    
                    const room = this.roomManager.createRoom(socket.id, client.playerName);
                    socket.join(room.roomId);
                    
                    socket.emit('room_created', {
                        success: true,
                        room: room.toJSON(),
                        roomCode: room.roomCode
                    });
                    
                } catch (error) {
                    console.error('Error creating room:', error);
                    socket.emit('room_error', { error: error.message });
                }
            });
            
            // Handle room joining
            socket.on('join_room', (data) => {
                try {
                    const client = this.connectedClients.get(socket.id);
                    if (!client || !client.playerName) {
                        socket.emit('room_error', { error: 'Player not identified' });
                        return;
                    }
                    
                    if (!data || !data.roomCode) {
                        socket.emit('room_error', { error: 'Room code required' });
                        return;
                    }
                    
                    if (!this.roomManager.isValidRoomCode(data.roomCode)) {
                        socket.emit('room_error', { error: 'Invalid room code format' });
                        return;
                    }
                    
                    const result = this.roomManager.joinRoom(data.roomCode, socket.id, client.playerName);
                    socket.join(result.room.roomId);
                    
                    // Notify all players in the room
                    this.io.to(result.room.roomId).emit('player_joined', {
                        room: result.room.toJSON(),
                        newPlayer: result.player
                    });
                    
                    socket.emit('room_joined', {
                        success: true,
                        room: result.room.toJSON()
                    });
                    
                } catch (error) {
                    console.error('Error joining room:', error);
                    socket.emit('room_error', { error: error.message });
                }
            });
            
            // Handle leaving room
            socket.on('leave_room', () => {
                try {
                    const result = this.roomManager.leaveRoom(socket.id);
                    if (result && result.room) {
                        socket.leave(result.room.roomId);
                        
                        // Notify remaining players
                        this.io.to(result.room.roomId).emit('player_left', {
                            room: result.room.toJSON(),
                            leftPlayer: result.removed
                        });
                        
                        socket.emit('room_left', { success: true });
                    }
                } catch (error) {
                    console.error('Error leaving room:', error);
                    socket.emit('room_error', { error: error.message });
                }
            });
            
            // Handle player ready status
            socket.on('player_ready', (data) => {
                try {
                    const room = this.roomManager.getPlayerRoom(socket.id);
                    if (!room) {
                        socket.emit('room_error', { error: 'Not in a room' });
                        return;
                    }
                    
                    const ready = data && data.ready === true;
                    room.setPlayerReady(socket.id, ready);
                    
                    // Notify all players in the room
                    this.io.to(room.roomId).emit('player_ready_update', {
                        room: room.toJSON(),
                        playerId: socket.id,
                        ready: ready
                    });
                    
                } catch (error) {
                    console.error('Error handling player ready:', error);
                    socket.emit('room_error', { error: error.message });
                }
            });
            
            // Handle player move submission
            socket.on('submit_move', (data) => {
                try {
                    const room = this.roomManager.getPlayerRoom(socket.id);
                    if (!room) {
                        socket.emit('game_error', { error: 'Not in a room' });
                        return;
                    }
                    
                    // Validate input
                    if (!data || typeof data !== 'object') {
                        socket.emit('game_error', { error: 'Invalid request format' });
                        return;
                    }
                    
                    if (!data.move || typeof data.move !== 'string') {
                        socket.emit('game_error', { error: 'Move required and must be a string' });
                        return;
                    }
                    
                    // Validate move value
                    const validMoves = ['rock', 'paper', 'scissors'];
                    const normalizedMove = data.move.toLowerCase().trim();
                    
                    if (!validMoves.includes(normalizedMove)) {
                        socket.emit('game_error', { error: 'Invalid move. Must be rock, paper, or scissors.' });
                        return;
                    }
                    
                    // Prevent duplicate move submission
                    const player = room.getPlayer(socket.id);
                    if (player && player.currentMove !== null) {
                        socket.emit('game_error', { error: 'Move already submitted for this round' });
                        return;
                    }
                    
                    // Set player move
                    const moveSet = room.setPlayerMove(socket.id, normalizedMove);
                    if (!moveSet) {
                        socket.emit('game_error', { error: 'Failed to record move' });
                        return;
                    }
                    
                    socket.emit('move_submitted', { success: true });
                    
                    // Check if all players have submitted moves
                    if (room.haveAllPlayersSubmittedMoves()) {
                        // Clear any pending timeouts for this room
                        if (this.moveTimeouts.has(room.roomId)) {
                            const timeouts = this.moveTimeouts.get(room.roomId);
                            timeouts.forEach(timeout => clearTimeout(timeout));
                            this.moveTimeouts.delete(room.roomId);
                        }
                        
                        // Calculate round result
                        const allMoves = room.getAllPlayerMoves();
                        const playerIds = room.getPlayerIds();
                        
                        if (playerIds.length === 2) {
                            const move1 = allMoves[playerIds[0]];
                            const move2 = allMoves[playerIds[1]];
                            
                            // Determine winner using game logic
                            let winner = 'tie';
                            
                            if (move1 !== move2) {
                                const winningMoves = {
                                    rock: 'scissors',
                                    paper: 'rock',
                                    scissors: 'paper'
                                };
                                
                                if (winningMoves[move1] === move2) {
                                    winner = playerIds[0];
                                } else {
                                    winner = playerIds[1];
                                }
                            }
                            
                            // Broadcast result with both moves revealed
                            this.io.to(room.roomId).emit('round_result', {
                                winner: winner,
                                moves: {
                                    [playerIds[0]]: move1,
                                    [playerIds[1]]: move2
                                },
                                room: room.toJSON()
                            });
                        } else {
                            // Broadcast to all players that all moves are in
                            this.io.to(room.roomId).emit('all_moves_submitted', {
                                timestamp: new Date().toISOString()
                            });
                        }
                    } else {
                        // Set a timeout to auto-complete round if second player doesn't submit
                        // This prevents players from waiting indefinitely
                        if (!this.moveTimeouts.has(room.roomId)) {
                            this.moveTimeouts.set(room.roomId, new Map());
                        }
                        
                        const moveTimeout = setTimeout(() => {
                            const room = this.roomManager.getPlayerRoom(socket.id);
                            if (room && !room.haveAllPlayersSubmittedMoves()) {
                                console.log(`Move timeout for room ${room.roomCode}`);
                                // Auto-select rock for players who haven't submitted
                                room.getPlayerIds().forEach(playerId => {
                                    const player = room.getPlayer(playerId);
                                    if (player && !player.currentMove) {
                                        room.setPlayerMove(playerId, 'rock');
                                    }
                                });
                                
                                // If all moves are now in, broadcast result
                                if (room.haveAllPlayersSubmittedMoves()) {
                                    const allMoves = room.getAllPlayerMoves();
                                    const playerIds = room.getPlayerIds();
                                    
                                    if (playerIds.length === 2) {
                                        const move1 = allMoves[playerIds[0]];
                                        const move2 = allMoves[playerIds[1]];
                                        
                                        let winner = 'tie';
                                        
                                        if (move1 !== move2) {
                                            const winningMoves = {
                                                rock: 'scissors',
                                                paper: 'rock',
                                                scissors: 'paper'
                                            };
                                            
                                            if (winningMoves[move1] === move2) {
                                                winner = playerIds[0];
                                            } else {
                                                winner = playerIds[1];
                                            }
                                        }
                                        
                                        this.io.to(room.roomId).emit('round_result', {
                                            winner: winner,
                                            moves: {
                                                [playerIds[0]]: move1,
                                                [playerIds[1]]: move2
                                            },
                                            room: room.toJSON()
                                        });
                                    }
                                }
                            }
                        }, 20000); // 20 second timeout
                        
                        this.moveTimeouts.get(room.roomId).set(socket.id, moveTimeout);
                    }
                    
                } catch (error) {
                    console.error('Error handling move submission:', error);
                    socket.emit('game_error', { error: 'Server error while processing move' });
                }
            });
            
            // Handle request for current game state
            socket.on('get_game_state', () => {
                try {
                    const room = this.roomManager.getPlayerRoom(socket.id);
                    if (!room) {
                        socket.emit('game_error', { error: 'Not in a room' });
                        return;
                    }
                    
                    socket.emit('game_state', {
                        room: room.toJSON(),
                        playerIds: room.getPlayerIds(),
                        status: room.status
                    });
                    
                } catch (error) {
                    console.error('Error handling game state request:', error);
                    socket.emit('game_error', { error: error.message });
                }
            });
            
            // Handle game result submission
            socket.on('submit_round_result', (data) => {
                try {
                    const room = this.roomManager.getPlayerRoom(socket.id);
                    if (!room) {
                        socket.emit('game_error', { error: 'Not in a room' });
                        return;
                    }
                    
                    if (!data || !data.winner) {
                        socket.emit('game_error', { error: 'Winner data required' });
                        return;
                    }
                    
                    // Update scores if there's a winner
                    if (data.winner !== 'tie') {
                        if (room.getPlayer(data.winner)) {
                            room.updatePlayerScore(data.winner, 1);
                        }
                    }
                    
                    // Clear moves for next round
                    room.clearPlayerMoves();
                    room.setPlayerReady(socket.id, false);
                    
                    // Broadcast result to all players in room
                    this.io.to(room.roomId).emit('round_result', {
                        winner: data.winner,
                        room: room.toJSON()
                    });
                    
                } catch (error) {
                    console.error('Error handling round result:', error);
                    socket.emit('game_error', { error: error.message });
                }
            });
            
            // Handle getting player connection status
            socket.on('get_connection_status', () => {
                try {
                    const room = this.roomManager.getPlayerRoom(socket.id);
                    if (!room) {
                        socket.emit('connection_status', { connected: false });
                        return;
                    }
                    
                    const connectionStatus = {};
                    for (const playerId of room.getPlayerIds()) {
                        const playerSocket = this.io.sockets.sockets.get(playerId);
                        connectionStatus[playerId] = {
                            connected: playerSocket ? true : false,
                            lastSeen: new Date().toISOString()
                        };
                    }
                    
                    socket.emit('connection_status', {
                        connected: true,
                        players: connectionStatus
                    });
                    
                } catch (error) {
                    console.error('Error handling connection status:', error);
                    socket.emit('connection_error', { error: error.message });
                }
            });
            
            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
                
                // Remove from room if in one
                const result = this.roomManager.leaveRoom(socket.id);
                if (result && result.room) {
                    // Notify remaining players
                    this.io.to(result.room.roomId).emit('player_disconnected', {
                        room: result.room.toJSON(),
                        disconnectedPlayer: result.removed
                    });
                }
                
                this.connectedClients.delete(socket.id);
            });
            
            // Handle connection errors
            socket.on('error', (error) => {
                console.error(`Socket error for ${socket.id}:`, error);
            });
        });
        
        // Periodic cleanup of inactive connections
        setInterval(() => {
            const now = new Date();
            const timeout = 5 * 60 * 1000; // 5 minutes
            
            for (const [socketId, client] of this.connectedClients.entries()) {
                if (now - client.lastActivity > timeout) {
                    console.log(`Cleaning up inactive client: ${socketId}`);
                    const socket = this.io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.disconnect(true);
                    }
                    this.connectedClients.delete(socketId);
                }
            }
        }, 60000); // Check every minute
    }
    
    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`Game server running on port ${port}`);
            console.log(`Open http://localhost:${port} to play`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        
        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            this.server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
        
        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            this.server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
    
    // Utility method to get connected clients count
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    
    // Utility method to get client info
    getClientInfo(socketId) {
        return this.connectedClients.get(socketId);
    }
}

// Start the server
const gameServer = new GameServer();
gameServer.start(process.env.PORT || 3000);