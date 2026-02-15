const crypto = require('crypto');

class User {
    constructor(id, username, passwordHash, spPoints = 0, mpScore = 0) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.spPoints = spPoints;      // Single-player points
        this.mpScore = mpScore;         // Multiplayer score (can be negative)
        this.joinDate = new Date();
        this.updatedDate = new Date();
    }

    static hashPassword(password) {
        return crypto
            .createHash('sha256')
            .update(password + 'rock-paper-scissors-salt')
            .digest('hex');
    }

    static verifyPassword(password, hash) {
        const computedHash = User.hashPassword(password);
        return computedHash === hash;
    }

    updateStats(spPoints, mpScore) {
        this.spPoints = Math.max(0, spPoints); // Prevent negative SP points
        this.mpScore = mpScore;                 // MP score can be negative
        this.updatedDate = new Date();
    }

    addSpPoints(points) {
        this.spPoints += points;
        this.updatedDate = new Date();
    }

    addMpScore(points) {
        this.mpScore += points;
        this.updatedDate = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            spPoints: this.spPoints,
            mpScore: this.mpScore,
            joinDate: this.joinDate,
            updatedDate: this.updatedDate
        };
    }
}

module.exports = User;
