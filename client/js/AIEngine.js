/**
 * @fileoverview Browser-compatible AI Engine for Rock Paper Scissors game
 * This is a simplified version of the server-side AI engine for client-side use
 */

// AI Engine class for browser environment
class AIEngine {
    constructor(difficulty = 'easy', playerId = 'human') {
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
     */
    _createStrategy(difficulty) {
        switch (difficulty) {
            case 'easy':
                return new EasyAIStrategy();
            case 'medium':
                return new MediumAIStrategy();
            case 'hard':
                return new HardAIStrategy();
            default:
                return new EasyAIStrategy();
        }
    }

    /**
     * Records a player move and updates analysis
     */
    recordPlayerMove(move) {
        if (!this._isValidMove(move)) {
            throw new Error(`Invalid move: ${move}`);
        }
        
        this._updatePatterns(move);
        this.moveHistory.push(move);
        this.strategy.analyzeMove(move, this.moveHistory);
    }

    /**
     * Gets the AI's next move
     */
    makeMove() {
        const move = this.strategy.makeMove(this.moveHistory, this.patterns);
        
        if (!this._isValidMove(move)) {
            return this._getRandomMove();
        }
        
        return move;
    }

    /**
     * Gets thinking time for realistic gameplay
     */
    getThinkingTime() {
        if (typeof this.strategy.getThinkingTime === 'function') {
            return this.strategy.getThinkingTime();
        }
        
        // Default thinking times based on difficulty
        switch (this.difficulty) {
            case 'easy': return 500 + Math.random() * 1000; // 0.5-1.5s
            case 'medium': return 1000 + Math.random() * 1500; // 1-2.5s
            case 'hard': return 1500 + Math.random() * 2000; // 1.5-3.5s
            default: return 1000;
        }
    }

    /**
     * Updates AI strategy based on game result
     */
    updateStrategy(aiMove, playerMove, result) {
        this.strategy.updateStrategy(aiMove, playerMove, result, this.patterns);
        this._updateAdaptationLevel(result);
    }

    /**
     * Gets strategy statistics
     */
    getStrategyStats() {
        if (typeof this.strategy.getStats === 'function') {
            return this.strategy.getStats();
        }
        return {
            name: this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1) + ' AI',
            description: `${this.difficulty} difficulty AI opponent`,
            adaptationLevel: this.adaptationLevel,
            movesAnalyzed: this.moveHistory.length,
            expectedWinRate: this.difficulty === 'easy' ? 0.33 : (this.difficulty === 'medium' ? 0.55 : 0.75)
        };
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
        if (this.strategy && typeof this.strategy.reset === 'function') {
            this.strategy.reset();
        }
    }

    /**
     * Updates move patterns based on new move
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
     */
    _updateAdaptationLevel(result) {
        const increment = result === 'win' ? 0.02 : (result === 'lose' ? -0.01 : 0);
        this.adaptationLevel = Math.max(0, Math.min(1, this.adaptationLevel + increment));
    }

    /**
     * Validates if a move is valid
     */
    _isValidMove(move) {
        return ['rock', 'paper', 'scissors'].includes(move);
    }

    /**
     * Gets a random move
     */
    _getRandomMove() {
        const moves = ['rock', 'paper', 'scissors'];
        return moves[Math.floor(Math.random() * moves.length)];
    }

    /**
     * Gets move that beats the given move
     */
    _getCounterMove(move) {
        const counters = {
            rock: 'paper',
            paper: 'scissors',
            scissors: 'rock'
        };
        return counters[move] || this._getRandomMove();
    }
}

// AI Strategy Classes

class EasyAIStrategy {
    constructor() {
        this.name = 'Easy AI';
        this.description = 'Random moves with no pattern recognition';
    }

    analyzeMove(move, history) {
        // Easy AI doesn't analyze moves
    }

    makeMove(history, patterns) {
        // Always random
        const moves = ['rock', 'paper', 'scissors'];
        return moves[Math.floor(Math.random() * moves.length)];
    }

    getThinkingTime() {
        return 500 + Math.random() * 1000; // 0.5-1.5 seconds
    }

    updateStrategy(aiMove, playerMove, result, patterns) {
        // Easy AI doesn't update strategy
    }

    getStats() {
        return {
            name: this.name,
            description: this.description,
            expectedWinRate: 0.33
        };
    }

    reset() {
        // Nothing to reset for easy AI
    }
}

class MediumAIStrategy {
    constructor() {
        this.name = 'Medium AI';
        this.description = 'Basic pattern recognition and frequency analysis';
        this.recentBias = 0.7; // How much to weight recent moves
    }

    analyzeMove(move, history) {
        // Medium AI analyzes frequency patterns
    }

    makeMove(history, patterns) {
        if (patterns.frequencies.size === 0) {
            return this._getRandomMove();
        }

        // Find most frequent move with recent bias
        let mostFrequent = null;
        let maxScore = 0;

        for (const [move, count] of patterns.frequencies) {
            // Weight recent moves more heavily
            const recentCount = patterns.lastMoves.filter(m => m === move).length;
            const score = count + (recentCount * this.recentBias);
            
            if (score > maxScore) {
                maxScore = score;
                mostFrequent = move;
            }
        }

        // Counter the most frequent move 70% of the time
        if (mostFrequent && Math.random() < 0.7) {
            return this._getCounterMove(mostFrequent);
        }

        return this._getRandomMove();
    }

    getThinkingTime() {
        return 1000 + Math.random() * 1500; // 1-2.5 seconds
    }

    updateStrategy(aiMove, playerMove, result, patterns) {
        // Adjust bias based on success
        if (result === 'win') {
            this.recentBias = Math.min(1, this.recentBias + 0.05);
        } else if (result === 'lose') {
            this.recentBias = Math.max(0.3, this.recentBias - 0.03);
        }
    }

    getStats() {
        return {
            name: this.name,
            description: this.description,
            expectedWinRate: 0.55,
            recentBias: this.recentBias
        };
    }

    reset() {
        this.recentBias = 0.7;
    }

    _getRandomMove() {
        const moves = ['rock', 'paper', 'scissors'];
        return moves[Math.floor(Math.random() * moves.length)];
    }

    _getCounterMove(move) {
        const counters = {
            rock: 'paper',
            paper: 'scissors',
            scissors: 'rock'
        };
        return counters[move] || this._getRandomMove();
    }
}

class HardAIStrategy {
    constructor() {
        this.name = 'Hard AI';
        this.description = 'Advanced pattern recognition with Markov chain analysis';
        this.sequenceWeights = new Map();
        this.adaptationRate = 0.1;
        this.metaStrategy = 'frequency'; // 'frequency', 'sequence', 'counter'
        this.strategySuccess = { frequency: 0, sequence: 0, counter: 0 };
        this.strategyAttempts = { frequency: 0, sequence: 0, counter: 0 };
    }

    analyzeMove(move, history) {
        // Update sequence weights for Markov chain analysis
        if (history.length >= 2) {
            const sequence = history.slice(-2).join('');
            const weight = this.sequenceWeights.get(sequence) || 0;
            this.sequenceWeights.set(sequence, weight + 1);
        }
    }

    makeMove(history, patterns) {
        // Choose strategy based on current meta-strategy
        let move;
        
        switch (this.metaStrategy) {
            case 'sequence':
                move = this._getSequenceBasedMove(history, patterns);
                break;
            case 'counter':
                move = this._getCounterStrategyMove(history, patterns);
                break;
            default:
                move = this._getFrequencyBasedMove(patterns);
        }

        this.strategyAttempts[this.metaStrategy]++;
        return move || this._getRandomMove();
    }

    getThinkingTime() {
        return 1500 + Math.random() * 2000; // 1.5-3.5 seconds
    }

    updateStrategy(aiMove, playerMove, result, patterns) {
        // Update strategy success rates
        if (result === 'win') {
            this.strategySuccess[this.metaStrategy]++;
        }

        // Adapt meta-strategy based on success rates
        if (this.strategyAttempts[this.metaStrategy] >= 5) {
            const successRate = this.strategySuccess[this.metaStrategy] / this.strategyAttempts[this.metaStrategy];
            
            // Switch to best performing strategy
            const strategies = ['frequency', 'sequence', 'counter'];
            let bestStrategy = this.metaStrategy;
            let bestRate = successRate;

            for (const strategy of strategies) {
                if (this.strategyAttempts[strategy] >= 3) {
                    const rate = this.strategySuccess[strategy] / this.strategyAttempts[strategy];
                    if (rate > bestRate) {
                        bestRate = rate;
                        bestStrategy = strategy;
                    }
                }
            }

            this.metaStrategy = bestStrategy;
        }
    }

    getStats() {
        const totalAttempts = Object.values(this.strategyAttempts).reduce((a, b) => a + b, 0);
        const totalSuccess = Object.values(this.strategySuccess).reduce((a, b) => a + b, 0);
        
        return {
            name: this.name,
            description: this.description,
            expectedWinRate: 0.75,
            currentStrategy: this.metaStrategy,
            overallSuccessRate: totalAttempts > 0 ? totalSuccess / totalAttempts : 0,
            strategyStats: {
                frequency: this.strategyAttempts.frequency > 0 ? this.strategySuccess.frequency / this.strategyAttempts.frequency : 0,
                sequence: this.strategyAttempts.sequence > 0 ? this.strategySuccess.sequence / this.strategyAttempts.sequence : 0,
                counter: this.strategyAttempts.counter > 0 ? this.strategySuccess.counter / this.strategyAttempts.counter : 0
            }
        };
    }

    reset() {
        this.sequenceWeights.clear();
        this.metaStrategy = 'frequency';
        this.strategySuccess = { frequency: 0, sequence: 0, counter: 0 };
        this.strategyAttempts = { frequency: 0, sequence: 0, counter: 0 };
    }

    _getFrequencyBasedMove(patterns) {
        if (patterns.frequencies.size === 0) return null;

        let mostFrequent = null;
        let maxCount = 0;

        for (const [move, count] of patterns.frequencies) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = move;
            }
        }

        return mostFrequent ? this._getCounterMove(mostFrequent) : null;
    }

    _getSequenceBasedMove(history, patterns) {
        if (history.length < 2) return null;

        const lastSequence = history.slice(-2).join('');
        let bestNextMove = null;
        let maxWeight = 0;

        // Look for patterns in sequences
        for (const [sequence, weight] of this.sequenceWeights) {
            if (sequence.startsWith(lastSequence.charAt(1))) {
                const nextMove = sequence.charAt(1);
                if (weight > maxWeight) {
                    maxWeight = weight;
                    bestNextMove = nextMove;
                }
            }
        }

        return bestNextMove ? this._getCounterMove(bestNextMove) : null;
    }

    _getCounterStrategyMove(history, patterns) {
        // Anti-frequency strategy - play what they play least
        if (patterns.frequencies.size === 0) return null;

        let leastFrequent = null;
        let minCount = Infinity;

        const moves = ['rock', 'paper', 'scissors'];
        for (const move of moves) {
            const count = patterns.frequencies.get(move) || 0;
            if (count < minCount) {
                minCount = count;
                leastFrequent = move;
            }
        }

        return leastFrequent;
    }

    _getRandomMove() {
        const moves = ['rock', 'paper', 'scissors'];
        return moves[Math.floor(Math.random() * moves.length)];
    }

    _getCounterMove(move) {
        const counters = {
            rock: 'paper',
            paper: 'scissors',
            scissors: 'rock'
        };
        return counters[move] || this._getRandomMove();
    }
}

// Make classes available globally
if (typeof window !== 'undefined') {
    window.AIEngine = AIEngine;
    window.EasyAIStrategy = EasyAIStrategy;
    window.MediumAIStrategy = MediumAIStrategy;
    window.HardAIStrategy = HardAIStrategy;
}