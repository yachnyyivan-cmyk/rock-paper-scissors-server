/**
 * @fileoverview AI Engine for Rock Paper Scissors game
 * Implements strategy pattern for different difficulty levels
 */

const { MOVES, AI_DIFFICULTIES, isValidMove } = require('./gameUtils');
const EasyAIStrategy = require('./strategies/EasyAIStrategy');
const MediumAIStrategy = require('./strategies/MediumAIStrategy');
const HardAIStrategy = require('./strategies/HardAIStrategy');

/**
 * Base AI Engine class that manages AI strategies and move history
 */
class AIEngine {
    /**
     * @param {string} difficulty - AI difficulty level
     * @param {string} playerId - ID of the human player being analyzed
     */
    constructor(difficulty = AI_DIFFICULTIES.EASY, playerId = 'human') {
        if (!Object.values(AI_DIFFICULTIES).includes(difficulty)) {
            throw new Error(`Invalid AI difficulty: ${difficulty}`);
        }
        
        this.difficulty = difficulty;
        this.playerId = playerId;
        this.moveHistory = [];
        this.patterns = {
            sequences: new Map(),
            frequencies: new Map(),
            lastMoves: []
        };
        this.adaptationLevel = 0;
        this.strategy = this._createStrategy(difficulty);
    }

    /**
     * Creates appropriate strategy based on difficulty
     * @param {string} difficulty - AI difficulty level
     * @returns {Object} Strategy object
     * @private
     */
    _createStrategy(difficulty) {
        switch (difficulty) {
            case AI_DIFFICULTIES.EASY:
                return new EasyAIStrategy();
            case AI_DIFFICULTIES.MEDIUM:
                return new MediumAIStrategy();
            case AI_DIFFICULTIES.HARD:
                return new HardAIStrategy();
            default:
                return new EasyAIStrategy();
        }
    }

    /**
     * Records a player move and updates analysis
     * @param {string} move - Player's move
     */
    recordPlayerMove(move) {
        if (!isValidMove(move)) {
            throw new Error(`Invalid move: ${move}`);
        }
        
        this._updatePatterns(move);
        this.moveHistory.push(move);
        this.strategy.analyzeMove(move, this.moveHistory);
    }

    /**
     * Gets the AI's next move
     * @returns {string} AI's move choice
     */
    makeMove() {
        const move = this.strategy.makeMove(this.moveHistory, this.patterns);
        
        if (!isValidMove(move)) {
            // Fallback to random move if strategy returns invalid move
            return this._getRandomMove();
        }
        
        return move;
    }

    /**
     * Gets thinking time for realistic gameplay
     * @returns {number} Thinking time in milliseconds
     */
    getThinkingTime() {
        if (typeof this.strategy.getThinkingTime === 'function') {
            return this.strategy.getThinkingTime();
        }
        return 1000; // Default 1 second
    }

    /**
     * Gets strategy statistics
     * @returns {Object} Strategy stats
     */
    getStrategyStats() {
        if (typeof this.strategy.getStats === 'function') {
            return this.strategy.getStats();
        }
        return {
            name: 'Unknown',
            description: 'No description available',
            adaptationLevel: this.adaptationLevel,
            movesAnalyzed: this.moveHistory.length,
            expectedWinRate: 0.33
        };
    }

    /**
     * Updates AI strategy based on game result
     * @param {string} aiMove - AI's move
     * @param {string} playerMove - Player's move
     * @param {string} result - Game result ('win', 'lose', 'tie')
     */
    updateStrategy(aiMove, playerMove, result) {
        this.strategy.updateStrategy(aiMove, playerMove, result, this.patterns);
        this._updateAdaptationLevel(result);
    }

    /**
     * Gets current move history for analysis
     * @returns {string[]} Array of player moves
     */
    getPlayerHistory() {
        return [...this.moveHistory];
    }

    /**
     * Gets detected patterns
     * @returns {Object} Patterns object
     */
    getPatterns() {
        return {
            sequences: new Map(this.patterns.sequences),
            frequencies: new Map(this.patterns.frequencies),
            lastMoves: [...this.patterns.lastMoves]
        };
    }

    /**
     * Gets current adaptation level
     * @returns {number} Adaptation level (0-1)
     */
    getAdaptationLevel() {
        return this.adaptationLevel;
    }

    /**
     * Resets AI state for new game
     */
    reset() {
        this.moveHistory = [];
        this.patterns = {
            sequences: new Map(),
            frequencies: new Map(),
            lastMoves: []
        };
        this.adaptationLevel = 0;
    }

    /**
     * Updates move patterns based on new move
     * @param {string} move - New move to analyze
     * @private
     */
    _updatePatterns(move) {
        // Update frequency analysis
        const currentFreq = this.patterns.frequencies.get(move) || 0;
        this.patterns.frequencies.set(move, currentFreq + 1);

        // Update last moves (keep last 5 for pattern analysis)
        this.patterns.lastMoves.push(move);
        if (this.patterns.lastMoves.length > 5) {
            this.patterns.lastMoves.shift();
        }

        // Update sequence patterns (2-move and 3-move sequences)
        if (this.moveHistory.length >= 1) {
            const twoMoveSeq = this.moveHistory[this.moveHistory.length - 1] + move;
            const seqCount = this.patterns.sequences.get(twoMoveSeq) || 0;
            this.patterns.sequences.set(twoMoveSeq, seqCount + 1);
        }

        if (this.moveHistory.length >= 2) {
            const threeMoveSeq = this.moveHistory.slice(-2).join('') + move;
            const seqCount = this.patterns.sequences.get(threeMoveSeq) || 0;
            this.patterns.sequences.set(threeMoveSeq, seqCount + 1);
        }
    }

    /**
     * Updates adaptation level based on game results
     * @param {string} result - Game result
     * @private
     */
    _updateAdaptationLevel(result) {
        const increment = result === 'win' ? 0.02 : (result === 'lose' ? -0.01 : 0);
        this.adaptationLevel = Math.max(0, Math.min(1, this.adaptationLevel + increment));
    }

    /**
     * Gets a random move
     * @returns {string} Random move
     * @private
     */
    _getRandomMove() {
        const moves = Object.values(MOVES);
        return moves[Math.floor(Math.random() * moves.length)];
    }

    /**
     * Gets move that beats the given move
     * @param {string} move - Move to counter
     * @returns {string} Counter move
     * @private
     */
    _getCounterMove(move) {
        const counters = {
            [MOVES.ROCK]: MOVES.PAPER,
            [MOVES.PAPER]: MOVES.SCISSORS,
            [MOVES.SCISSORS]: MOVES.ROCK
        };
        return counters[move] || this._getRandomMove();
    }

    /**
     * Analyzes move frequencies to find most common move
     * @returns {string|null} Most frequent move or null if no history
     * @private
     */
    _getMostFrequentMove() {
        if (this.patterns.frequencies.size === 0) {
            return null;
        }

        let maxCount = 0;
        let mostFrequent = null;

        for (const [move, count] of this.patterns.frequencies) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = move;
            }
        }

        return mostFrequent;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEngine;
}