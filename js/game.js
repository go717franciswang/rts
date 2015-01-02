// game setting
var canvas = $('#canvas');
var map = {width: 3000, height: 3000};
canvas.css({width: map.width, height: map.height});
var view = $('#view');
var scroll_rate = 20;
var mouse_x, mouse_y;
var offscreen_border = 100;
var scroll_trigger_border = 50;
var last_game_element_id = 0;
var frame_ms = 100;
var hotkeys = {
    multi_select: keycodes.SHIFT,
    action: keycodes.a,
};

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
var frames = [];
var game_elements = {};
var selections = {};
var scroll_timer;
var player_colors = { '-1': 'green', '0': 'red', '1': 'blue' };
var awaiting_instruction = false;

var add_game_element = function(position, element) {
    var div = $('<div></div>').css({
        position: 'absolute',
        top: position.y-element.size,
        left: position.x-element.size,
        height: element.size*2,
        width: element.size*2,
        background: player_colors[element.player_id],
    });
    element.id = ++last_game_element_id;
    element.div = div;
    element.position = position;
    game_elements[element.id] = element;
    div.appendTo(canvas);
};

add_game_element({x: 100, y: 100}, Units.worker(0));
add_game_element({x: 120, y: 100}, Units.worker(0));
add_game_element({x: 100, y: 50}, Buildings.town(0));

canvas.on('mousedown', function(e) {
    var x0 = e.pageX-offset.x;
    var y0 = e.pageY-offset.y;

    if (awaiting_instruction) {
        var target = get_selected_element_by_click(x0, y0, game_elements);
        $.each(game_elements, function(k,v) {
            if (target) {
                v.target = target;
            } else {
                v.target = { position: { x: x0, y: y0 } };
            }
        });

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
            awaiting_instruction = true;
        }
    }
});

$(window).on('keyup', function(e) {
    if (e.keyCode == hotkeys.multi_select) {
        shift_down = false;
    }
});
