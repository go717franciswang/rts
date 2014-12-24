var canvas = $('.canvas');

var update_screen_size = function() {
    var w = $(window);
    canvas.css({width: w.width()-20, height: w.height()-20});
};

update_screen_size();
$(window).resize(update_screen_size);

var game_elements = [];

var game_element = {
    position: {
        x: 100,
        y: 100,
    },
    div: $('<div></div>').css({
        position: 'absolute',
        top: 100,
        left: 100,
        height: 25,
        width: 25,
        background: 'red'
    }),
};
game_elements.push(game_element);

game_element.div.appendTo(canvas);
    
