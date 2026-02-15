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
     * Makes a move based on intelligent pattern analysis
     * Uses psychological analysis and strategic thinking
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
        // but reduce randomness as we learn more about the player
        const adaptiveRandomRate = Math.max(
            this.randomFallbackRate * (1 - this.successfulPredictions / Math.max(this.movesAnalyzed, 1)),
            0.1
        );
        
        if (Math.random() < adaptiveRandomRate) {
            return this._getRandomMove();
        }

        // Collect predictions from different strategies
        const predictions = [];

        // Pattern-based prediction
        const patternPrediction = this._predictFromPatterns(moveHistory, patterns);
        if (patternPrediction) {
            predictions.push({ move: patternPrediction, confidence: 0.4, source: 'pattern' });
        }

        // Frequency analysis prediction
        const frequencyPrediction = this._predictFromFrequency(patterns, moveHistory);
        if (frequencyPrediction) {
            predictions.push({ move: frequencyPrediction, confidence: 0.35, source: 'frequency' });
        }

        // Psychology-based prediction (what do they do after winning/losing)
        const psychPrediction = this._predictFromPsychology(moveHistory);
        if (psychPrediction) {
            predictions.push({ move: psychPrediction, confidence: 0.25, source: 'psychology' });
        }

        // If we have multiple predictions, use weighted voting
        if (predictions.length > 0) {
            const votedMove = this._weightedVote(predictions);
            return this._getCounterMove(votedMove);
        }

        // Final fallback to random
        return this._getRandomMove();
    }

    /**
     * Predicts based on player psychology (tendency after streaks)
     * @param {string[]} moveHistory - Move history
     * @returns {string|null} Predicted move or null
     * @private
     */
    _predictFromPsychology(moveHistory) {
        if (moveHistory.length < 5) return null;
        
        // Check if player tends to repeat after using same move twice
        const last3 = moveHistory.slice(-3);
        if (last3[0] === last3[1] && last3[1] !== last3[2]) {
            // Player broke a repetition, might go back to it
            return last3[0];
        }
        
        // Check for "frustrated" behavior - cycling through all moves
        if (moveHistory.length >= 3) {
            const last3Unique = new Set(moveHistory.slice(-3));
            if (last3Unique.size === 3) {
                // Player used all three moves, might repeat the oldest one
                return moveHistory[moveHistory.length - 3];
            }
        }
        
        return null;
    }

    /**
     * Performs weighted voting among predictions
     * @param {Array} predictions - Array of {move, confidence, source}
     * @returns {string} Most likely move
     * @private
     */
    _weightedVote(predictions) {
        const votes = new Map();
        
        for (const pred of predictions) {
            const current = votes.get(pred.move) || 0;
            votes.set(pred.move, current + pred.confidence);
        }
        
        let maxVotes = 0;
        let winningMove = null;
        
        for (const [move, voteCount] of votes) {
            if (voteCount > maxVotes) {
                maxVotes = voteCount;
                winningMove = move;
            }
        }
        
        return winningMove || this._getRandomMove();
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
     * Predicts next move based on intelligent frequency analysis
     * Considers recent trends, psychology, and strategic variation
     * @param {Object} patterns - Pattern data from AIEngine
     * @param {string[]} moveHistory - Player's move history
     * @returns {string|null} Predicted move or null if no confident prediction
     * @private
     */
    _predictFromFrequency(patterns, moveHistory) {
        if (!patterns.frequencies || patterns.frequencies.size === 0) {
            return null;
        }

        // Analyze multiple time windows for trend detection
        const windows = [
            { size: 3, weight: 0.5 },  // Very recent (highest weight)
            { size: 7, weight: 0.3 },  // Recent trend
            { size: 15, weight: 0.2 }  // Overall pattern
        ];

        const moveScores = new Map();
        for (const move of Object.values(MOVES)) {
            moveScores.set(move, 0);
        }

        // Analyze each time window
        for (const window of windows) {
            const windowSize = Math.min(window.size, moveHistory.length);
            if (windowSize === 0) continue;
            
            const windowMoves = moveHistory.slice(-windowSize);
            const windowFreq = new Map();
            
            for (const move of windowMoves) {
                windowFreq.set(move, (windowFreq.get(move) || 0) + 1);
            }
            
            // Add weighted scores for this window
            for (const move of Object.values(MOVES)) {
                const freq = (windowFreq.get(move) || 0) / windowSize;
                const currentScore = moveScores.get(move);
                moveScores.set(move, currentScore + (freq * window.weight));
            }
        }

        // Detect if player is avoiding a move (anti-pattern)
        const avoidedMove = this._detectAvoidedMove(moveHistory);
        if (avoidedMove) {
            // Don't predict the avoided move
            moveScores.set(avoidedMove, moveScores.get(avoidedMove) * 0.3);
        }

        // Detect if player is alternating or cycling
        const cyclicPrediction = this._detectCyclicBehavior(moveHistory);
        if (cyclicPrediction) {
            // Boost the cyclic prediction
            const currentScore = moveScores.get(cyclicPrediction);
            moveScores.set(cyclicPrediction, currentScore * 1.5);
        }

        // Find highest scoring move
        let maxScore = 0;
        let predictedMove = null;

        for (const [move, score] of moveScores) {
            if (score > maxScore) {
                maxScore = score;
                predictedMove = move;
            }
        }

        // Use adaptive threshold based on confidence
        const threshold = 0.28;
        if (maxScore > threshold) {
            return predictedMove;
        }

        return null;
    }

    /**
     * Detects if player is avoiding a specific move
     * @param {string[]} moveHistory - Move history
     * @returns {string|null} Avoided move or null
     * @private
     */
    _detectAvoidedMove(moveHistory) {
        if (moveHistory.length < 8) return null;
        
        const recentMoves = moveHistory.slice(-8);
        const freq = new Map();
        
        for (const move of recentMoves) {
            freq.set(move, (freq.get(move) || 0) + 1);
        }
        
        // If a move appears 0-1 times in last 8 moves, player might be avoiding it
        for (const move of Object.values(MOVES)) {
            const count = freq.get(move) || 0;
            if (count <= 1) {
                return move;
            }
        }
        
        return null;
    }

    /**
     * Detects cyclic or alternating behavior
     * @param {string[]} moveHistory - Move history
     * @returns {string|null} Predicted next move in cycle or null
     * @private
     */
    _detectCyclicBehavior(moveHistory) {
        if (moveHistory.length < 4) return null;
        
        // Check for simple alternation (A-B-A-B pattern)
        const last4 = moveHistory.slice(-4);
        if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1]) {
            return last4[0]; // Predict continuation of alternation
        }
        
        // Check for 3-move cycle (A-B-C-A-B-C pattern)
        if (moveHistory.length >= 6) {
            const last6 = moveHistory.slice(-6);
            const firstHalf = last6.slice(0, 3).join('');
            const secondHalf = last6.slice(3, 6).join('');
            
            if (firstHalf === secondHalf) {
                // Cycle detected, predict next in sequence
                return last6[0];
            }
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