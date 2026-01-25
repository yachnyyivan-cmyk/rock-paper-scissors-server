/**
 * @fileoverview Easy AI Strategy - Random move selection
 * Implements random move selection with basic timing simulation
 */

const { MOVES } = require('../gameUtils');

/**
 * Easy AI Strategy Class
 * Makes completely random moves with no pattern recognition
 */
class EasyAIStrategy {
    constructor() {
        this.name = 'Easy';
        this.description = 'Random move selection with no strategy';
        this.thinkingTimeMin = 500;  // Minimum thinking time in ms
        this.thinkingTimeMax = 1500; // Maximum thinking time in ms
    }

    /**
     * Makes a random move
     * @param {string[]} moveHistory - Player's move history (unused in easy mode)
     * @param {Object} patterns - Detected patterns (unused in easy mode)
     * @returns {string} Random move
     */
    makeMove(moveHistory, patterns) {
        // Easy AI ignores all history and patterns
        return this._getRandomMove();
    }

    /**
     * Analyzes player move (no-op for easy AI)
     * @param {string} move - Player's move
     * @param {string[]} moveHistory - Complete move history
     */
    analyzeMove(move, moveHistory) {
        // Easy AI doesn't analyze moves
    }

    /**
     * Updates strategy based on result (no-op for easy AI)
     * @param {string} aiMove - AI's move
     * @param {string} playerMove - Player's move
     * @param {string} result - Game result
     * @param {Object} patterns - Current patterns
     */
    updateStrategy(aiMove, playerMove, result, patterns) {
        // Easy AI doesn't adapt strategy
    }

    /**
     * Gets thinking time for realistic gameplay
     * @returns {number} Thinking time in milliseconds
     */
    getThinkingTime() {
        return Math.floor(
            Math.random() * (this.thinkingTimeMax - this.thinkingTimeMin) + this.thinkingTimeMin
        );
    }

    /**
     * Gets strategy statistics
     * @returns {Object} Strategy stats
     */
    getStats() {
        return {
            name: this.name,
            description: this.description,
            adaptationLevel: 0, // Easy AI never adapts
            movesAnalyzed: 0,   // Easy AI doesn't analyze
            expectedWinRate: 0.33 // Random play against optimal opponent
        };
    }

    /**
     * Resets strategy state (no-op for easy AI)
     */
    reset() {
        // Easy AI has no state to reset
    }

    /**
     * Gets a random move from available moves
     * @returns {string} Random move
     * @private
     */
    _getRandomMove() {
        const moves = Object.values(MOVES);
        return moves[Math.floor(Math.random() * moves.length)];
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EasyAIStrategy;
}