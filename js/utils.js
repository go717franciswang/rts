var keycodes = {
    SHIFT: 16,
    a: 65,
};

var isOutsideView = function(x, y, view) {
    return x < 10 || x > view.width()-10 || y < 10 || y > view.height()-10;
};

var distance = function(x0, y0, x1, y1) {
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)) || 0;
};

var dist = function(posA, posB) {
    return distance(posA.x, posA.y, posB.x, posB.y);
};

var areOverlapping = function(a, b, distance) {
    return Math.abs(a.x-b.x) + Math.abs(a.y-b.y) < distance;
};

var unitVector = function(x0, y0, x1, y1) {
    var d = distance(x0, y0, x1, y1);
    if (d == 0) {
        return { x: 0, y: 0 };
    } else {
        return { x: (x1-x0)/d, y: (y1-y0)/d };
    }
}

var moveVector = function(startPos, direction, magnitude) {
    return { x: startPos.x+direction.x*magnitude, y: startPos.y+direction.y*magnitude };
};

var getSelectedElementByClick = function(x, y, elements) {
    var found = null;
    $.each(elements, function(k,v) {
        if (distance(x, y, v.position.x, v.position.y) <= v.size+10) {
            found = v;
            return false;
        }
    });

    return found;
};

var getSelectedElementsByBox = function(x0, y0, x1, y1, elements) {
    var startX = Math.min(x0, x1);
    var endX = Math.max(x0, x1);
    var startY = Math.min(y0, y1);
    var endY = Math.max(y0, y1);

    var isInSelection = function(ele) {
        var x = ele.position.x;
        var y = ele.position.y;
        return startX <= x && x <= endX && startY <= y && y <= endY;
    };

    var selected = [];
    $.each(elements, function(k,v) {
        if (isInSelection(v)) {
            selected.push(v);
        }
    });
    return selected;
};

var removeSelectionHighlighting = function(ele) {
    ele.div.removeClass('selected');
};

var addSelectionHiglighting = function(ele) {
    ele.div.addClass('selected');
};

var updateSelections = function(curSelections, newSelections) {
    $.each(curSelections, function(k,v) {
        if (!newSelections[k]) {
            removeSelectionHighlighting(v);
        }
    });

    $.each(newSelections, function(k,v) {
        if (!curSelections[k]) {
            addSelectionHiglighting(v);
        }
    });
};

var generateFogOfWar = function(map, canvas) {
    var fogSize = 25;
    var wCount = Math.ceil(map.width / fogSize);
    var hCount = Math.ceil(map.height / fogSize);
    var fogs = [];
    var base = '<div class="fog" style="background: gray; position: absolute; z-index: 100; width: '+fogSize+'px; height: '+fogSize+'px"></div>';

    for (var i = 0; i < hCount; i++) {
        var row = [];
        var y = i * fogSize;

        for (var j = 0; j < wCount; j++) {
            var x = j * fogSize;
            var div = $(base).css({ top: y, left: x });
            div.appendTo(canvas);
            fogs.push({x: x+fogSize/2, y: y+fogSize/2, div: div});
        }
    }

    return {
        fogs: new kdTree(fogs, function(a,b) {
            return Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2);
        }, ["x", "y"]),
        hideAll: function() {
            $('.fog').show();
        },
        revealCircle: function(position, radius) {
            var found = this.fogs.nearest(position, 1000, radius*radius);
            $.each(found, function(i, v) {
                var fog = v[0].div;
                fog.hide();
            });
        }
    };
};
