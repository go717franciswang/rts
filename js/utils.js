var keycodes = {
    SHIFT: 16,
    a: 65,
};

var is_outside_view = function(x, y, view) {
    return x < 10 || x > view.width()-10 || y < 10 || y > view.height()-10;
};

var distance = function(x0, y0, x1, y1) {
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)) || 0;
};

var dist = function(pos_a, pos_b) {
    return distance(pos_a.x, pos_a.y, pos_b.x, pos_b.y);
};

var are_overlapping = function(a, b, distance) {
    return Math.abs(a.x-b.x) + Math.abs(a.y-b.y) < distance;
};

var unit_vector = function(x0, y0, x1, y1) {
    var d = distance(x0, y0, x1, y1);
    if (d == 0) {
        return { x: 0, y: 0 };
    } else {
        return { x: (x1-x0)/d, y: (y1-y0)/d };
    }
}

var move_vector = function(start_pos, direction, magnitude) {
    return { x: start_pos.x+direction.x*magnitude, y: start_pos.y+direction.y*magnitude };
};

var get_selected_element_by_click = function(x, y, elements) {
    var found = null;
    $.each(elements, function(k,v) {
        if (distance(x, y, v.position.x, v.position.y) <= v.size+10) {
            found = v;
            return false;
        }
    });

    return found;
};

var get_selected_elements_by_box = function(x0, y0, x1, y1, elements) {
    var start_x = Math.min(x0, x1);
    var end_x = Math.max(x0, x1);
    var start_y = Math.min(y0, y1);
    var end_y = Math.max(y0, y1);

    var is_in_selection = function(ele) {
        var x = ele.position.x;
        var y = ele.position.y;
        return start_x <= x && x <= end_x && start_y <= y && y <= end_y;
    };

    var selected = [];
    $.each(elements, function(k,v) {
        if (is_in_selection(v)) {
            selected.push(v);
        }
    });
    return selected;
};

var remove_selection_highlighting = function(ele) {
    ele.div.removeClass('selected');
};

var add_selection_higlighting = function(ele) {
    ele.div.addClass('selected');
};

var update_selections = function(cur_selections, new_selections) {
    $.each(cur_selections, function(k,v) {
        if (!new_selections[k]) {
            remove_selection_highlighting(v);
        }
    });

    $.each(new_selections, function(k,v) {
        if (!cur_selections[k]) {
            add_selection_higlighting(v);
        }
    });
};

var generate_fog_of_war = function(map, canvas) {
    var fog_size = 25;
    var w_count = Math.ceil(map.width / fog_size);
    var h_count = Math.ceil(map.height / fog_size);
    var fogs = [];
    var base = '<div class="fog" style="background: gray; position: absolute; z-index: 100; width: '+fog_size+'px; height: '+fog_size+'px"></div>';

    for (var i = 0; i < h_count; i++) {
        var row = [];
        var y = i * fog_size;

        for (var j = 0; j < w_count; j++) {
            var x = j * fog_size;
            var div = $(base).css({ top: y, left: x });
            div.appendTo(canvas);
            fogs.push({x: x+fog_size/2, y: y+fog_size/2, div: div});
        }
    }

    return {
        fogs: new kdTree(fogs, function(a,b) {
            return Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2);
        }, ["x", "y"]),
        hide_all: function() {
            $('.fog').show();
        },
        reveal_circle: function(position, radius) {
            var found = this.fogs.nearest(position, 1000, radius*radius);
            $.each(found, function(i, v) {
                var fog = v[0].div;
                fog.hide();
            });
        }
    };
};
