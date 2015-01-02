var canvas = $('#canvas');
var view = $('#view');
var scroll_rate = 20;
var offset = {x: 0, y: 0};
var mouse_x, mouse_y;
var scroll_timer;
var map = {width: 3000, height: 3000};
var offscreen_border = 100;
var scroll_trigger_border = 50;

canvas.css({width: map.width, height: map.height});

var update_screen_size = function() {
    var w = $(window);
    view.css({width: w.width()-20, height: w.height()-20});
};

update_screen_size();
$(window).resize(update_screen_size);

var game_elements = [];
var player_colors = { '-1': 'green', '0': 'red', '1': 'blue' };

var add_game_element = function(position, element) {
    var div = $('<div></div>').css({
        position: 'absolute',
        top: position.y-element.size,
        left: position.x-element.size,
        height: element.size*2,
        width: element.size*2,
        background: player_colors[element.player_id],
    });
    element.div = div;
    element.position = position;
    game_elements.push(element);
    div.appendTo(canvas);
};

add_game_element({x: 100, y: 100}, Units.worker(0));
add_game_element({x: 120, y: 100}, Units.worker(0));
add_game_element({x: 100, y: 50}, Buildings.town(0));

var selections = [];

canvas.on('mousedown', function(e) {
    var x0 = e.pageX-offset.x;
    var y0 = e.pageY-offset.y;

    canvas.one('mouseup', function(e) {
        var elements = [];
        var x1 = e.pageX-offset.x;
        var y1 = e.pageY-offset.y;

        // click
        if (distance(x0, y0, x1, y1) < 10) {
            var element = get_selected_element_by_click(x0, y0, game_elements);
            if (element) {
                elements.push(element);
            } 
        // box
        } else {
            elements = get_selected_elements_by_box(x0, y0, x1, y1, game_elements);
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
