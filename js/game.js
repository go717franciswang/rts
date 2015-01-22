// game setting
var canvas = $('#canvas');
var map = {width: 1000, height: 500};
canvas.css({width: map.width, height: map.height});
var view = $('#view');
var scroll_rate = 20;
var mouse_x, mouse_y;
var offscreen_border = 100;
var scroll_trigger_border = 50;
var last_game_element_id = -1;
var frame_ms = 100;
var frame_instruction_delay = 2;
var hotkeys = {
    multi_select: keycodes.SHIFT,
    action: keycodes.a,
};
var bitmap_scale = 10;

// game setup
var update_screen_size = function() {
    var w = $(window);
    view.css({width: w.width()-20, height: w.height()-20});
};
update_screen_size();
$(window).resize(update_screen_size);

// in-game variables
var offset = {x: 0, y: 0};
var shift_down = false;
var frames = new Array(frame_instruction_delay);
var current_frame_id;
var game_elements = {};
var selections = {};
var scroll_timer;
var player_colors = { '-1': 'green', '0': 'red', '1': 'blue' };
var awaiting_instruction = false;
var player_id = 0;
var live_element_count = 0;

var fog_of_war = generate_fog_of_war(map, canvas);

var add_game_element = function(position, element) {
    var div = $('<div style="position: absolute; z-index: 10"></div>').css({
        top: position.y-element.size,
        left: position.x-element.size,
        height: element.size*2,
        width: element.size*2,
        background: player_colors[element.player_id],
    });
    element.id = ++last_game_element_id;
    live_element_count++;
    element.div = div;
    element.position = position;
    game_elements[element.id] = element;
    div.appendTo(canvas);
};

var update_position = function(position, element) {
    element.position = position;
    element.div.css({
        top: position.y-element.size,
        left: position.x-element.size,
    });
};

var push_to_frame = function(subject_id, verb, object) {
    frames[current_frame_id + frame_instruction_delay].push([subject_id, verb, object]);
};

add_game_element({x: 200, y: 200}, Buildings.town(0));
add_game_element({x: 170, y: 350}, Units.worker(0));
add_game_element({x: 240, y: 350}, Units.worker(0));
add_game_element({x: 700, y: 350}, Units.worker(1));

canvas.on('mousedown', function(e) {
    var x0 = e.pageX-offset.x;
    var y0 = e.pageY-offset.y;

    if (awaiting_instruction) {
        var target = get_selected_element_by_click(x0, y0, game_elements);
        $.each(selections, function(k,v) {
            if (v.player_id != player_id) return;

            if (target) {
                push_to_frame(k, 'attack', { id: target.id });
            } else {
                push_to_frame(k, 'attack', { position: { x: x0, y: y0 } });
            }
        });

        canvas.css('cursor', 'default');
        awaiting_instruction = false;
        return;
    }

    canvas.one('mouseup', function(e) {
        // when user is holding the shift key, start off with current selection
        var elements = shift_down ? $.extend({}, selections) : {};
        var x1 = e.pageX-offset.x;
        var y1 = e.pageY-offset.y;

        // click
        if (distance(x0, y0, x1, y1) < 10) {
            var element = get_selected_element_by_click(x0, y0, game_elements);
            if (element) {
                elements[element.id] = element;
            } 
        // box
        } else {
            $.each(get_selected_elements_by_box(x0, y0, x1, y1, game_elements), function(k,v) {
                elements[v.id] = v;
            });
        }

        if ($.isEmptyObject(elements)) {
            return;
        }

        update_selections(selections, elements);
        selections = elements;
    });
});

$(window).on('mousemove', function(e) {
    mouse_x = e.pageX;
    mouse_y = e.pageY;
    if (is_outside_view(mouse_x, mouse_y, view)) {
        if (!scroll_timer) {
            scroll_timer = setInterval(function() {
                if (mouse_x < scroll_trigger_border && offset.x < offscreen_border) {
                    offset.x += scroll_rate;
                } else if (mouse_x > view.width()-scroll_trigger_border && 
                           offset.x > -(map.width+offscreen_border-view.width())) {
                    offset.x -= scroll_rate;
                } else if (mouse_y < scroll_trigger_border && offset.y < offscreen_border) {
                    offset.y += scroll_rate;
                } else if (mouse_y > view.height()-scroll_trigger_border && 
                           offset.y > -(map.height+offscreen_border-view.height())) {
                    offset.y -= scroll_rate;
                }
                canvas.css({top: offset.y, left: offset.x});
            }, 20);
        }
    } else {
        clearInterval(scroll_timer);
        scroll_timer = null;
    }
});

$(window).on('keydown', function(e) {
    if (e.keyCode == hotkeys.multi_select) {
        shift_down = true;
    } else if (e.keyCode == hotkeys.action) {
        if (!$.isEmptyObject(selections)) {
            canvas.css('cursor', 'pointer');
            awaiting_instruction = true;
        }
    }
});

$(window).on('keyup', function(e) {
    if (e.keyCode == hotkeys.multi_select) {
        shift_down = false;
    }
});

var attack_element = function(element, attack_amount) {
    element.health -= attack_amount;
    element.div.css({ opacity: element.health / element.max_health });
};

var consume_frame = function(frame_id) {
    if (frame_id % 100 == 0) {
        console.log('consuming frame: ' + frame_id);
    }

    current_frame_id = frame_id;
    var elements_to_delete = [];

    // execute frame instructions
    if (frames[frame_id]) {
        $.each(frames[frame_id], function(k, instructions) {
            console.log(instructions);
            var subject_id = instructions[0];
            var verb = instructions[1];
            var object = instructions[2];

            if (game_elements[subject_id] && verb == 'attack') {
                game_elements[subject_id].target = object;
            }
        });
    }

    // create map occupancy
    var map_occupancy = new kdTree($.map(game_elements, function(e) { return e; }), function(a,b) {
        return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
    }, ["position.x", "position.y"]);

    fog_of_war.hide_all();

    // update view
    $.each(game_elements, function(k, element) {
        if (element.target && element.movement_speed) {
            var target = element.target;
            var made_action = false;

            // target no longer exist
            if (target.id && game_elements[target.id] == undefined) {
                delete element.target;
            } else {

                // target is an absolute point, and enemy around
                if (target.position) {
                    var neighbors = map_occupancy.nearest(element.position, Math.min(5, live_element_count));
                    $.each(neighbors, function(i, n) {
                        var e = n[0];
                        if (e.player_id != player_id 
                            && dist(element.position, e.position) < element.attack_range+element.size+e.size) {
                            attack_element(e, element.attack);
                            made_action = true;

                            if (e.health < 0) {
                                elements_to_delete.push(e.id);
                            }
                            return false;
                        }
                    });
                } else if (target.player_id != player_id) {
                // target is specific game object, and is around
                    var neighbors = map_occupancy.nearest(element.position, Math.min(5, live_element_count));
                    $.each(neighbors, function(i, n) {
                        var e = n[0];
                        if (e.id == target.id) {
                            if (dist(element.position, e.position) < element.attack_range+element.size+e.size) {
                                attack_element(e, element.attack);
                                if (e.health < 0) {
                                    elements_to_delete.push(e.id);
                                }
                                made_action = true;
                                return false;
                            }
                        }
                    });
                }

                if (!made_action) {
                    var target_position;
                    if (target.position) {
                        target_position = target.position
                    } else {
                        target_position = game_elements[target.id].position;
                    } 

                    var d = distance(element.position.x, element.position.y, target_position.x, target_position.y);
                    var delta = Math.min(d, element.movement_speed);
                    var direction = unit_vector(element.position.x, element.position.y, target_position.x, target_position.y);
                    var new_pos = move_vector(element.position, direction, delta);

                    var neighbors = map_occupancy.nearest(new_pos, Math.min(5, live_element_count));
                    var occupied = false;
                    $.each(neighbors, function(i, n) {
                        var e = n[0];
                        if (e.id != element.id && are_overlapping(e.position, new_pos, e.size+element.size)) {
                            occupied = true;
                            return;
                        }
                    });

                    if (!occupied) {
                        update_position(new_pos, element);
                    }
                }
            }
        }

        if (element.player_id == player_id) {
            fog_of_war.reveal_circle(element.position, element.vision);
        }
    });
    
    $.each(elements_to_delete.sort().reverse(), function(i, id) {
        delete game_elements[id];
        live_element_count--;
    });

    frames.push([]);
    setTimeout(function() { consume_frame(frame_id+1) }, frame_ms);
};

consume_frame(0);

