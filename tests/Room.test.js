const Room = require('../server/Room');

describe('Room', () => {
    let room;
    const playerId1 = 'player1';
    const playerId2 = 'player2';
    const playerName1 = 'Alice';
    const playerName2 = 'Bob';

    beforeEach(() => {
        room = new Room(playerId1, playerName1);
    });

    describe('constructor', () => {
        test('should create a room with valid properties', () => {
            expect(room.roomId).toBeDefined();
            expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/);
            expect(room.players.size).toBe(1);
            expect(room.maxPlayers).toBe(2);
            expect(room.isActive).toBe(true);
            expect(room.status).toBe('waiting');
        });

        test('should add creator as first player', () => {
            const player = room.getPlayer(playerId1);
            expect(player).toBeDefined();
            expect(player.name).toBe(playerName1);
            expect(player.id).toBe(playerId1);
            expect(player.score).toBe(0);
        });
    });

    describe('addPlayer', () => {
        test('should add a second player successfully', () => {
            const player = room.addPlayer(playerId2, playerName2);
            
            expect(player.id).toBe(playerId2);
            expect(player.name).toBe(playerName2);
            expect(room.players.size).toBe(2);
            expect(room.status).toBe('ready');
        });

        test('should throw error when room is full', () => {
            room.addPlayer(playerId2, playerName2);
            
            expect(() => {
                room.addPlayer('player3', 'Charlie');
            }).toThrow('Room is full');
        });

        test('should throw error when player already exists', () => {
            expect(() => {
                room.addPlayer(playerId1, 'Duplicate');
            }).toThrow('Player already in room');
        });
    });

    describe('removePlayer', () => {
        test('should remove player successfully', () => {
            const removed = room.removePlayer(playerId1);
            
            expect(removed).toBe(true);
            expect(room.players.size).toBe(0);
            expect(room.isActive).toBe(false);
        });

        test('should return false for non-existent player', () => {
            const removed = room.removePlayer('nonexistent');
            expect(removed).toBe(false);
        });

        test('should update status when room becomes not full', () => {
            room.addPlayer(playerId2, playerName2);
            expect(room.status).toBe('ready');
            
            room.removePlayer(playerId2);
            expect(room.status).toBe('waiting');
        });
    });

    describe('room state checks', () => {
        test('should correctly identify full room', () => {
            expect(room.isFull()).toBe(false);
            
            room.addPlayer(playerId2, playerName2);
            expect(room.isFull()).toBe(true);
        });

        test('should correctly identify empty room', () => {
            expect(room.isEmpty()).toBe(false);
            
            room.removePlayer(playerId1);
            expect(room.isEmpty()).toBe(true);
        });

        test('should correctly identify if room can start', () => {
            expect(room.canStart()).toBe(false);
            
            room.addPlayer(playerId2, playerName2);
            expect(room.canStart()).toBe(true);
        });
    });

    describe('player moves', () => {
        beforeEach(() => {
            room.addPlayer(playerId2, playerName2);
        });

        test('should set valid player moves', () => {
            expect(room.setPlayerMove(playerId1, 'rock')).toBe(true);
            expect(room.setPlayerMove(playerId2, 'paper')).toBe(true);
            
            const player1 = room.getPlayer(playerId1);
            const player2 = room.getPlayer(playerId2);
            
            expect(player1.currentMove).toBe('rock');
            expect(player2.currentMove).toBe('paper');
        });

        test('should reject invalid moves', () => {
            expect(room.setPlayerMove(playerId1, 'invalid')).toBe(false);
            expect(room.setPlayerMove('nonexistent', 'rock')).toBe(false);
        });

        test('should clear all player moves', () => {
            room.setPlayerMove(playerId1, 'rock');
            room.setPlayerMove(playerId2, 'paper');
            
            room.clearPlayerMoves();
            
            const player1 = room.getPlayer(playerId1);
            const player2 = room.getPlayer(playerId2);
            
            expect(player1.currentMove).toBe(null);
            expect(player2.currentMove).toBe(null);
        });

        test('should check if all players have submitted moves', () => {
            expect(room.haveAllPlayersSubmittedMoves()).toBe(false);
            
            room.setPlayerMove(playerId1, 'rock');
            expect(room.haveAllPlayersSubmittedMoves()).toBe(false);
            
            room.setPlayerMove(playerId2, 'paper');
            expect(room.haveAllPlayersSubmittedMoves()).toBe(true);
        });
    });

    describe('scoring', () => {
        beforeEach(() => {
            room.addPlayer(playerId2, playerName2);
        });

        test('should update player scores', () => {
            expect(room.updatePlayerScore(playerId1, 1)).toBe(1);
            expect(room.updatePlayerScore(playerId1, 2)).toBe(3);
            
            const player1 = room.getPlayer(playerId1);
            expect(player1.score).toBe(3);
        });

        test('should return null for invalid player', () => {
            expect(room.updatePlayerScore('nonexistent', 1)).toBe(null);
        });

        test('should determine winner correctly', () => {
            room.updatePlayerScore(playerId1, 3);
            room.updatePlayerScore(playerId2, 1);
            
            const winner = room.getWinner();
            expect(winner.id).toBe(playerId1);
        });

        test('should return null for tie', () => {
            room.updatePlayerScore(playerId1, 2);
            room.updatePlayerScore(playerId2, 2);
            
            const winner = room.getWinner();
            expect(winner).toBe(null);
        });
    });

    describe('ready status', () => {
        beforeEach(() => {
            room.addPlayer(playerId2, playerName2);
        });

        test('should set player ready status', () => {
            expect(room.setPlayerReady(playerId1, true)).toBe(true);
            expect(room.setPlayerReady(playerId2, true)).toBe(true);
            
            const player1 = room.getPlayer(playerId1);
            const player2 = room.getPlayer(playerId2);
            
            expect(player1.isReady).toBe(true);
            expect(player2.isReady).toBe(true);
        });

        test('should check if all players are ready', () => {
            expect(room.areAllPlayersReady()).toBe(false);
            
            room.setPlayerReady(playerId1, true);
            expect(room.areAllPlayersReady()).toBe(false);
            
            room.setPlayerReady(playerId2, true);
            expect(room.areAllPlayersReady()).toBe(true);
        });
    });

    describe('toJSON', () => {
        test('should return valid JSON representation', () => {
            const json = room.toJSON();
            
            expect(json).toHaveProperty('roomId');
            expect(json).toHaveProperty('roomCode');
            expect(json).toHaveProperty('players');
            expect(json).toHaveProperty('maxPlayers');
            expect(json).toHaveProperty('status');
            expect(json).toHaveProperty('isActive');
            expect(json).toHaveProperty('createdAt');
            expect(json).toHaveProperty('playerCount');
            
            expect(json.playerCount).toBe(1);
            expect(Array.isArray(json.players)).toBe(true);
        });
    });

    describe('validation', () => {
        test('should validate room state correctly', () => {
            expect(room.isValid()).toBe(true);
            
            room.isActive = false;
            expect(room.isValid()).toBe(false);
        });
    });
});