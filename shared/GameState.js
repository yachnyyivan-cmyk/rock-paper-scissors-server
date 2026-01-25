/**
 * @fileoverview GameState class for managing game state, moves, and scoring
 */

const { 
    MOVES, 
    GAME_MODES, 
    GAME_STATUS, 
    isValidMove, 
    determineWinner, 
    createPlayer, 
    createGameState 
} = require('./gameUtils');

/**
 * GameState class manages the core game logic, state, and flow
 */
class GameState {
    /**
     * Creates a new GameState instance
     * @param {string} gameId - Unique game identifier
     * @param {string} mode - Game mode ('pvp' or 'pvai')
     * @param {Object} options - Additional options
     */
    constructor(gameId, mode, options = {}) {
        this.state = createGameState(gameId, mode, options);
        this.moveTimeout = options.moveTimeout || 15000; // 15 seconds default
        this.moveTimers = new Map(); // Track move timeouts
    }

    /**
     * Adds a player to the game
     * @param {string} playerId - Player ID
     * @param {string} playerName - Player name
     * @returns {boolean} True if player was added successfully
     */
    addPlayer(playerId, playerName = 'Player') {
        if (this.state.players.length >= 2) {
            return false; // Game is full
        }

        if (this.state.players.find(p => p.id === playerId)) {
            return false; // Player already exists
        }

        const player = createPlayer(playerId, playerName);
        this.state.players.push(player);

        // Start game if we have 2 players
        if (this.state.players.length === 2) {
            this.state.status = GAME_STATUS.PLAYING;
            this.startNewRound();
        }

        return true;
    }

    /**
     * Removes a player from the game
     * @param {string} playerId - Player ID to remove
     * @returns {boolean} True if player was removed
     */
    removePlayer(playerId) {
        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return false;
        }

        this.state.players.splice(playerIndex, 1);
        
        // End game if not enough players
        if (this.state.players.length < 2 && this.state.mode === GAME_MODES.PVP) {
            this.state.status = GAME_STATUS.FINISHED;
        }

        return true;
    }

    /**
     * Validates and processes a player's move
     * @param {string} playerId - Player making the move
     * @param {string} move - The move ('rock', 'paper', or 'scissors')
     * @returns {Object} Result object with success status and message
     */
    makeMove(playerId, move) {
        // Validate game state
        if (this.state.status !== GAME_STATUS.PLAYING) {
            return { success: false, message: 'Game is not in playing state' };
        }

        // Validate move
        if (!isValidMove(move)) {
            return { success: false, message: 'Invalid move provided' };
        }

        // Find player
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, message: 'Player not found in game' };
        }

        // Check if player already made a move this round
        if (player.currentMove !== null) {
            return { success: false, message: 'Player has already made a move this round' };
        }

        // Set player's move
        player.currentMove = move;
        player.isReady = true;

        // Clear timeout for this player
        if (this.moveTimers.has(playerId)) {
            clearTimeout(this.moveTimers.get(playerId));
            this.moveTimers.delete(playerId);
        }

        // Check if all players have made moves
        const allPlayersReady = this.state.players.every(p => p.isReady);
        if (allPlayersReady) {
            this.processRound();
        }

        return { success: true, message: 'Move registered successfully' };
    }

    /**
     * Processes the current round and determines winner
     * @returns {Object} Round result
     */
    processRound() {
        if (this.state.players.length !== 2) {
            throw new Error('Cannot process round without exactly 2 players');
        }

        const [player1, player2] = this.state.players;
        
        if (!player1.currentMove || !player2.currentMove) {
            throw new Error('Cannot process round - not all players have made moves');
        }

        // Determine round winner
        const result = determineWinner(player1.currentMove, player2.currentMove);
        
        // Update scores
        if (result.winner === 'player1') {
            player1.score++;
        } else if (result.winner === 'player2') {
            player2.score++;
        }

        // Increment round counter
        this.state.currentRound++;

        // Create round result
        const roundResult = {
            round: this.state.currentRound,
            player1Move: player1.currentMove,
            player2Move: player2.currentMove,
            winner: result.winner,
            reason: result.reason,
            scores: {
                [player1.id]: player1.score,
                [player2.id]: player2.score
            }
        };

        // Check for game winner
        const gameWinner = this.checkGameWinner();
        if (gameWinner) {
            this.state.winner = gameWinner.id;
            this.state.status = GAME_STATUS.FINISHED;
            this.state.finishedAt = new Date();
            
            // Clear any remaining timers
            this.clearAllTimers();
        } else {
            // Prepare for next round
            this.startNewRound();
        }

        return roundResult;
    }

    /**
     * Checks if there's a game winner based on scoring rules
     * @returns {Object|null} Winner player object or null
     */
    checkGameWinner() {
        const winningScore = this.state.maxRounds;
        return this.state.players.find(player => player.score >= winningScore) || null;
    }

    /**
     * Starts a new round by resetting player moves and readiness
     */
    startNewRound() {
        if (this.state.status !== GAME_STATUS.PLAYING) {
            return;
        }

        // Clear any existing timers first
        this.clearAllTimers();

        // Reset player moves and readiness
        this.state.players.forEach(player => {
            player.currentMove = null;
            player.isReady = false;
        });

        // Set move timeouts for each player
        this.setMoveTimeouts();
    }

    /**
     * Sets move timeouts for all players
     */
    setMoveTimeouts() {
        this.state.players.forEach(player => {
            // Only set timeout for players who haven't made a move yet
            if (!player.isReady) {
                const timeoutId = setTimeout(() => {
                    // Auto-select rock if player doesn't make a move in time
                    if (!player.isReady && this.state.status === GAME_STATUS.PLAYING) {
                        this.makeMove(player.id, MOVES.ROCK);
                    }
                }, this.moveTimeout);
                
                this.moveTimers.set(player.id, timeoutId);
            }
        });
    }

    /**
     * Clears all move timers
     */
    clearAllTimers() {
        this.moveTimers.forEach(timerId => clearTimeout(timerId));
        this.moveTimers.clear();
    }

    /**
     * Resets the game to initial state
     */
    resetGame() {
        this.clearAllTimers();
        
        // Reset scores and moves
        this.state.players.forEach(player => {
            player.score = 0;
            player.currentMove = null;
            player.isReady = false;
        });

        // Reset game state
        this.state.currentRound = 0;
        this.state.winner = null;
        this.state.finishedAt = null;
        this.state.status = this.state.players.length === 2 ? GAME_STATUS.PLAYING : GAME_STATUS.WAITING;

        if (this.state.status === GAME_STATUS.PLAYING) {
            this.startNewRound();
        }
    }

    /**
     * Gets the current game state
     * @returns {Object} Current game state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Gets game statistics
     * @returns {Object} Game statistics
     */
    getStats() {
        const totalRounds = this.state.currentRound;
        const stats = {
            totalRounds,
            gameStatus: this.state.status,
            winner: this.state.winner,
            players: this.state.players.map(player => ({
                id: player.id,
                name: player.name,
                score: player.score,
                winRate: totalRounds > 0 ? (player.score / totalRounds * 100).toFixed(1) : 0
            }))
        };

        if (this.state.finishedAt && this.state.createdAt) {
            const duration = this.state.finishedAt.getTime() - this.state.createdAt.getTime();
            stats.gameDuration = Math.round(duration / 1000); // seconds
        }

        return stats;
    }

    /**
     * Validates the current game state
     * @returns {boolean} True if state is valid
     */
    isValidState() {
        return (
            this.state &&
            typeof this.state.gameId === 'string' &&
            Object.values(GAME_MODES).includes(this.state.mode) &&
            Array.isArray(this.state.players) &&
            this.state.players.length <= 2 &&
            typeof this.state.currentRound === 'number' &&
            this.state.currentRound >= 0 &&
            typeof this.state.maxRounds === 'number' &&
            this.state.maxRounds > 0 &&
            Object.values(GAME_STATUS).includes(this.state.status)
        );
    }
}

module.exports = GameState;