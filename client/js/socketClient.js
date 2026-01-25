/**
 * Socket.IO Client Manager
 * Handles all WebSocket communication with the game server
 */
class SocketClient {
    constructor(options = {}) {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Starting delay in ms
        this.maxReconnectDelay = 30000; // Max delay in ms
        this.isConnecting = false;
        this.isConnected = false;
        this.playerName = options.playerName || 'Player';
        this.playerId = null;
        this.currentRoom = null;
        
        // Event callbacks
        this.callbacks = {};
        
        this.connect();
    }
    
    /**
     * Connect to the server
     */
    connect() {
        if (this.isConnecting || this.isConnected) {
            console.warn('Socket already connecting or connected');
            return;
        }
        
        this.isConnecting = true;
        
        try {
            const socketOptions = {
                reconnection: true,
                reconnectionDelay: this.reconnectDelay,
                reconnectionDelayMax: this.maxReconnectDelay,
                reconnectionAttempts: this.maxReconnectAttempts,
                autoConnect: true,
                transports: ['websocket', 'polling']
            };
            
            this.socket = io(socketOptions);
            
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize socket.io:', error);
            this.isConnecting = false;
            this.emit('connection_error', { error: 'Failed to initialize socket.io' });
        }
    }
    
    /**
     * Setup all socket event listeners
     */
    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => this.handleConnect());
        this.socket.on('disconnect', (reason) => this.handleDisconnect(reason));
        this.socket.on('error', (error) => this.handleError(error));
        this.socket.on('connect_error', (error) => this.handleConnectError(error));
        this.socket.on('reconnect_attempt', () => this.handleReconnectAttempt());
        this.socket.on('reconnect', () => this.handleReconnect());
        this.socket.on('pong', () => this.handlePong());
        
        // Identification
        this.socket.on('identified', (data) => this.handleIdentified(data));
        
        // Room events
        this.socket.on('room_created', (data) => this.emit('room_created', data));
        this.socket.on('room_joined', (data) => this.emit('room_joined', data));
        this.socket.on('room_left', (data) => this.emit('room_left', data));
        this.socket.on('room_error', (data) => this.emit('room_error', data));
        this.socket.on('player_joined', (data) => this.emit('player_joined', data));
        this.socket.on('player_left', (data) => this.emit('player_left', data));
        this.socket.on('player_disconnected', (data) => this.emit('player_disconnected', data));
        this.socket.on('player_ready_update', (data) => this.emit('player_ready_update', data));
        
        // Game events
        this.socket.on('game_state', (data) => this.emit('game_state', data));
        this.socket.on('move_submitted', (data) => this.emit('move_submitted', data));
        this.socket.on('all_moves_submitted', (data) => this.emit('all_moves_submitted', data));
        this.socket.on('round_result', (data) => this.emit('round_result', data));
        this.socket.on('game_error', (data) => this.emit('game_error', data));
        
        // Connection status
        this.socket.on('connection_status', (data) => this.emit('connection_status', data));
        this.socket.on('connection_error', (data) => this.emit('connection_error', data));
    }
    
    /**
     * Handle successful connection
     */
    handleConnect() {
        console.log('Socket connected:', this.socket.id);
        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.playerId = this.socket.id;
        
        // Identify player to server
        this.identify(this.playerName);
        
        this.emit('connected', { playerId: this.playerId });
    }
    
    /**
     * Handle disconnection
     */
    handleDisconnect(reason) {
        console.log('Socket disconnected, reason:', reason);
        this.isConnected = false;
        
        // Don't auto-reconnect for certain reasons
        if (reason === 'io server disconnect') {
            console.log('Server disconnected the client');
        }
        
        this.emit('disconnected', { reason });
    }
    
    /**
     * Handle socket errors
     */
    handleError(error) {
        console.error('Socket error:', error);
        this.emit('error', { error });
    }
    
    /**
     * Handle connection errors
     */
    handleConnectError(error) {
        console.error('Connection error:', error);
        this.reconnectAttempts++;
        this.emit('connect_error', { error, attempt: this.reconnectAttempts });
    }
    
    /**
     * Handle reconnection attempt
     */
    handleReconnectAttempt() {
        console.log(`Reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        this.emit('reconnect_attempt', { attempt: this.reconnectAttempts + 1 });
    }
    
    /**
     * Handle successful reconnection
     */
    handleReconnect() {
        console.log('Socket reconnected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Re-identify after reconnection
        this.identify(this.playerName);
        
        this.emit('reconnected', {});
    }
    
    /**
     * Handle pong response
     */
    handlePong() {
        console.log('Pong received');
    }
    
    /**
     * Handle identification response
     */
    handleIdentified(data) {
        if (data.success) {
            console.log('Player identified:', data.playerId);
            this.emit('identified', data);
        } else {
            console.error('Identification failed:', data.error);
            this.emit('identification_error', data);
        }
    }
    
    /**
     * Emit custom event
     */
    emit(eventName, data) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in callback for ${eventName}:`, error);
                }
            });
        }
    }
    
    /**
     * Subscribe to events
     */
    on(eventName, callback) {
        if (!this.callbacks[eventName]) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.callbacks[eventName] = this.callbacks[eventName].filter(cb => cb !== callback);
        };
    }
    
    /**
     * Subscribe to event once
     */
    once(eventName, callback) {
        const unsubscribe = this.on(eventName, (data) => {
            callback(data);
            unsubscribe();
        });
        return unsubscribe;
    }
    
    /**
     * Identify player to server
     */
    identify(playerName) {
        if (!this.isConnected) {
            console.warn('Cannot identify: not connected');
            return;
        }
        
        this.playerName = playerName;
        this.socket.emit('identify', { playerName });
    }
    
    /**
     * Send heartbeat ping
     */
    ping() {
        if (!this.isConnected) {
            console.warn('Cannot ping: not connected');
            return;
        }
        
        this.socket.emit('ping');
    }
    
    /**
     * Create a new room
     */
    createRoom() {
        if (!this.isConnected) {
            this.emit('room_error', { error: 'Not connected to server' });
            return;
        }
        
        this.socket.emit('create_room');
    }
    
    /**
     * Join a room by code
     */
    joinRoom(roomCode) {
        if (!this.isConnected) {
            this.emit('room_error', { error: 'Not connected to server' });
            return;
        }
        
        if (!roomCode || roomCode.length !== 6) {
            this.emit('room_error', { error: 'Invalid room code' });
            return;
        }
        
        this.socket.emit('join_room', { roomCode: roomCode.toUpperCase() });
    }
    
    /**
     * Leave current room
     */
    leaveRoom() {
        if (!this.isConnected) {
            this.emit('room_error', { error: 'Not connected to server' });
            return;
        }
        
        this.socket.emit('leave_room');
        this.currentRoom = null;
    }
    
    /**
     * Set player ready status
     */
    setReady(ready = true) {
        if (!this.isConnected) {
            this.emit('game_error', { error: 'Not connected to server' });
            return;
        }
        
        this.socket.emit('player_ready', { ready });
    }
    
    /**
     * Submit player move with validation
     */
    submitMove(move) {
        if (!this.isConnected) {
            this.emit('game_error', { error: 'Not connected to server' });
            return;
        }
        
        // Validate move
        const validMoves = ['rock', 'paper', 'scissors'];
        const normalizedMove = move ? move.toLowerCase().trim() : '';
        
        if (!normalizedMove || !validMoves.includes(normalizedMove)) {
            this.emit('game_error', { error: 'Invalid move. Must be rock, paper, or scissors.' });
            return;
        }
        
        this.socket.emit('submit_move', { move: normalizedMove });
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        if (!this.isConnected) {
            this.emit('game_error', { error: 'Not connected to server' });
            return;
        }
        
        this.socket.emit('get_game_state');
    }
    
    /**
     * Submit round result
     */
    submitRoundResult(winner) {
        if (!this.isConnected) {
            this.emit('game_error', { error: 'Not connected to server' });
            return;
        }
        
        this.socket.emit('submit_round_result', { winner });
    }
    
    /**
     * Get connection status of all players in room
     */
    getConnectionStatus() {
        if (!this.isConnected) {
            this.emit('connection_error', { error: 'Not connected to server' });
            return;
        }
        
        this.socket.emit('get_connection_status');
    }
    
    /**
     * Check if connected
     */
    isSocketConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }
    
    /**
     * Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
    
    /**
     * Reconnect socket
     */
    reconnect() {
        if (this.socket) {
            this.socket.connect();
        } else {
            this.connect();
        }
    }
}

// Make SocketClient available globally
if (typeof window !== 'undefined') {
    window.SocketClient = SocketClient;
}
