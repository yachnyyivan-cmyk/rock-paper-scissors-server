/**
 * @fileoverview GameSession class for managing complete game lifecycle and session state
 */

const GameState = require('./GameState');
const Player = require('./Player');
const { GAME_MODES, GAME_STATUS, generateRoomCode } = require('./gameUtils');

/**
 * GameSession class manages the complete lifecycle of a game session
 * including player management, game state, and session persistence
 */
class GameSession {
    /**
     * Creates a new GameSession instance
     * @param {string} sessionId - Unique session identifier
     * @param {string} mode - Game mode ('pvp' or 'pvai')
     * @param {Object} options - Additional options
     */
    constructor(sessionId, mode, options = {}) {
        this.sessionId = sessionId;
        this.mode = mode;
        this.roomCode = options.roomCode || generateRoomCode();
        this.maxPlayers = 2;
        this.createdAt = new Date();
        this.lastActivityAt = new Date();
        this.isActive = true;
        
        // Initialize game state
        this.gameState = new GameState(sessionId, mode, options);
        
        // Player management
        this.players = new Map(); // Map of playerId -> Player instance
        this.playerOrder = []; // Ordered list of player IDs
        
        // Session settings
        this.settings = {
            maxRounds: options.maxRounds || 5,
            moveTimeout: options.moveTimeout || 15000,
            sessionTimeout: options.sessionTimeout || 300000, // 5 minutes
            allowSpectators: options.allowSpectators || false,
            isPrivate: options.isPrivate || false,
            aiDifficulty: options.aiDifficulty || null
        };
        
        // Session statistics
        this.sessionStats = {
            totalRounds: 0,
            totalGames: 0,
            averageGameDuration: 0,
            playerJoins: 0,
            playerLeaves: 0
        };
        
        // Event callbacks
        this.eventCallbacks = new Map();
    }

    /**
     * Adds a player to the session
     * @param {string} playerId - Player ID
     * @param {string} playerName - Player name
     * @param {Object} playerOptions - Additional player options
     * @returns {Object} Result object with success status and message
     */
    addPlayer(playerId, playerName = 'Player', playerOptions = {}) {
        if (this.players.size >= this.maxPlayers) {
            return { success: false, message: 'Session is full' };
        }

        if (this.players.has(playerId)) {
            return { success: false, message: 'Player already in session' };
        }

        if (!this.isActive) {
            return { success: false, message: 'Session is not active' };
        }

        // Create player instance
        const player = new Player(playerId, playerName, playerOptions);
        this.players.set(playerId, player);
        this.playerOrder.push(playerId);

        // Add player to game state
        const gameResult = this.gameState.addPlayer(playerId, playerName);
        if (!gameResult) {
            // Rollback if game state addition failed
            this.players.delete(playerId);
            this.playerOrder.pop();
            return { success: false, message: 'Failed to add player to game' };
        }

        // Update session statistics
        this.sessionStats.playerJoins++;
        this.lastActivityAt = new Date();

        // Emit player joined event
        this.emitEvent('playerJoined', { playerId, playerName, sessionId: this.sessionId });

        // Check if session is ready to start
        if (this.players.size === this.maxPlayers) {
            this.emitEvent('sessionReady', { sessionId: this.sessionId });
        }

        return { success: true, message: 'Player added successfully', player: player.toJSON() };
    }

    /**
     * Removes a player from the session
     * @param {string} playerId - Player ID to remove
     * @returns {Object} Result object with success status and message
     */
    removePlayer(playerId) {
        if (!this.players.has(playerId)) {
            return { success: false, message: 'Player not found in session' };
        }

        const player = this.players.get(playerId);
        
        // Remove from game state
        this.gameState.removePlayer(playerId);
        
        // Remove from session
        this.players.delete(playerId);
        const orderIndex = this.playerOrder.indexOf(playerId);
        if (orderIndex > -1) {
            this.playerOrder.splice(orderIndex, 1);
        }

        // Update session statistics
        this.sessionStats.playerLeaves++;
        this.lastActivityAt = new Date();

        // Emit player left event
        this.emitEvent('playerLeft', { playerId, sessionId: this.sessionId });

        // End session if no players remain or if PvP with less than 2 players
        if (this.players.size === 0 || (this.mode === GAME_MODES.PVP && this.players.size < 2)) {
            this.endSession('insufficient_players');
        }

        return { success: true, message: 'Player removed successfully' };
    }

    /**
     * Processes a player's move
     * @param {string} playerId - Player making the move
     * @param {string} move - The move
     * @returns {Object} Result object with move result and any round results
     */
    makeMove(playerId, move) {
        if (!this.isActive) {
            return { success: false, message: 'Session is not active' };
        }

        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found in session' };
        }

        // Update player's move
        const playerMoveResult = player.setMove(move);
        if (!playerMoveResult) {
            return { success: false, message: 'Failed to set player move' };
        }

        // Process move in game state
        const gameResult = this.gameState.makeMove(playerId, move);
        if (!gameResult.success) {
            // Rollback player move if game state failed
            player.clearMove();
            return gameResult;
        }

        this.lastActivityAt = new Date();

        // Check if round was completed
        const gameState = this.gameState.getState();
        if (gameState.currentRound > this.sessionStats.totalRounds) {
            // Round was completed, clear player moves and update statistics
            this.players.forEach(p => p.clearMove());
            this.updatePlayerStatistics();
            this.sessionStats.totalRounds = gameState.currentRound;
            
            // Emit round completed event
            this.emitEvent('roundCompleted', {
                sessionId: this.sessionId,
                round: gameState.currentRound,
                gameState: this.getSessionState()
            });
        }

        // Check if game was completed
        if (gameState.status === GAME_STATUS.FINISHED) {
            this.completeGame();
        }

        return {
            success: true,
            message: 'Move processed successfully',
            gameState: this.getSessionState()
        };
    }

    /**
     * Updates player statistics after a round
     */
    updatePlayerStatistics() {
        const gameState = this.gameState.getState();
        const [player1, player2] = gameState.players;
        
        if (!player1 || !player2) return;

        const p1 = this.players.get(player1.id);
        const p2 = this.players.get(player2.id);
        
        if (!p1 || !p2) return;

        // Sync player scores with game state
        p1.score = player1.score;
        p2.score = player2.score;

        // Get previous win counts to determine what happened this round
        const p1PrevWins = p1.statistics.totalWins;
        const p2PrevWins = p2.statistics.totalWins;

        // Determine round result for each player based on score changes
        if (player1.score > p1PrevWins) {
            p1.updateStatistics('win');
            p2.updateStatistics('loss');
        } else if (player2.score > p2PrevWins) {
            p2.updateStatistics('win');
            p1.updateStatistics('loss');
        } else {
            // Tie round - neither score increased
            p1.updateStatistics('tie');
            p2.updateStatistics('tie');
        }
    }

    /**
     * Completes the current game and updates session statistics
     */
    completeGame() {
        const gameState = this.gameState.getState();
        
        // Update session statistics
        this.sessionStats.totalGames++;
        
        if (gameState.finishedAt && gameState.createdAt) {
            const gameDuration = gameState.finishedAt - gameState.createdAt;
            const totalDuration = this.sessionStats.averageGameDuration * (this.sessionStats.totalGames - 1) + gameDuration;
            this.sessionStats.averageGameDuration = totalDuration / this.sessionStats.totalGames;
        }

        // Emit game completed event
        this.emitEvent('gameCompleted', {
            sessionId: this.sessionId,
            winner: gameState.winner,
            finalState: this.getSessionState()
        });
    }

    /**
     * Starts a new game within the session
     * @returns {Object} Result object
     */
    startNewGame() {
        if (!this.isActive) {
            return { success: false, message: 'Session is not active' };
        }

        if (this.players.size < 2) {
            return { success: false, message: 'Not enough players to start game' };
        }

        // Reset game state
        this.gameState.resetGame();
        
        // Reset player game states
        this.players.forEach(player => {
            player.resetGameState();
        });

        this.lastActivityAt = new Date();

        // Emit new game started event
        this.emitEvent('newGameStarted', {
            sessionId: this.sessionId,
            gameState: this.getSessionState()
        });

        return { success: true, message: 'New game started successfully' };
    }

    /**
     * Ends the session
     * @param {string} reason - Reason for ending the session
     */
    endSession(reason = 'manual') {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        this.gameState.clearAllTimers();

        // Emit session ended event
        this.emitEvent('sessionEnded', {
            sessionId: this.sessionId,
            reason,
            finalStats: this.getSessionStatistics()
        });
    }

    /**
     * Gets the current session state
     * @returns {Object} Complete session state
     */
    getSessionState() {
        return {
            sessionId: this.sessionId,
            mode: this.mode,
            roomCode: this.roomCode,
            isActive: this.isActive,
            createdAt: this.createdAt,
            lastActivityAt: this.lastActivityAt,
            settings: { ...this.settings },
            gameState: this.gameState.getState(),
            players: Array.from(this.players.values()).map(p => p.toJSON()),
            playerOrder: [...this.playerOrder],
            sessionStats: { ...this.sessionStats }
        };
    }

    /**
     * Gets comprehensive session statistics
     * @returns {Object} Session statistics
     */
    getSessionStatistics() {
        const sessionDuration = new Date() - this.createdAt;
        const playerStats = Array.from(this.players.values()).map(p => p.getStatistics());
        
        return {
            ...this.sessionStats,
            sessionDuration: Math.round(sessionDuration / 1000), // seconds
            activePlayers: this.players.size,
            gameStats: this.gameState.getStats(),
            playerStatistics: playerStats
        };
    }

    /**
     * Checks if the session has timed out
     * @returns {boolean} True if session has timed out
     */
    hasTimedOut() {
        const now = new Date();
        const timeSinceLastActivity = now - this.lastActivityAt;
        return timeSinceLastActivity > this.settings.sessionTimeout;
    }

    /**
     * Updates player connection status
     * @param {string} playerId - Player ID
     * @param {boolean} connected - Connection status
     */
    updatePlayerConnection(playerId, connected) {
        const player = this.players.get(playerId);
        if (player) {
            player.setConnectionStatus(connected);
            this.lastActivityAt = new Date();
            
            this.emitEvent('playerConnectionChanged', {
                playerId,
                connected,
                sessionId: this.sessionId
            });
        }
    }

    /**
     * Registers an event callback
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    /**
     * Removes an event callback
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emits an event to all registered callbacks
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emitEvent(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Serializes the session to a plain object
     * @returns {Object} Serialized session data
     */
    toJSON() {
        return {
            sessionId: this.sessionId,
            mode: this.mode,
            roomCode: this.roomCode,
            maxPlayers: this.maxPlayers,
            isActive: this.isActive,
            createdAt: this.createdAt,
            lastActivityAt: this.lastActivityAt,
            settings: { ...this.settings },
            sessionStats: { ...this.sessionStats },
            gameState: this.gameState.getState(),
            players: Array.from(this.players.entries()).map(([id, player]) => ({
                id,
                data: player.toJSON(true) // Include history for serialization
            })),
            playerOrder: [...this.playerOrder]
        };
    }

    /**
     * Creates a GameSession instance from serialized data
     * @param {Object} data - Serialized session data
     * @returns {GameSession} GameSession instance
     */
    static fromJSON(data) {
        const session = new GameSession(data.sessionId, data.mode, {
            roomCode: data.roomCode,
            ...data.settings
        });

        // Restore session state
        session.maxPlayers = data.maxPlayers;
        session.isActive = data.isActive;
        session.createdAt = new Date(data.createdAt);
        session.lastActivityAt = new Date(data.lastActivityAt);
        session.sessionStats = { ...data.sessionStats };
        session.playerOrder = [...data.playerOrder];

        // Restore players
        if (data.players) {
            data.players.forEach(({ id, data: playerData }) => {
                const player = Player.fromJSON(playerData);
                session.players.set(id, player);
            });
        }

        // Restore game state (this is more complex and might need additional work)
        // For now, we'll create a new game state and sync the basic properties
        session.gameState = new GameState(data.sessionId, data.mode, data.settings);
        if (data.gameState) {
            session.gameState.state = { ...session.gameState.state, ...data.gameState };
        }

        return session;
    }

    /**
     * Validates session data
     * @returns {boolean} True if session data is valid
     */
    isValid() {
        return (
            typeof this.sessionId === 'string' &&
            this.sessionId.length > 0 &&
            Object.values(GAME_MODES).includes(this.mode) &&
            typeof this.roomCode === 'string' &&
            this.roomCode.length > 0 &&
            typeof this.maxPlayers === 'number' &&
            this.maxPlayers > 0 &&
            this.createdAt instanceof Date &&
            this.lastActivityAt instanceof Date &&
            this.gameState && this.gameState.isValidState()
        );
    }
}

module.exports = GameSession;