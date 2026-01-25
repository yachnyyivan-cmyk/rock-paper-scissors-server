/**
 * @fileoverview Type definitions for Rock Paper Scissors game
 * These JSDoc comments provide type safety without TypeScript compilation
 */

/**
 * @typedef {'rock' | 'paper' | 'scissors'} Move
 * Valid moves in the game
 */

/**
 * @typedef {'easy' | 'medium' | 'hard'} AIDifficulty
 * AI difficulty levels
 */

/**
 * @typedef {'pvp' | 'pvai'} GameMode
 * Game modes: Player vs Player or Player vs AI
 */

/**
 * @typedef {'waiting' | 'playing' | 'finished'} GameStatus
 * Current status of the game
 */

/**
 * @typedef {Object} Player
 * @property {string} id - Unique player identifier
 * @property {string} name - Player display name
 * @property {number} score - Current score
 * @property {Move|null} currentMove - Current move selection
 * @property {boolean} isReady - Whether player is ready for next round
 * @property {boolean} isConnected - Connection status (for multiplayer)
 */

/**
 * @typedef {Object} GameState
 * @property {string} gameId - Unique game identifier
 * @property {GameMode} mode - Game mode
 * @property {Player[]} players - Array of players (max 2)
 * @property {number} currentRound - Current round number
 * @property {number} maxRounds - Maximum rounds (first to win this many)
 * @property {GameStatus} status - Current game status
 * @property {string|null} winner - Winner ID or null if game ongoing
 * @property {AIDifficulty|null} aiDifficulty - AI difficulty if in PvAI mode
 * @property {Date} createdAt - Game creation timestamp
 * @property {Date|null} finishedAt - Game completion timestamp
 */

/**
 * @typedef {Object} Room
 * @property {string} roomId - Unique room identifier
 * @property {string} roomCode - Human-readable room code for joining
 * @property {string[]} players - Array of player IDs in the room
 * @property {number} maxPlayers - Maximum players allowed (always 2)
 * @property {GameState} gameState - Current game state
 * @property {Date} createdAt - Room creation timestamp
 * @property {boolean} isActive - Whether room is active
 */

/**
 * @typedef {Object} AIHistory
 * @property {string} playerId - Player ID being analyzed
 * @property {Move[]} moveHistory - History of player moves
 * @property {Object} patterns - Detected patterns
 * @property {Map<string, number>} patterns.sequences - Move sequence frequencies
 * @property {Map<string, number>} patterns.frequencies - Individual move frequencies
 * @property {Move[]} patterns.lastMoves - Recent moves for pattern analysis
 * @property {number} adaptationLevel - How much AI has adapted (0-1)
 */

/**
 * @typedef {Object} GameResult
 * @property {Move} player1Move - First player's move
 * @property {Move} player2Move - Second player's move
 * @property {'player1' | 'player2' | 'tie'} winner - Round winner
 * @property {string} reason - Explanation of result
 */

/**
 * @typedef {Object} ConnectionStatus
 * @property {boolean} connected - Whether client is connected
 * @property {number} latency - Connection latency in ms
 * @property {Date} lastPing - Last ping timestamp
 * @property {number} reconnectAttempts - Number of reconnection attempts
 */

// Export types for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // These are just for documentation - actual validation will be done in implementation
    };
}