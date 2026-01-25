/**
 * @fileoverview Player class for managing individual player state and move tracking
 */

const { MOVES, isValidMove } = require('./gameUtils');

/**
 * Player class manages individual player state, move history, and statistics
 */
class Player {
    /**
     * Creates a new Player instance
     * @param {string} id - Unique player identifier
     * @param {string} name - Player display name
     * @param {Object} options - Additional options
     */
    constructor(id, name = 'Player', options = {}) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.currentMove = null;
        this.isReady = false;
        this.isConnected = true;
        this.moveHistory = [];
        this.statistics = {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            totalTies: 0,
            moveFrequency: {
                [MOVES.ROCK]: 0,
                [MOVES.PAPER]: 0,
                [MOVES.SCISSORS]: 0
            },
            winStreak: 0,
            currentStreak: 0,
            longestWinStreak: 0
        };
        this.createdAt = new Date();
        this.lastActiveAt = new Date();
        
        // Optional settings
        this.isAI = options.isAI || false;
        this.aiDifficulty = options.aiDifficulty || null;
    }

    /**
     * Sets the player's current move
     * @param {string} move - The move to set
     * @returns {boolean} True if move was set successfully
     */
    setMove(move) {
        if (!isValidMove(move)) {
            return false;
        }

        if (this.currentMove !== null) {
            return false; // Already made a move this round
        }

        this.currentMove = move;
        this.isReady = true;
        this.lastActiveAt = new Date();
        
        // Add to move history
        this.moveHistory.push({
            move,
            timestamp: new Date(),
            round: this.moveHistory.length + 1
        });

        // Update move frequency statistics
        this.statistics.moveFrequency[move]++;

        return true;
    }

    /**
     * Clears the current move (for new round)
     */
    clearMove() {
        this.currentMove = null;
        this.isReady = false;
    }

    /**
     * Updates player statistics after a round
     * @param {string} result - 'win', 'loss', or 'tie'
     */
    updateStatistics(result) {
        this.statistics.totalGames++;
        
        switch (result) {
            case 'win':
                this.statistics.totalWins++;
                this.statistics.currentStreak++;
                this.statistics.winStreak++;
                if (this.statistics.currentStreak > this.statistics.longestWinStreak) {
                    this.statistics.longestWinStreak = this.statistics.currentStreak;
                }
                break;
            case 'loss':
                this.statistics.totalLosses++;
                this.statistics.currentStreak = 0;
                break;
            case 'tie':
                this.statistics.totalTies++;
                // Ties don't break win streaks
                break;
        }
    }

    /**
     * Increments the player's score
     */
    incrementScore() {
        this.score++;
        this.updateStatistics('win');
    }

    /**
     * Records a loss for statistics
     */
    recordLoss() {
        this.updateStatistics('loss');
    }

    /**
     * Records a tie for statistics
     */
    recordTie() {
        this.updateStatistics('tie');
    }

    /**
     * Resets the player's game state (score and current move)
     */
    resetGameState() {
        this.score = 0;
        this.currentMove = null;
        this.isReady = false;
        this.statistics.winStreak = 0;
        this.statistics.currentStreak = 0;
    }

    /**
     * Gets the player's move history for the last N moves
     * @param {number} count - Number of recent moves to return
     * @returns {Array} Array of recent moves
     */
    getRecentMoves(count = 5) {
        return this.moveHistory.slice(-count);
    }

    /**
     * Gets the player's move pattern analysis
     * @returns {Object} Pattern analysis data
     */
    getMovePatterns() {
        const totalMoves = this.moveHistory.length;
        if (totalMoves === 0) {
            return {
                totalMoves: 0,
                frequencies: { ...this.statistics.moveFrequency },
                percentages: { rock: 0, paper: 0, scissors: 0 },
                mostFrequentMove: null,
                leastFrequentMove: null
            };
        }

        // Calculate percentages
        const percentages = {
            rock: (this.statistics.moveFrequency[MOVES.ROCK] / totalMoves * 100).toFixed(1),
            paper: (this.statistics.moveFrequency[MOVES.PAPER] / totalMoves * 100).toFixed(1),
            scissors: (this.statistics.moveFrequency[MOVES.SCISSORS] / totalMoves * 100).toFixed(1)
        };

        // Find most and least frequent moves
        const frequencies = this.statistics.moveFrequency;
        const moves = Object.keys(frequencies);
        const mostFrequentMove = moves.reduce((a, b) => frequencies[a] > frequencies[b] ? a : b);
        const leastFrequentMove = moves.reduce((a, b) => frequencies[a] < frequencies[b] ? a : b);

        return {
            totalMoves,
            frequencies: { ...frequencies },
            percentages,
            mostFrequentMove,
            leastFrequentMove,
            recentMoves: this.getRecentMoves(5)
        };
    }

    /**
     * Gets comprehensive player statistics
     * @returns {Object} Player statistics
     */
    getStatistics() {
        const totalGames = this.statistics.totalGames;
        const winRate = totalGames > 0 ? (this.statistics.totalWins / totalGames * 100).toFixed(1) : 0;
        
        return {
            ...this.statistics,
            winRate: parseFloat(winRate),
            currentScore: this.score,
            totalMoves: this.moveHistory.length,
            averageMovesPerGame: totalGames > 0 ? (this.moveHistory.length / totalGames).toFixed(1) : 0,
            isActive: this.isConnected && this.isReady,
            lastActive: this.lastActiveAt,
            accountAge: Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)) // days
        };
    }

    /**
     * Sets the player's connection status
     * @param {boolean} connected - Connection status
     */
    setConnectionStatus(connected) {
        this.isConnected = connected;
        if (connected) {
            this.lastActiveAt = new Date();
        }
    }

    /**
     * Checks if the player is currently active
     * @param {number} timeoutMs - Timeout in milliseconds to consider inactive
     * @returns {boolean} True if player is active
     */
    isActive(timeoutMs = 30000) { // 30 seconds default
        const now = new Date();
        const timeSinceLastActive = now - this.lastActiveAt;
        return this.isConnected && timeSinceLastActive < timeoutMs;
    }

    /**
     * Serializes the player to a plain object
     * @param {boolean} includeHistory - Whether to include move history
     * @returns {Object} Serialized player data
     */
    toJSON(includeHistory = false) {
        const data = {
            id: this.id,
            name: this.name,
            score: this.score,
            currentMove: this.currentMove,
            isReady: this.isReady,
            isConnected: this.isConnected,
            isAI: this.isAI,
            aiDifficulty: this.aiDifficulty,
            statistics: { ...this.statistics },
            createdAt: this.createdAt,
            lastActiveAt: this.lastActiveAt
        };

        if (includeHistory) {
            data.moveHistory = [...this.moveHistory];
        }

        return data;
    }

    /**
     * Creates a Player instance from serialized data
     * @param {Object} data - Serialized player data
     * @returns {Player} Player instance
     */
    static fromJSON(data) {
        const player = new Player(data.id, data.name, {
            isAI: data.isAI,
            aiDifficulty: data.aiDifficulty
        });

        // Restore state
        player.score = data.score || 0;
        player.currentMove = data.currentMove || null;
        player.isReady = data.isReady || false;
        player.isConnected = data.isConnected !== undefined ? data.isConnected : true;
        player.statistics = { ...player.statistics, ...data.statistics };
        player.createdAt = new Date(data.createdAt);
        player.lastActiveAt = new Date(data.lastActiveAt);
        
        if (data.moveHistory) {
            player.moveHistory = data.moveHistory.map(entry => ({
                ...entry,
                timestamp: new Date(entry.timestamp)
            }));
        }

        return player;
    }

    /**
     * Validates player data
     * @returns {boolean} True if player data is valid
     */
    isValid() {
        return (
            typeof this.id === 'string' &&
            this.id.length > 0 &&
            typeof this.name === 'string' &&
            this.name.length > 0 &&
            typeof this.score === 'number' &&
            this.score >= 0 &&
            (this.currentMove === null || isValidMove(this.currentMove)) &&
            typeof this.isReady === 'boolean' &&
            typeof this.isConnected === 'boolean' &&
            Array.isArray(this.moveHistory) &&
            this.createdAt instanceof Date &&
            this.lastActiveAt instanceof Date
        );
    }
}

module.exports = Player;