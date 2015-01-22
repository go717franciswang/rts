var Units = {
    base_unit: function() {
        return {
            size: 20,
            attack: 5,
            health: 100,
            max_health: 100,
            attack_range: 10,
            can_gather_resource: false,
            resource_gather_rate: 10,
            vision: 200,
            movement_speed: 15,
            cost: 50,
            player_id: -1,
        };
    },
    worker: function(player_id) {
        var u = Units.base_unit();
        u.can_gather_resource = true;
        u.player_id = player_id;
        return u;
    },
    melee: function(player_id) {
        var u = Units.base_unit();
        u.attack = 25;
        u.health = 200;
        u.max_health = 200;
        u.cost = 100;
        u.player_id = player_id;
        return u;
    },
    range: function(player_id) {
        var u = Units.base_unit();
        u.attack = 15;
        u.attack_range = 80;
        u.cost = 150;
        u.player_id = player_id;
        return u;
    },
};
    
