var is_outside_view = function(x, y, view) {
    return x < 10 || x > view.width()-10 || y < 10 || y > view.height()-10;
};

var distance = function(x0, y0, x1, y1) {
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
};

var get_selected_element_by_click = function(x, y, elements) {
    for (var i = 0; i < elements.length; i++) {
        var e = elements[i];
        if (distance(x, y, e.position.x, e.position.y) <= e.size+10) {
            return e;
        }
    }

    return null;
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

    var selected = elements.filter(is_in_selection);
    return selected;
};

var remove_selection_highlighting = function(ele) {
    ele.div.removeClass('selected');
};

var add_selection_higlighting = function(ele) {
    ele.div.addClass('selected');
};

var update_selections = function(cur_selections, new_selections) {
    cur_selections.map(remove_selection_highlighting);
    new_selections.map(add_selection_higlighting);
};
