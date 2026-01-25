/**
 * @fileoverview Medium AI Strategy - Pattern recognition and frequency analysis
 * Implements basic pattern recognition to counter player tendencies
 */

const { MOVES } = require('../gameUtils');

/**
 * Medium AI Strategy Class
 * Uses frequency analysis and pattern recognition to predict player moves
 */
class MediumAIStrategy {
    constructor() {
        this.name = 'Medium';
        this.description = 'Pattern recognition with frequency analysis';
        this.thinkingTimeMin = 800;  // Slightly longer thinking time
        this.thinkingTimeMax = 2000;
        
        // Strategy parameters
        this.minHistoryForPattern = 2; // Minimum moves needed for pattern analysis
        this.recentMovesWeight = 0.7;  // Weight for recent moves vs overall frequency
        this.patternConfidenceThreshold = 0.6; // Confidence needed to use pattern prediction
        this.randomFallbackRate = 0.2; // Chance to make random move to avoid predictability
        
        // Internal state
        this.movesAnalyzed = 0;
        this.successfulPredictions = 0;
        this.patternMatches = new Map();
    }

    /**
     * Makes a move based on pattern analysis and frequency data
     * @param {string[]} moveHistory - Player's move history
     * @param {Object} patterns - Detected patterns from AIEngine
     * @returns {string} AI's move choice
     */
    makeMove(moveHistory, patterns) {
        // Not enough history for pattern analysis
        if (moveHistory.length < this.minHistoryForPattern) {
            return this._getRandomMove();
        }

        // Occasionally make random moves to avoid being too predictable
        if (Math.random() < this.randomFallbackRate) {
            return this._getRandomMove();
        }

        // Try pattern-based prediction first
        const patternPrediction = this._predictFromPatterns(moveHistory, patterns);
        if (patternPrediction) {
            return this._getCounterMove(patternPrediction);
        }

        // Fall back to frequency analysis
        const frequencyPrediction = this._predictFromFrequency(patterns, moveHistory);
        if (frequencyPrediction) {
            return this._getCounterMove(frequencyPrediction);
        }

        // Final fallback to random
        return this._getRandomMove();
    }

    /**
     * Analyzes player move for pattern learning
     * @param {string} move - Player's move
     * @param {string[]} moveHistory - Complete move history
     */
    analyzeMove(move, moveHistory) {
        this.movesAnalyzed++;
        
        // Update pattern tracking for 2-move sequences (last move + current move)
        if (moveHistory.length >= 1) {
            const lastMove = moveHistory[moveHistory.length - 1];
            const twoMovePattern = lastMove + move;
            
            const count = this.patternMatches.get(twoMovePattern) || 0;
            this.patternMatches.set(twoMovePattern, count + 1);
        }
    }

    /**
     * Updates strategy based on game result
     * @param {string} aiMove - AI's move
     * @param {string} playerMove - Player's move
     * @param {string} result - Game result ('win', 'lose', 'tie')
     * @param {Object} patterns - Current patterns
     */
    updateStrategy(aiMove, playerMove, result, patterns) {
        // Track prediction accuracy
        const expectedPlayerMove = this._getWinningMove(aiMove);
        if (playerMove === expectedPlayerMove && result === 'lose') {
            this.successfulPredictions++;
        }

        // Adjust strategy parameters based on performance
        if (this.movesAnalyzed > 5) { // Only adjust after some moves
            const accuracy = this.successfulPredictions / this.movesAnalyzed;
            
            if (accuracy > 0.6) {
                // We're doing well, be more aggressive with patterns
                this.patternConfidenceThreshold = Math.max(0.4, this.patternConfidenceThreshold - 0.05);
                this.randomFallbackRate = Math.max(0.1, this.randomFallbackRate - 0.02);
            } else if (accuracy < 0.3) {
                // We're not doing well, be more conservative
                this.patternConfidenceThreshold = Math.min(0.8, this.patternConfidenceThreshold + 0.05);
                this.randomFallbackRate = Math.min(0.3, this.randomFallbackRate + 0.02);
            }
        }
    }

    /**
     * Gets thinking time for realistic gameplay
     * @returns {number} Thinking time in milliseconds
     */
    getThinkingTime() {
        // Longer thinking time when analyzing patterns
        const baseTime = Math.floor(
            Math.random() * (this.thinkingTimeMax - this.thinkingTimeMin) + this.thinkingTimeMin
        );
        
        // Add extra time if we have complex patterns to analyze
        const patternComplexity = Math.min(this.patternMatches.size / 10, 0.5);
        return Math.floor(baseTime * (1 + patternComplexity));
    }

    /**
     * Gets strategy statistics
     * @returns {Object} Strategy stats
     */
    getStats() {
        const accuracy = this.movesAnalyzed > 0 ? this.successfulPredictions / this.movesAnalyzed : 0;
        
        return {
            name: this.name,
            description: this.description,
            adaptationLevel: Math.min(accuracy * 2, 1), // Scale accuracy to adaptation level
            movesAnalyzed: this.movesAnalyzed,
            successfulPredictions: this.successfulPredictions,
            predictionAccuracy: accuracy,
            patternsDetected: this.patternMatches.size,
            expectedWinRate: 0.5 + (accuracy * 0.2) // Base 50% + bonus for accuracy
        };
    }

    /**
     * Resets strategy state
     */
    reset() {
        this.movesAnalyzed = 0;
        this.successfulPredictions = 0;
        this.patternMatches.clear();
        
        // Reset parameters to defaults
        this.patternConfidenceThreshold = 0.6;
        this.randomFallbackRate = 0.2;
    }

    /**
     * Predicts next move based on sequence patterns from AIEngine
     * @param {string[]} moveHistory - Player's move history
     * @param {Object} patterns - Pattern data from AIEngine (contains sequences)
     * @returns {string|null} Predicted move or null if no confident prediction
     * @private
     */
    _predictFromPatterns(moveHistory, patterns) {
        if (moveHistory.length < 1) {
            return null;
        }

        // First, try AIEngine sequences (2-move patterns)
        if (patterns && patterns.sequences && patterns.sequences.size > 0) {
            const lastMove = moveHistory[moveHistory.length - 1];
            const possibleNextMoves = Object.values(MOVES);
            const predictions = new Map();

            // Check each possible next move using AIEngine sequences
            for (const move of possibleNextMoves) {
                const pattern = lastMove + move;
                const count = patterns.sequences.get(pattern) || 0;
                if (count > 0) {
                    predictions.set(move, count);
                }
            }

            if (predictions.size > 0) {
                // Find most likely move from sequences
                let maxCount = 0;
                let predictedMove = null;
                let totalCount = 0;

                for (const [move, count] of predictions) {
                    totalCount += count;
                    if (count > maxCount) {
                        maxCount = count;
                        predictedMove = move;
                    }
                }

                // Lower confidence threshold to make more predictions (45% vs 60%)
                const confidence = maxCount / totalCount;
                if (confidence >= 0.45) {
                    return predictedMove;
                }
            }
        }

        // Fall back to local pattern matches if AIEngine sequences didn't give strong prediction
        const lastMove = moveHistory[moveHistory.length - 1];
        const possibleNextMoves = Object.values(MOVES);
        const predictions = new Map();

        for (const move of possibleNextMoves) {
            const pattern = lastMove + move;
            const count = this.patternMatches.get(pattern) || 0;
            if (count > 0) {
                predictions.set(move, count);
            }
        }

        if (predictions.size === 0) {
            return null;
        }

        // Find most likely move
        let maxCount = 0;
        let predictedMove = null;
        let totalCount = 0;

        for (const [move, count] of predictions) {
            totalCount += count;
            if (count > maxCount) {
                maxCount = count;
                predictedMove = move;
            }
        }

        // Lower confidence threshold for better prediction rate
        const confidence = maxCount / totalCount;
        if (confidence >= 0.45) {
            return predictedMove;
        }

        return null;
    }

    /**
     * Predicts next move based on frequency analysis
     * @param {Object} patterns - Pattern data from AIEngine
     * @param {string[]} moveHistory - Player's move history
     * @returns {string|null} Predicted move or null if no confident prediction
     * @private
     */
    _predictFromFrequency(patterns, moveHistory) {
        if (!patterns.frequencies || patterns.frequencies.size === 0) {
            return null;
        }

        // Heavily weight recent moves (last 3-5 moves) to catch current tendencies
        const recentCount = Math.min(5, moveHistory.length);
        const recentMoves = moveHistory.slice(-recentCount);
        const recentFreq = new Map();
        
        // Count recent move frequencies
        for (const move of recentMoves) {
            const count = recentFreq.get(move) || 0;
            recentFreq.set(move, count + 1);
        }

        // Analyze player's tendency patterns
        const combinedScores = new Map();
        const totalMoves = moveHistory.length;

        for (const move of Object.values(MOVES)) {
            const overallFreq = (patterns.frequencies.get(move) || 0) / totalMoves;
            const recentFreqValue = (recentFreq.get(move) || 0) / recentCount;
            
            // Weight recent moves heavily (80%) vs overall (20%)
            const combinedScore = (overallFreq * 0.2) + (recentFreqValue * 0.8);
            
            combinedScores.set(move, combinedScore);
        }

        // Find most likely player move based on their patterns
        let maxScore = 0;
        let predictedMove = null;

        for (const [move, score] of combinedScores) {
            if (score > maxScore) {
                maxScore = score;
                predictedMove = move;
            }
        }

        // Lower threshold to be more aggressive with predictions (25% vs 40%)
        if (maxScore > 0.25) {
            return predictedMove;
        }

        return null;
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
     * Gets move that would beat the AI's move (for prediction accuracy tracking)
     * @param {string} aiMove - AI's move
     * @returns {string} Move that beats AI's move
     * @private
     */
    _getWinningMove(aiMove) {
        const winners = {
            [MOVES.ROCK]: MOVES.PAPER,
            [MOVES.PAPER]: MOVES.SCISSORS,
            [MOVES.SCISSORS]: MOVES.ROCK
        };
        return winners[aiMove] || MOVES.ROCK;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediumAIStrategy;
}