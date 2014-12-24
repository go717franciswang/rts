var bond_player = function(f, player_id) {
    return function() { 
        return f(player_id);
    };
};

var Buildings = {
    base_building: function() {
        return {
            size: 20,
            health: 1000,
            cost: 200,
            vision: 100,
            is_indestructible: false,
            resource: 0,
            produces: [],
            player_id: -1,
        };
    },
    town: function(player_id) {
        var b = Buildings.base_building();
        b.produces.push(bond_player(Units.worker, player_id));
        b.player_id = player_id;
        return b;
    },
    barrack: function(player_id) {
        var b = Buildings.base_building();
        b.produces.push(bond_player(Units.melee, player_id));
        b.produces.push(bond_player(Units.range, player_id));
        b.player_id = player_id;
        return b;
    },
    mine: function() {
        var b = Buildings.base_building();
        b.is_indestructible = true;
        b.resource = 2000;
        return b;
    },
};
