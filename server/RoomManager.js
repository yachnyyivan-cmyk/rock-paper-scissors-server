const Room = require('./Room');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> Room
        this.roomCodes = new Map(); // roomCode -> roomId
        this.playerRooms = new Map(); // playerId -> roomId
        
        // Start cleanup interval
        this.startCleanupInterval();
    }
    
    createRoom(creatorId, creatorName) {
        // Check if player is already in a room
        if (this.playerRooms.has(creatorId)) {
            throw new Error('Player is already in a room');
        }
        
        const room = new Room(creatorId, creatorName);
        
        // Ensure room code is unique
        let attempts = 0;
        while (this.roomCodes.has(room.roomCode) && attempts < 10) {
            room.roomCode = room.generateRoomCode();
            attempts++;
        }
        
        if (this.roomCodes.has(room.roomCode)) {
            throw new Error('Failed to generate unique room code');
        }
        
        // Store room references
        this.rooms.set(room.roomId, room);
        this.roomCodes.set(room.roomCode, room.roomId);
        this.playerRooms.set(creatorId, room.roomId);
        
        console.log(`Room created: ${room.roomCode} (${room.roomId}) by ${creatorName}`);
        return room;
    }
    
    joinRoom(roomCode, playerId, playerName) {
        // Check if player is already in a room
        if (this.playerRooms.has(playerId)) {
            throw new Error('Player is already in a room');
        }
        
        // Find room by code
        const roomId = this.roomCodes.get(roomCode.toUpperCase());
        if (!roomId) {
            throw new Error('Room not found');
        }
        
        const room = this.rooms.get(roomId);
        if (!room || !room.isActive) {
            throw new Error('Room is not active');
        }
        
        if (room.isFull()) {
            throw new Error('Room is full');
        }
        
        // Add player to room
        const player = room.addPlayer(playerId, playerName);
        this.playerRooms.set(playerId, roomId);
        
        console.log(`Player ${playerName} joined room ${roomCode}`);
        return { room, player };
    }
    
    leaveRoom(playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId) {
            return null; // Player not in any room
        }
        
        const room = this.rooms.get(roomId);
        if (!room) {
            // Clean up orphaned player reference
            this.playerRooms.delete(playerId);
            return null;
        }
        
        // Remove player from room
        const removed = room.removePlayer(playerId);
        this.playerRooms.delete(playerId);
        
        // If room is empty, clean it up
        if (room.isEmpty()) {
            this.deleteRoom(roomId);
        }
        
        console.log(`Player ${playerId} left room ${room.roomCode}`);
        return { room, removed };
    }
    
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    
    getRoomByCode(roomCode) {
        const roomId = this.roomCodes.get(roomCode.toUpperCase());
        return roomId ? this.rooms.get(roomId) : null;
    }
    
    getPlayerRoom(playerId) {
        const roomId = this.playerRooms.get(playerId);
        return roomId ? this.rooms.get(roomId) : null;
    }
    
    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        // Remove all player references
        for (const playerId of room.getPlayerIds()) {
            this.playerRooms.delete(playerId);
        }
        
        // Remove room references
        this.roomCodes.delete(room.roomCode);
        this.rooms.delete(roomId);
        
        console.log(`Room deleted: ${room.roomCode} (${roomId})`);
        return true;
    }
    
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    
    getActiveRooms() {
        return Array.from(this.rooms.values()).filter(room => room.isActive);
    }
    
    getRoomStats() {
        const rooms = Array.from(this.rooms.values());
        return {
            totalRooms: rooms.length,
            activeRooms: rooms.filter(r => r.isActive).length,
            waitingRooms: rooms.filter(r => r.status === 'waiting').length,
            playingRooms: rooms.filter(r => r.status === 'playing').length,
            totalPlayers: Array.from(this.playerRooms.keys()).length
        };
    }
    
    // Validate room code format
    isValidRoomCode(roomCode) {
        return typeof roomCode === 'string' && 
               roomCode.length === 6 && 
               /^[A-Z0-9]+$/.test(roomCode);
    }
    
    // Clean up inactive rooms periodically
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupInactiveRooms();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    
    cleanupInactiveRooms() {
        const now = new Date();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [roomId, room] of this.rooms.entries()) {
            const age = now - room.createdAt;
            
            // Clean up old empty rooms or very old rooms
            if ((room.isEmpty() && age > 5 * 60 * 1000) || // 5 minutes for empty rooms
                age > maxAge) { // 30 minutes for any room
                console.log(`Cleaning up old room: ${room.roomCode}`);
                this.deleteRoom(roomId);
            }
        }
    }
    
    // Force cleanup all rooms (for testing)
    cleanup() {
        const roomIds = Array.from(this.rooms.keys());
        for (const roomId of roomIds) {
            this.deleteRoom(roomId);
        }
    }
}

module.exports = RoomManager;