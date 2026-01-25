const { v4: uuidv4 } = require('uuid');

class Room {
    constructor(creatorId, creatorName) {
        this.roomId = uuidv4();
        this.roomCode = this.generateRoomCode();
        this.players = new Map();
        this.maxPlayers = 2;
        this.gameState = null;
        this.createdAt = new Date();
        this.isActive = true;
        this.status = 'waiting'; // waiting, playing, finished
        
        // Add creator as first player
        this.addPlayer(creatorId, creatorName);
    }
    
    generateRoomCode() {
        // Generate a 6-character alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    addPlayer(playerId, playerName) {
        if (this.players.size >= this.maxPlayers) {
            throw new Error('Room is full');
        }
        
        if (this.players.has(playerId)) {
            throw new Error('Player already in room');
        }
        
        const player = {
            id: playerId,
            name: playerName || `Player ${this.players.size + 1}`,
            joinedAt: new Date(),
            isReady: false,
            score: 0,
            currentMove: null
        };
        
        this.players.set(playerId, player);
        
        // If room is full, we can start the game
        if (this.players.size === this.maxPlayers) {
            this.status = 'ready';
        }
        
        return player;
    }
    
    removePlayer(playerId) {
        const removed = this.players.delete(playerId);
        
        // If room becomes empty, mark as inactive
        if (this.players.size === 0) {
            this.isActive = false;
        } else if (this.players.size < this.maxPlayers && this.status === 'ready') {
            this.status = 'waiting';
        }
        
        return removed;
    }
    
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    getAllPlayers() {
        return Array.from(this.players.values());
    }
    
    getPlayerIds() {
        return Array.from(this.players.keys());
    }
    
    isFull() {
        return this.players.size >= this.maxPlayers;
    }
    
    isEmpty() {
        return this.players.size === 0;
    }
    
    canStart() {
        return this.players.size === this.maxPlayers && this.status === 'ready';
    }
    
    setPlayerReady(playerId, ready = true) {
        const player = this.players.get(playerId);
        if (player) {
            player.isReady = ready;
            return true;
        }
        return false;
    }
    
    areAllPlayersReady() {
        return Array.from(this.players.values()).every(player => player.isReady);
    }
    
    setPlayerMove(playerId, move) {
        const player = this.players.get(playerId);
        if (player && ['rock', 'paper', 'scissors'].includes(move)) {
            player.currentMove = move;
            return true;
        }
        return false;
    }
    
    clearPlayerMoves() {
        for (const player of this.players.values()) {
            player.currentMove = null;
        }
    }
    
    getAllPlayerMoves() {
        const moves = {};
        for (const [playerId, player] of this.players.entries()) {
            moves[playerId] = player.currentMove;
        }
        return moves;
    }
    
    haveAllPlayersSubmittedMoves() {
        return Array.from(this.players.values()).every(player => player.currentMove !== null);
    }
    
    updatePlayerScore(playerId, points = 1) {
        const player = this.players.get(playerId);
        if (player) {
            player.score += points;
            return player.score;
        }
        return null;
    }
    
    getWinner() {
        const players = Array.from(this.players.values());
        if (players.length !== 2) return null;
        
        const [player1, player2] = players;
        if (player1.score > player2.score) return player1;
        if (player2.score > player1.score) return player2;
        return null; // Tie
    }
    
    toJSON() {
        return {
            roomId: this.roomId,
            roomCode: this.roomCode,
            players: this.getAllPlayers(),
            maxPlayers: this.maxPlayers,
            status: this.status,
            isActive: this.isActive,
            createdAt: this.createdAt,
            playerCount: this.players.size
        };
    }
    
    // Validate room state
    isValid() {
        return this.isActive && 
               this.roomCode && 
               this.roomId && 
               this.players.size <= this.maxPlayers;
    }
}

module.exports = Room;