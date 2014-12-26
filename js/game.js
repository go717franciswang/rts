var canvas = $('.canvas');

var update_screen_size = function() {
    var w = $(window);
    canvas.css({width: w.width()-20, height: w.height()-20});
};

update_screen_size();
$(window).resize(update_screen_size);

var game_elements = [];
var player_colors = { '-1': 'green', '0': 'red', '1': 'blue' };

var add_game_element = function(position, element) {
    var div = $('<div></div>').css({
        position: 'absolute',
        top: position.x,
        left: position.y,
        height: element.size,
        width: element.size,
        background: player_colors[element.player_id],
    });
    game_elements.push(element);
    div.appendTo(canvas);
};

add_game_element({x: 100, y: 100}, Units.worker(0));
