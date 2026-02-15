/**
 * @fileoverview Hard AI Strategy - Advanced algorithms with Markov chains and adaptive learning
 * Implements sophisticated pattern recognition, adaptive strategy, and meta-strategy switching
 */

const { MOVES } = require('../gameUtils');

/**
 * Hard AI Strategy Class
 * Uses Markov chain analysis, adaptive learning, and meta-strategy switching
 */
class HardAIStrategy {
    constructor() {
        this.name = 'Hard';
        this.description = 'Advanced AI with Markov chains and adaptive learning';
        this.thinkingTimeMin = 1000;  // Longer thinking time for complex analysis
        this.thinkingTimeMax = 2500;
        
        // Markov chain parameters
        this.markovOrder = 3; // Look at sequences of 3 moves
        this.markovChains = new Map(); // Stores transition probabilities
        this.sequenceHistory = []; // Stores move sequences for analysis
        
        // Adaptive strategy parameters
        this.adaptationRate = 0.1; // How quickly to adapt strategies
        this.explorationRate = 0.15; // Chance to explore new strategies
        this.confidenceThreshold = 0.5; // Minimum confidence for predictions (lowered from 0.65)
        
        // Meta-strategy system
        this.strategies = ['frequency', 'markov', 'pattern', 'counter', 'random'];
        this.strategyWeights = new Map([
            ['frequency', 0.2],
            ['markov', 0.3],
            ['pattern', 0.25],
            ['counter', 0.15],
            ['random', 0.1]
        ]);
        this.strategyPerformance = new Map();
        
        // Performance tracking
        this.movesAnalyzed = 0;
        this.successfulPredictions = 0;
        this.recentResults = []; // Track last 10 results for adaptation
        this.playerTendencies = new Map(); // Track player behavioral patterns
        
        // Advanced pattern detection
        this.cyclicPatterns = new Map(); // Detect repeating cycles
        this.antiPatterns = new Map(); // Track what player avoids
        this.contextualPatterns = new Map(); // Patterns based on game context
        
        this._initializeStrategies();
    }

    /**
     * Makes a move using advanced AI algorithms with intelligent analysis
     * @param {string[]} moveHistory - Player's move history
     * @param {Object} patterns - Detected patterns from AIEngine
     * @returns {string} AI's move choice
     */
    makeMove(moveHistory, patterns) {
        // Not enough history for advanced analysis
        if (moveHistory.length < 2) {
            return this._getRandomMove();
        }

        // Update Markov chains with latest data
        this._updateMarkovChains(moveHistory);
        
        // Adapt exploration rate dynamically
        const adaptiveExploration = this._calculateAdaptiveExploration();
        
        if (Math.random() < adaptiveExploration) {
            return this._exploreStrategy(moveHistory, patterns);
        }

        // Get predictions from all strategies with enhanced analysis
        const predictions = this._getAllPredictions(moveHistory, patterns);
        
        // Use ensemble method to combine predictions intelligently
        const ensemblePrediction = this._ensemblePrediction(predictions);
        
        if (ensemblePrediction && ensemblePrediction.confidence >= this.confidenceThreshold) {
            return this._getCounterMove(ensemblePrediction.move);
        }

        // Use strategic bluffing - sometimes counter the counter
        if (this._shouldBluff()) {
            const bluffMove = this._getBluffMove(predictions);
            if (bluffMove) return bluffMove;
        }

        // Fallback to weighted prediction
        return this._getWeightedPrediction(predictions);
    }

    /**
     * Calculates adaptive exploration rate based on performance
     * @returns {number} Exploration rate
     * @private
     */
    _calculateAdaptiveExploration() {
        if (this.recentResults.length < 5) {
            return this.explorationRate;
        }
        
        const recentWinRate = this._calculateRecentWinRate();
        
        // If winning rate is good (>60%), reduce exploration
        // If struggling (<40%), increase exploration
        if (recentWinRate > 0.6) {
            return Math.max(0.05, this.explorationRate * 0.8);
        } else if (recentWinRate < 0.4) {
            return Math.min(0.25, this.explorationRate * 1.3);
        }
        
        return this.explorationRate;
    }

    /**
     * Combines predictions using ensemble method with confidence weighting
     * @param {Array} predictions - Array of prediction objects
     * @returns {Object|null} Best ensemble prediction or null
     * @private
     */
    _ensemblePrediction(predictions) {
        if (predictions.length === 0) return null;
        
        // Aggregate votes with confidence weighting
        const votes = new Map();
        
        for (const pred of predictions) {
            const score = pred.confidence * pred.weight;
            const current = votes.get(pred.move) || { totalScore: 0, count: 0 };
            votes.set(pred.move, {
                totalScore: current.totalScore + score,
                count: current.count + 1
            });
        }
        
        // Find move with highest combined score and agreement
        let bestMove = null;
        let bestScore = 0;
        let totalScore = 0;
        
        for (const [move, data] of votes) {
            totalScore += data.totalScore;
            // Bonus for multiple strategies agreeing
            const agreementBonus = data.count > 1 ? 1.2 : 1.0;
            const finalScore = data.totalScore * agreementBonus;
            
            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestMove = move;
            }
        }
        
        // Calculate confidence based on how much better best move is
        const confidence = totalScore > 0 ? bestScore / totalScore : 0;
        
        return bestMove ? { move: bestMove, confidence } : null;
    }

    /**
     * Determines if AI should use bluffing strategy
     * @returns {boolean} True if should bluff
     * @private
     */
    _shouldBluff() {
        // Bluff occasionally when we have good prediction confidence
        if (this.successfulPredictions < 3) return false;
        
        const accuracy = this.successfulPredictions / Math.max(this.movesAnalyzed, 1);
        
        // If we're predicting too well, player might catch on - use bluffing
        return accuracy > 0.6 && Math.random() < 0.15;
    }

    /**
     * Gets a bluff move that counters what player expects
     * @param {Array} predictions - Current predictions
     * @returns {string|null} Bluff move or null
     * @private
     */
    _getBluffMove(predictions) {
        if (predictions.length === 0) return null;
        
        // Get our predicted counter move
        const topPrediction = this._selectBestPrediction(predictions);
        if (!topPrediction) return null;
        
        const ourCounter = this._getCounterMove(topPrediction.move);
        
        // If player expects our counter, they might counter it
        // So we counter their counter (meta-game)
        const theirExpectedCounter = this._getCounterMove(ourCounter);
        return this._getCounterMove(theirExpectedCounter);
    }

    /**
     * Analyzes player move for advanced pattern learning
     * @param {string} move - Player's move
     * @param {string[]} moveHistory - Complete move history
     */
    analyzeMove(move, moveHistory) {
        this.movesAnalyzed++;
        
        // Update sequence history for Markov analysis
        this.sequenceHistory.push(move);
        if (this.sequenceHistory.length > 50) { // Keep last 50 moves
            this.sequenceHistory.shift();
        }

        // Analyze behavioral patterns
        this._analyzeBehavioralPatterns(move, moveHistory);
        
        // Detect cyclic patterns
        this._detectCyclicPatterns(moveHistory);
        
        // Update contextual patterns based on game state
        this._updateContextualPatterns(move, moveHistory);
    }

    /**
     * Updates strategy based on game result with advanced adaptation
     * @param {string} aiMove - AI's move
     * @param {string} playerMove - Player's move
     * @param {string} result - Game result ('win', 'lose', 'tie')
     * @param {Object} patterns - Current patterns
     */
    updateStrategy(aiMove, playerMove, result, patterns) {
        // Track recent results for adaptation
        this.recentResults.push({ aiMove, playerMove, result, timestamp: Date.now() });
        if (this.recentResults.length > 10) {
            this.recentResults.shift();
        }

        // Update prediction accuracy
        const expectedMove = this._getWinningMove(aiMove);
        if (playerMove === expectedMove && result === 'lose') {
            this.successfulPredictions++;
        }

        // Update strategy performance based on result
        this._updateStrategyPerformance(result);
        
        // Adapt strategy weights based on performance
        this._adaptStrategyWeights();
        
        // Update player tendency analysis
        this._updatePlayerTendencies(playerMove, result);
        
        // Adjust exploration rate based on performance
        this._adjustExplorationRate();
    }

    /**
     * Gets thinking time with complexity-based adjustment
     * @returns {number} Thinking time in milliseconds
     */
    getThinkingTime() {
        const baseTime = Math.floor(
            Math.random() * (this.thinkingTimeMax - this.thinkingTimeMin) + this.thinkingTimeMin
        );
        
        // Add time based on analysis complexity
        const complexityFactor = Math.min(
            (this.markovChains.size / 20) + (this.cyclicPatterns.size / 10), 
            0.5
        );
        
        return Math.floor(baseTime * (1 + complexityFactor));
    }

    /**
     * Gets comprehensive strategy statistics
     * @returns {Object} Strategy stats
     */
    getStats() {
        const accuracy = this.movesAnalyzed > 0 ? this.successfulPredictions / this.movesAnalyzed : 0;
        const recentWinRate = this._calculateRecentWinRate();
        
        return {
            name: this.name,
            description: this.description,
            adaptationLevel: Math.min(accuracy * 1.5, 1),
            movesAnalyzed: this.movesAnalyzed,
            successfulPredictions: this.successfulPredictions,
            predictionAccuracy: accuracy,
            recentWinRate: recentWinRate,
            markovStates: this.markovChains.size,
            cyclicPatterns: this.cyclicPatterns.size,
            explorationRate: this.explorationRate,
            topStrategy: this._getTopStrategy(),
            expectedWinRate: 0.7 + (accuracy * 0.15) // Target 70-85% win rate
        };
    }

    /**
     * Resets strategy state
     */
    reset() {
        this.movesAnalyzed = 0;
        this.successfulPredictions = 0;
        this.recentResults = [];
        this.sequenceHistory = [];
        this.markovChains.clear();
        this.cyclicPatterns.clear();
        this.antiPatterns.clear();
        this.contextualPatterns.clear();
        this.playerTendencies.clear();
        
        // Reset strategy weights to defaults
        this._initializeStrategies();
        this.explorationRate = 0.15;
    }

    /**
     * Initializes strategy system
     * @private
     */
    _initializeStrategies() {
        this.strategyWeights.set('frequency', 0.2);
        this.strategyWeights.set('markov', 0.3);
        this.strategyWeights.set('pattern', 0.25);
        this.strategyWeights.set('counter', 0.15);
        this.strategyWeights.set('random', 0.1);
        
        // Initialize performance tracking
        for (const strategy of this.strategies) {
            this.strategyPerformance.set(strategy, { wins: 0, total: 0 });
        }
    }

    /**
     * Updates Markov chains with move sequences
     * @param {string[]} moveHistory - Player's move history
     * @private
     */
    _updateMarkovChains(moveHistory) {
        if (moveHistory.length < this.markovOrder + 1) {
            return;
        }

        // Create Markov chain entries for sequences
        for (let i = 0; i <= moveHistory.length - this.markovOrder - 1; i++) {
            const state = moveHistory.slice(i, i + this.markovOrder).join('');
            const nextMove = moveHistory[i + this.markovOrder];
            
            if (!this.markovChains.has(state)) {
                this.markovChains.set(state, new Map());
            }
            
            const transitions = this.markovChains.get(state);
            const count = transitions.get(nextMove) || 0;
            transitions.set(nextMove, count + 1);
        }
    }

    /**
     * Gets predictions from all available strategies
     * @param {string[]} moveHistory - Player's move history
     * @param {Object} patterns - Pattern data
     * @returns {Array} Array of prediction objects
     * @private
     */
    _getAllPredictions(moveHistory, patterns) {
        const predictions = [];
        
        // Markov chain prediction
        const markovPred = this._getMarkovPrediction(moveHistory);
        if (markovPred) {
            predictions.push({
                strategy: 'markov',
                move: markovPred.move,
                confidence: markovPred.confidence,
                weight: this.strategyWeights.get('markov')
            });
        }
        
        // Frequency analysis prediction
        const freqPred = this._getFrequencyPrediction(patterns);
        if (freqPred) {
            predictions.push({
                strategy: 'frequency',
                move: freqPred.move,
                confidence: freqPred.confidence,
                weight: this.strategyWeights.get('frequency')
            });
        }
        
        // Pattern-based prediction
        const patternPred = this._getPatternPrediction(moveHistory, patterns);
        if (patternPred) {
            predictions.push({
                strategy: 'pattern',
                move: patternPred.move,
                confidence: patternPred.confidence,
                weight: this.strategyWeights.get('pattern')
            });
        }
        
        // Counter-strategy prediction
        const counterPred = this._getCounterStrategyPrediction(moveHistory);
        if (counterPred) {
            predictions.push({
                strategy: 'counter',
                move: counterPred.move,
                confidence: counterPred.confidence,
                weight: this.strategyWeights.get('counter')
            });
        }
        
        return predictions;
    }

    /**
     * Gets Markov chain prediction with intelligent probability analysis
     * @param {string[]} moveHistory - Player's move history
     * @returns {Object|null} Prediction object or null
     * @private
     */
    _getMarkovPrediction(moveHistory) {
        if (moveHistory.length < this.markovOrder) {
            return null;
        }
        
        const currentState = moveHistory.slice(-this.markovOrder).join('');
        const transitions = this.markovChains.get(currentState);
        
        if (!transitions || transitions.size === 0) {
            // Try shorter sequence if exact match not found
            if (this.markovOrder > 2) {
                const shorterState = moveHistory.slice(-(this.markovOrder - 1)).join('');
                const shorterTransitions = this.markovChains.get(shorterState);
                if (shorterTransitions && shorterTransitions.size > 0) {
                    return this._analyzeTransitions(shorterTransitions, 0.85);
                }
            }
            return null;
        }
        
        return this._analyzeTransitions(transitions, 1.0);
    }

    /**
     * Analyzes transitions to find best prediction
     * @param {Map} transitions - Transition frequency map
     * @param {number} confidenceMultiplier - Multiplier for confidence
     * @returns {Object} Prediction object
     * @private
     */
    _analyzeTransitions(transitions, confidenceMultiplier) {
        let maxCount = 0;
        let predictedMove = null;
        let totalCount = 0;
        const counts = [];
        
        for (const [move, count] of transitions) {
            totalCount += count;
            counts.push(count);
            if (count > maxCount) {
                maxCount = count;
                predictedMove = move;
            }
        }
        
        // Calculate confidence considering distribution
        // Higher confidence if one move is dominant
        const baseConfidence = maxCount / totalCount;
        
        // Calculate entropy to measure predictability
        let entropy = 0;
        for (const count of counts) {
            if (count > 0) {
                const p = count / totalCount;
                entropy -= p * Math.log2(p);
            }
        }
        
        // Lower entropy = more predictable = higher confidence boost
        const maxEntropy = Math.log2(transitions.size);
        const entropyFactor = 1 + (1 - entropy / maxEntropy) * 0.3;
        
        const finalConfidence = Math.min(baseConfidence * entropyFactor * confidenceMultiplier, 1.0);
        
        return {
            move: predictedMove,
            confidence: finalConfidence
        };
    }

    /**
     * Gets frequency-based prediction with intelligent trend analysis
     * @param {Object} patterns - Pattern data
     * @returns {Object|null} Prediction object or null
     * @private
     */
    _getFrequencyPrediction(patterns) {
        if (!patterns || !patterns.frequencies || patterns.frequencies.size === 0) {
            return null;
        }
        
        const recentMoves = patterns.lastMoves || [];
        if (recentMoves.length < 3) return null;
        
        // Analyze multiple time horizons
        const shortTerm = recentMoves.slice(-3);  // Last 3 moves
        const midTerm = recentMoves.slice(-7);    // Last 7 moves
        const longTerm = recentMoves.slice(-15);  // Last 15 moves
        
        const scores = new Map();
        
        for (const move of Object.values(MOVES)) {
            // Count frequencies in each horizon
            const shortFreq = shortTerm.filter(m => m === move).length / shortTerm.length;
            const midFreq = midTerm.length > 0 ? midTerm.filter(m => m === move).length / midTerm.length : 0;
            const longFreq = longTerm.length > 0 ? longTerm.filter(m => m === move).length / longTerm.length : 0;
            
            // Detect trends - is frequency increasing or decreasing?
            const trend = (shortFreq - midFreq) + (midFreq - longFreq) / 2;
            const trendBonus = trend > 0 ? 1.3 : 0.9; // Boost if increasing
            
            // Weight recent more heavily but consider trend
            const weightedScore = (shortFreq * 0.6 + midFreq * 0.3 + longFreq * 0.1) * trendBonus;
            scores.set(move, weightedScore);
        }
        
        // Find highest scoring move
        let maxScore = 0;
        let predictedMove = null;
        let totalScore = 0;
        
        for (const [move, score] of scores) {
            totalScore += score;
            if (score > maxScore) {
                maxScore = score;
                predictedMove = move;
            }
        }
        
        // Check if prediction is strong enough
        const confidence = totalScore > 0 ? (maxScore / totalScore) * 1.15 : 0;
        
        return {
            move: predictedMove,
            confidence: Math.min(confidence, 1.0)
        };
    }

    /**
     * Gets pattern-based prediction including cyclic patterns
     * @param {string[]} moveHistory - Player's move history
     * @param {Object} patterns - Pattern data
     * @returns {Object|null} Prediction object or null
     * @private
     */
    _getPatternPrediction(moveHistory, patterns) {
        // Check for cyclic patterns first
        const cyclicPred = this._getCyclicPrediction(moveHistory);
        if (cyclicPred && cyclicPred.confidence > 0.6) {
            return cyclicPred;
        }
        
        // Fall back to sequence patterns
        if (moveHistory.length < 2 || !patterns || !patterns.sequences) {
            return null;
        }
        
        const lastMove = moveHistory[moveHistory.length - 1];
        const possibleMoves = Object.values(MOVES);
        const predictions = new Map();
        
        for (const move of possibleMoves) {
            const pattern = lastMove + move;
            const count = patterns.sequences?.get(pattern) || 0;
            if (count > 0) {
                predictions.set(move, count);
            }
        }
        
        if (predictions.size === 0) {
            return null;
        }
        
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
        
        const confidence = maxCount / totalCount;
        
        return {
            move: predictedMove,
            confidence: confidence
        };
    }

    /**
     * Gets counter-strategy prediction based on player tendencies
     * @param {string[]} moveHistory - Player's move history
     * @returns {Object|null} Prediction object or null
     * @private
     */
    _getCounterStrategyPrediction(moveHistory) {
        if (moveHistory.length < 3 || this.recentResults.length < 3) {
            return null;
        }
        
        // Analyze behavior based on previous result
        const lastResult = this.recentResults[this.recentResults.length - 1];
        
        // Find patterns in what player does after specific results
        const behaviorPatterns = new Map();
        
        for (let i = 0; i < this.recentResults.length - 1; i++) {
            const result = this.recentResults[i].result;
            const nextMove = this.recentResults[i + 1]?.playerMove;
            
            if (!nextMove) continue;
            
            // Track what they do after each result type
            const key = `after_${result}`;
            if (!behaviorPatterns.has(key)) {
                behaviorPatterns.set(key, new Map());
            }
            
            const patternMap = behaviorPatterns.get(key);
            patternMap.set(nextMove, (patternMap.get(nextMove) || 0) + 1);
        }
        
        // Predict based on last game result
        const relevantPattern = behaviorPatterns.get(`after_${lastResult.result}`);
        if (!relevantPattern || relevantPattern.size === 0) {
            return null;
        }
        
        // Find most common response to this result
        let maxCount = 0;
        let predictedMove = null;
        let totalCount = 0;
        
        for (const [move, count] of relevantPattern) {
            totalCount += count;
            if (count > maxCount) {
                maxCount = count;
                predictedMove = move;
            }
        }
        
        // Also consider if player tends to change strategy after losses
        let confidenceModifier = 1.0;
        if (lastResult.result === 'lose' && moveHistory.length >= 2) {
            const lastMove = moveHistory[moveHistory.length - 1];
            const secondLastMove = moveHistory[moveHistory.length - 2];
            
            // If they're changing moves frequently after losses, lower confidence
            if (lastMove !== secondLastMove) {
                confidenceModifier = 0.85;
            }
        }
        
        const confidence = totalCount > 0 ? (maxCount / totalCount) * confidenceModifier * 1.1 : 0;
        
        return {
            move: predictedMove,
            confidence: Math.min(confidence, 1.0)
        };
    }

    /**
     * Detects and predicts cyclic patterns
     * @param {string[]} moveHistory - Player's move history
     * @returns {Object|null} Prediction object or null
     * @private
     */
    _getCyclicPrediction(moveHistory) {
        if (moveHistory.length < 6) {
            return null;
        }
        
        // Check for cycles of length 2-5
        for (let cycleLength = 2; cycleLength <= 5; cycleLength++) {
            if (moveHistory.length < cycleLength * 2) {
                continue;
            }
            
            const recentMoves = moveHistory.slice(-cycleLength * 2);
            const firstHalf = recentMoves.slice(0, cycleLength);
            const secondHalf = recentMoves.slice(cycleLength);
            
            if (JSON.stringify(firstHalf) === JSON.stringify(secondHalf)) {
                // Found a cycle, predict next move in sequence
                const positionInCycle = moveHistory.length % cycleLength;
                const predictedMove = firstHalf[positionInCycle];
                
                return {
                    move: predictedMove,
                    confidence: 0.8 // High confidence for detected cycles
                };
            }
        }
        
        return null;
    }

    /**
     * Selects best prediction based on confidence and weights
     * @param {Array} predictions - Array of prediction objects
     * @returns {Object|null} Best prediction or null
     * @private
     */
    _selectBestPrediction(predictions) {
        if (predictions.length === 0) {
            return null;
        }
        
        let bestScore = 0;
        let bestPrediction = null;
        
        for (const pred of predictions) {
            const score = pred.confidence * pred.weight;
            if (score > bestScore) {
                bestScore = score;
                bestPrediction = pred;
            }
        }
        
        return bestPrediction;
    }

    /**
     * Gets weighted prediction from multiple strategies
     * @param {Array} predictions - Array of prediction objects
     * @returns {string} Predicted move
     * @private
     */
    _getWeightedPrediction(predictions) {
        if (predictions.length === 0) {
            return this._getRandomMove();
        }
        
        // Create weighted distribution
        const moveScores = new Map();
        
        for (const pred of predictions) {
            const score = pred.confidence * pred.weight;
            const currentScore = moveScores.get(pred.move) || 0;
            moveScores.set(pred.move, currentScore + score);
        }
        
        // Select move based on weighted scores
        let totalScore = 0;
        for (const score of moveScores.values()) {
            totalScore += score;
        }
        
        if (totalScore === 0) {
            return this._getRandomMove();
        }
        
        let random = Math.random() * totalScore;
        for (const [move, score] of moveScores) {
            random -= score;
            if (random <= 0) {
                return this._getCounterMove(move);
            }
        }
        
        return this._getRandomMove();
    }

    /**
     * Explores alternative strategies
     * @param {string[]} moveHistory - Player's move history
     * @param {Object} patterns - Pattern data
     * @returns {string} Exploratory move
     * @private
     */
    _exploreStrategy(moveHistory, patterns) {
        // Randomly select a strategy to explore
        const strategies = ['random', 'anti-frequency', 'chaos'];
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        
        switch (strategy) {
            case 'anti-frequency':
                return this._getAntiFrequencyMove(patterns);
            case 'chaos':
                return this._getChaosMove(moveHistory);
            default:
                return this._getRandomMove();
        }
    }

    /**
     * Gets move that counters least frequent player move
     * @param {Object} patterns - Pattern data
     * @returns {string} Anti-frequency move
     * @private
     */
    _getAntiFrequencyMove(patterns) {
        if (!patterns.frequencies || patterns.frequencies.size === 0) {
            return this._getRandomMove();
        }
        
        let minCount = Infinity;
        let leastFrequent = null;
        
        for (const move of Object.values(MOVES)) {
            const count = patterns.frequencies.get(move) || 0;
            if (count < minCount) {
                minCount = count;
                leastFrequent = move;
            }
        }
        
        return this._getCounterMove(leastFrequent || this._getRandomMove());
    }

    /**
     * Gets chaotic move based on complex patterns
     * @param {string[]} moveHistory - Player's move history
     * @returns {string} Chaos move
     * @private
     */
    _getChaosMove(moveHistory) {
        // Use hash of recent moves to generate pseudo-random but deterministic move
        const recentMoves = moveHistory.slice(-5).join('');
        let hash = 0;
        for (let i = 0; i < recentMoves.length; i++) {
            hash = ((hash << 5) - hash + recentMoves.charCodeAt(i)) & 0xffffffff;
        }
        
        const moves = Object.values(MOVES);
        return moves[Math.abs(hash) % moves.length];
    }

    /**
     * Analyzes behavioral patterns in player moves
     * @param {string} move - Current move
     * @param {string[]} moveHistory - Move history
     * @private
     */
    _analyzeBehavioralPatterns(move, moveHistory) {
        // Track tendency to repeat moves
        if (moveHistory.length > 0) {
            const lastMove = moveHistory[moveHistory.length - 1];
            const key = 'repeat_tendency';
            const current = this.playerTendencies.get(key) || { same: 0, different: 0 };
            
            if (move === lastMove) {
                current.same++;
            } else {
                current.different++;
            }
            
            this.playerTendencies.set(key, current);
        }
        
        // Track alternating patterns
        if (moveHistory.length >= 2) {
            const twoMovesAgo = moveHistory[moveHistory.length - 2];
            const key = 'alternating_tendency';
            const current = this.playerTendencies.get(key) || { alternates: 0, doesnt: 0 };
            
            if (move === twoMovesAgo) {
                current.alternates++;
            } else {
                current.doesnt++;
            }
            
            this.playerTendencies.set(key, current);
        }
    }

    /**
     * Detects cyclic patterns in move history
     * @param {string[]} moveHistory - Move history
     * @private
     */
    _detectCyclicPatterns(moveHistory) {
        if (moveHistory.length < 6) {
            return;
        }
        
        // Look for repeating cycles
        for (let cycleLength = 2; cycleLength <= 4; cycleLength++) {
            if (moveHistory.length < cycleLength * 3) {
                continue;
            }
            
            const pattern = moveHistory.slice(-cycleLength).join('');
            const prevPattern = moveHistory.slice(-cycleLength * 2, -cycleLength).join('');
            
            if (pattern === prevPattern) {
                const count = this.cyclicPatterns.get(pattern) || 0;
                this.cyclicPatterns.set(pattern, count + 1);
            }
        }
    }

    /**
     * Updates contextual patterns based on game state
     * @param {string} move - Current move
     * @param {string[]} moveHistory - Move history
     * @private
     */
    _updateContextualPatterns(move, moveHistory) {
        // Pattern based on position in game
        const gamePosition = moveHistory.length;
        const positionKey = `position_${Math.floor(gamePosition / 5) * 5}`; // Group by 5s
        
        const positionPattern = this.contextualPatterns.get(positionKey) || new Map();
        const count = positionPattern.get(move) || 0;
        positionPattern.set(move, count + 1);
        this.contextualPatterns.set(positionKey, positionPattern);
    }

    /**
     * Updates strategy performance tracking
     * @param {string} result - Game result
     * @private
     */
    _updateStrategyPerformance(result) {
        // This would be enhanced to track which strategy was used for each move
        // For now, update all strategies based on overall performance
        for (const [strategy, perf] of this.strategyPerformance) {
            perf.total++;
            if (result === 'win') {
                perf.wins++;
            }
        }
    }

    /**
     * Adapts strategy weights based on performance
     * @private
     */
    _adaptStrategyWeights() {
        if (this.movesAnalyzed < 10) {
            return; // Need enough data
        }
        
        const totalPerformance = this._calculateRecentWinRate();
        
        // Adjust weights based on overall performance
        if (totalPerformance > 0.7) {
            // Doing well, increase exploitation
            this.explorationRate = Math.max(0.05, this.explorationRate - 0.01);
        } else if (totalPerformance < 0.4) {
            // Not doing well, increase exploration
            this.explorationRate = Math.min(0.3, this.explorationRate + 0.02);
        }
    }

    /**
     * Updates player tendency analysis
     * @param {string} playerMove - Player's move
     * @param {string} result - Game result
     * @private
     */
    _updatePlayerTendencies(playerMove, result) {
        const key = `after_${result}`;
        const tendency = this.playerTendencies.get(key) || new Map();
        const count = tendency.get(playerMove) || 0;
        tendency.set(playerMove, count + 1);
        this.playerTendencies.set(key, tendency);
    }

    /**
     * Adjusts exploration rate based on performance
     * @private
     */
    _adjustExplorationRate() {
        const recentWinRate = this._calculateRecentWinRate();
        
        if (recentWinRate > 0.75) {
            // Very successful, reduce exploration
            this.explorationRate = Math.max(0.05, this.explorationRate * 0.95);
        } else if (recentWinRate < 0.3) {
            // Poor performance, increase exploration
            this.explorationRate = Math.min(0.25, this.explorationRate * 1.1);
        }
    }

    /**
     * Calculates recent win rate
     * @returns {number} Win rate from recent games
     * @private
     */
    _calculateRecentWinRate() {
        if (this.recentResults.length === 0) {
            return 0;
        }
        
        const wins = this.recentResults.filter(r => r.result === 'win').length;
        return wins / this.recentResults.length;
    }

    /**
     * Gets the top performing strategy
     * @returns {string} Name of top strategy
     * @private
     */
    _getTopStrategy() {
        let topStrategy = 'markov';
        let topWeight = 0;
        
        for (const [strategy, weight] of this.strategyWeights) {
            if (weight > topWeight) {
                topWeight = weight;
                topStrategy = strategy;
            }
        }
        
        return topStrategy;
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
    module.exports = HardAIStrategy;
}