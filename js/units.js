var Units = {
    baseUnit: function() {
        return {
            size: 20,
            attack: 5,
            health: 100,
            maxHealth: 100,
            attackRange: 10,
            canGatherResource: false,
            resourceGatherRate: 10,
            vision: 200,
            movementSpeed: 15,
            cost: 50,
            playerId: -1,
        };
    },
    worker: function(playerId) {
        var u = Units.baseUnit();
        u.canGatherResource = true;
        u.playerId = playerId;
        return u;
    },
    melee: function(playerId) {
        var u = Units.baseUnit();
        u.attack = 25;
        u.health = 200;
        u.maxHealth = 200;
        u.cost = 100;
        u.playerId = playerId;
        return u;
    },
    range: function(playerId) {
        var u = Units.baseUnit();
        u.attack = 15;
        u.attackRange = 80;
        u.cost = 150;
        u.playerId = playerId;
        return u;
    },
};
    
