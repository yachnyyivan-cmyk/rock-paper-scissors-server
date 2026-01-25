/**
 * @fileoverview Shared game utilities and constants
 */

// Game constants
const MOVES = {
    ROCK: 'rock',
    PAPER: 'paper',
    SCISSORS: 'scissors'
};

const GAME_MODES = {
    PVP: 'pvp',
    PVAI: 'pvai'
};

const AI_DIFFICULTIES = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

const GAME_STATUS = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished'
};

/**
 * Validates if a move is valid
 * @param {string} move - The move to validate
 * @returns {boolean} True if move is valid
 */
function isValidMove(move) {
    return Object.values(MOVES).includes(move);
}

/**
 * Determines the winner of a round
 * @param {string} move1 - First player's move
 * @param {string} move2 - Second player's move
 * @returns {Object} Result object with winner and reason
 */
function determineWinner(move1, move2) {
    if (!isValidMove(move1) || !isValidMove(move2)) {
        throw new Error('Invalid moves provided');
    }
    
    if (move1 === move2) {
        return {
            winner: 'tie',
            reason: `Both players chose ${move1}`
        };
    }
    
    const winConditions = {
        [MOVES.ROCK]: MOVES.SCISSORS,
        [MOVES.PAPER]: MOVES.ROCK,
        [MOVES.SCISSORS]: MOVES.PAPER
    };
    
    if (winConditions[move1] === move2) {
        return {
            winner: 'player1',
            reason: `${move1} beats ${move2}`
        };
    } else {
        return {
            winner: 'player2',
            reason: `${move2} beats ${move1}`
        };
    }
}

/**
 * Generates a random room code
 * @param {number} length - Length of the room code
 * @returns {string} Random room code
 */
function generateRoomCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Creates a new player object
 * @param {string} id - Player ID
 * @param {string} name - Player name
 * @returns {Object} Player object
 */
function createPlayer(id, name = 'Player') {
    return {
        id,
        name,
        score: 0,
        currentMove: null,
        isReady: false,
        isConnected: true
    };
}

/**
 * Creates a new game state object
 * @param {string} gameId - Game ID
 * @param {string} mode - Game mode
 * @param {Object} options - Additional options
 * @returns {Object} Game state object
 */
function createGameState(gameId, mode, options = {}) {
    return {
        gameId,
        mode,
        players: [],
        currentRound: 0,
        maxRounds: options.maxRounds || 5,
        status: GAME_STATUS.WAITING,
        winner: null,
        aiDifficulty: options.aiDifficulty || null,
        createdAt: new Date(),
        finishedAt: null
    };
}

/**
 * Validates game state object
 * @param {Object} gameState - Game state to validate
 * @returns {boolean} True if valid
 */
function isValidGameState(gameState) {
    return (
        gameState &&
        typeof gameState.gameId === 'string' &&
        Object.values(GAME_MODES).includes(gameState.mode) &&
        Array.isArray(gameState.players) &&
        typeof gameState.currentRound === 'number' &&
        typeof gameState.maxRounds === 'number' &&
        Object.values(GAME_STATUS).includes(gameState.status)
    );
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MOVES,
        GAME_MODES,
        AI_DIFFICULTIES,
        GAME_STATUS,
        isValidMove,
        determineWinner,
        generateRoomCode,
        createPlayer,
        createGameState,
        isValidGameState
    };
} else if (typeof window !== 'undefined') {
    window.GameUtils = {
        MOVES,
        GAME_MODES,
        AI_DIFFICULTIES,
        GAME_STATUS,
        isValidMove,
        determineWinner,
        generateRoomCode,
        createPlayer,
        createGameState,
        isValidGameState
    };
}