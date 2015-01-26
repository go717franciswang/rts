var bondPlayer = function(f, playerId) {
    return function() { 
        return f(playerId);
    };
};

var Buildings = {
    baseBuilding: function() {
        return {
            size: 100,
            health: 1000,
            maxHealth: 1000,
            cost: 200,
            vision: 400,
            isIndestructible: false,
            resource: 0,
            produces: [],
            playerId: -1,
        };
    },
    town: function(playerId) {
        var b = Buildings.baseBuilding();
        b.produces.push(bondPlayer(Units.worker, playerId));
        b.playerId = playerId;
        return b;
    },
    barrack: function(playerId) {
        var b = Buildings.baseBuilding();
        b.produces.push(bondPlayer(Units.melee, playerId));
        b.produces.push(bondPlayer(Units.range, playerId));
        b.playerId = playerId;
        return b;
    },
    mine: function() {
        var b = Buildings.baseBuilding();
        b.isIndestructible = true;
        b.resource = 2000;
        return b;
    },
};
