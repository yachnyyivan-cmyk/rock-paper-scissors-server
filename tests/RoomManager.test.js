const RoomManager = require('../server/RoomManager');

describe('RoomManager', () => {
    let roomManager;
    const playerId1 = 'player1';
    const playerId2 = 'player2';
    const playerId3 = 'player3';
    const playerName1 = 'Alice';
    const playerName2 = 'Bob';
    const playerName3 = 'Charlie';

    beforeEach(() => {
        roomManager = new RoomManager();
    });

    afterEach(() => {
        roomManager.cleanup();
    });

    describe('createRoom', () => {
        test('should create a room successfully', () => {
            const room = roomManager.createRoom(playerId1, playerName1);
            
            expect(room).toBeDefined();
            expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/);
            expect(room.players.size).toBe(1);
            expect(roomManager.getRoom(room.roomId)).toBe(room);
            expect(roomManager.getRoomByCode(room.roomCode)).toBe(room);
            expect(roomManager.getPlayerRoom(playerId1)).toBe(room);
        });

        test('should throw error if player already in room', () => {
            roomManager.createRoom(playerId1, playerName1);
            
            expect(() => {
                roomManager.createRoom(playerId1, playerName1);
            }).toThrow('Player is already in a room');
        });

        test('should generate unique room codes', () => {
            const room1 = roomManager.createRoom(playerId1, playerName1);
            const room2 = roomManager.createRoom(playerId2, playerName2);
            
            expect(room1.roomCode).not.toBe(room2.roomCode);
        });
    });

    describe('joinRoom', () => {
        let room;
        
        beforeEach(() => {
            room = roomManager.createRoom(playerId1, playerName1);
        });

        test('should join room successfully', () => {
            const result = roomManager.joinRoom(room.roomCode, playerId2, playerName2);
            
            expect(result.room).toBe(room);
            expect(result.player.id).toBe(playerId2);
            expect(result.player.name).toBe(playerName2);
            expect(room.players.size).toBe(2);
            expect(roomManager.getPlayerRoom(playerId2)).toBe(room);
        });

        test('should throw error for invalid room code', () => {
            expect(() => {
                roomManager.joinRoom('INVALID', playerId2, playerName2);
            }).toThrow('Room not found');
        });

        test('should throw error if player already in room', () => {
            expect(() => {
                roomManager.joinRoom(room.roomCode, playerId1, playerName1);
            }).toThrow('Player is already in a room');
        });

        test('should throw error if room is full', () => {
            roomManager.joinRoom(room.roomCode, playerId2, playerName2);
            
            expect(() => {
                roomManager.joinRoom(room.roomCode, playerId3, playerName3);
            }).toThrow('Room is full');
        });

        test('should be case insensitive for room codes', () => {
            const result = roomManager.joinRoom(room.roomCode.toLowerCase(), playerId2, playerName2);
            expect(result.room).toBe(room);
        });
    });

    describe('leaveRoom', () => {
        let room;
        
        beforeEach(() => {
            room = roomManager.createRoom(playerId1, playerName1);
            roomManager.joinRoom(room.roomCode, playerId2, playerName2);
        });

        test('should leave room successfully', () => {
            const result = roomManager.leaveRoom(playerId2);
            
            expect(result.room).toBe(room);
            expect(result.removed).toBe(true);
            expect(room.players.size).toBe(1);
            expect(roomManager.getPlayerRoom(playerId2)).toBe(null);
        });

        test('should delete room when last player leaves', () => {
            roomManager.leaveRoom(playerId2);
            const result = roomManager.leaveRoom(playerId1);
            
            expect(result.room).toBeDefined();
            expect(roomManager.getRoom(room.roomId)).toBe(undefined);
            expect(roomManager.getRoomByCode(room.roomCode)).toBe(null);
        });

        test('should return null if player not in room', () => {
            const result = roomManager.leaveRoom(playerId3);
            expect(result).toBe(null);
        });
    });

    describe('room retrieval', () => {
        let room1, room2;
        
        beforeEach(() => {
            room1 = roomManager.createRoom(playerId1, playerName1);
            room2 = roomManager.createRoom(playerId2, playerName2);
        });

        test('should get room by ID', () => {
            expect(roomManager.getRoom(room1.roomId)).toBe(room1);
            expect(roomManager.getRoom(room2.roomId)).toBe(room2);
        });

        test('should get room by code', () => {
            expect(roomManager.getRoomByCode(room1.roomCode)).toBe(room1);
            expect(roomManager.getRoomByCode(room2.roomCode)).toBe(room2);
        });

        test('should get player room', () => {
            expect(roomManager.getPlayerRoom(playerId1)).toBe(room1);
            expect(roomManager.getPlayerRoom(playerId2)).toBe(room2);
        });

        test('should return null for non-existent room', () => {
            expect(roomManager.getRoom('nonexistent')).toBe(undefined);
            expect(roomManager.getRoomByCode('INVALID')).toBe(null);
            expect(roomManager.getPlayerRoom('nonexistent')).toBe(null);
        });
    });

    describe('room statistics', () => {
        test('should return correct room stats', () => {
            const room1 = roomManager.createRoom(playerId1, playerName1);
            const room2 = roomManager.createRoom(playerId2, playerName2);
            roomManager.joinRoom(room1.roomCode, playerId3, playerName3);
            
            const stats = roomManager.getRoomStats();
            
            expect(stats.totalRooms).toBe(2);
            expect(stats.activeRooms).toBe(2);
            expect(stats.waitingRooms).toBe(1); // room2 has 1 player
            expect(stats.totalPlayers).toBe(3);
        });

        test('should get all rooms', () => {
            const room1 = roomManager.createRoom(playerId1, playerName1);
            const room2 = roomManager.createRoom(playerId2, playerName2);
            
            const allRooms = roomManager.getAllRooms();
            expect(allRooms).toHaveLength(2);
            expect(allRooms).toContain(room1);
            expect(allRooms).toContain(room2);
        });

        test('should get active rooms only', () => {
            const room1 = roomManager.createRoom(playerId1, playerName1);
            const room2 = roomManager.createRoom(playerId2, playerName2);
            room2.isActive = false;
            
            const activeRooms = roomManager.getActiveRooms();
            expect(activeRooms).toHaveLength(1);
            expect(activeRooms).toContain(room1);
            expect(activeRooms).not.toContain(room2);
        });
    });

    describe('room code validation', () => {
        test('should validate correct room codes', () => {
            expect(roomManager.isValidRoomCode('ABC123')).toBe(true);
            expect(roomManager.isValidRoomCode('XXXXXX')).toBe(true);
            expect(roomManager.isValidRoomCode('123456')).toBe(true);
        });

        test('should reject invalid room codes', () => {
            expect(roomManager.isValidRoomCode('abc123')).toBe(false); // lowercase
            expect(roomManager.isValidRoomCode('ABC12')).toBe(false); // too short
            expect(roomManager.isValidRoomCode('ABC1234')).toBe(false); // too long
            expect(roomManager.isValidRoomCode('ABC-12')).toBe(false); // invalid character
            expect(roomManager.isValidRoomCode('')).toBe(false); // empty
            expect(roomManager.isValidRoomCode(null)).toBe(false); // null
            expect(roomManager.isValidRoomCode(123456)).toBe(false); // number
        });
    });

    describe('cleanup', () => {
        test('should clean up all rooms', () => {
            roomManager.createRoom(playerId1, playerName1);
            roomManager.createRoom(playerId2, playerName2);
            
            expect(roomManager.getAllRooms()).toHaveLength(2);
            
            roomManager.cleanup();
            
            expect(roomManager.getAllRooms()).toHaveLength(0);
            expect(roomManager.getPlayerRoom(playerId1)).toBe(null);
            expect(roomManager.getPlayerRoom(playerId2)).toBe(null);
        });
    });

    describe('deleteRoom', () => {
        test('should delete room and clean up references', () => {
            const room = roomManager.createRoom(playerId1, playerName1);
            roomManager.joinRoom(room.roomCode, playerId2, playerName2);
            
            const deleted = roomManager.deleteRoom(room.roomId);
            
            expect(deleted).toBe(true);
            expect(roomManager.getRoom(room.roomId)).toBe(undefined);
            expect(roomManager.getRoomByCode(room.roomCode)).toBe(null);
            expect(roomManager.getPlayerRoom(playerId1)).toBe(null);
            expect(roomManager.getPlayerRoom(playerId2)).toBe(null);
        });

        test('should return false for non-existent room', () => {
            const deleted = roomManager.deleteRoom('nonexistent');
            expect(deleted).toBe(false);
        });
    });
});