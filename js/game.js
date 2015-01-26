// game setting
var canvas = $('#canvas');
var map = {width: 1000, height: 500};
canvas.css({width: map.width, height: map.height});
var view = $('#view');
var scrollRate = 20;
var mouseX, mouseY;
var offscreenBorder = 100;
var scrollTriggerBorder = 50;
var lastGameElementId = -1;
var frameMs = 100;
var frameInstructionDelay = 2;
var hotkeys = {
    multiSelect: keycodes.SHIFT,
    action: keycodes.a,
};
var bitmapScale = 10;

// game setup
var updateScreenSize = function() {
    var w = $(window);
    view.css({width: w.width()-20, height: w.height()-20});
};
updateScreenSize();
$(window).resize(updateScreenSize);

// in-game variables
var offset = {x: 0, y: 0};
var shiftDown = false;
var frames = new Array(frameInstructionDelay);
var currentFrameId;
var gameElements = {};
var selections = {};
var scrollTimer;
var playerColors = { '-1': 'green', '0': 'red', '1': 'blue' };
var awaitingInstruction = false;
var playerId = 0;
var liveElementCount = 0;

var fogOfWar = generateFogOfWar(map, canvas);

var addGameElement = function(position, element) {
    var div = $('<div style="position: absolute; z-index: 10"></div>').css({
        top: position.y-element.size,
        left: position.x-element.size,
        height: element.size*2,
        width: element.size*2,
        background: playerColors[element.playerId],
    });
    element.id = ++lastGameElementId;
    liveElementCount++;
    element.div = div;
    element.position = position;
    gameElements[element.id] = element;
    div.appendTo(canvas);
};

var updatePosition = function(position, element) {
    element.position = position;
    element.div.css({
        top: position.y-element.size,
        left: position.x-element.size,
    });
};

var pushToFrame = function(subjectId, verb, object) {
    frames[currentFrameId + frameInstructionDelay].push([subjectId, verb, object]);
};

addGameElement({x: 200, y: 200}, Buildings.town(0));
addGameElement({x: 170, y: 350}, Units.worker(0));
addGameElement({x: 240, y: 350}, Units.worker(0));
addGameElement({x: 700, y: 350}, Units.worker(1));

canvas.on('mousedown', function(e) {
    var x0 = e.pageX-offset.x;
    var y0 = e.pageY-offset.y;

    if (awaitingInstruction) {
        var target = getSelectedElementByClick(x0, y0, gameElements);
        $.each(selections, function(k,v) {
            if (v.playerId != playerId) return;

            if (target) {
                pushToFrame(k, 'attack', { id: target.id });
            } else {
                pushToFrame(k, 'attack', { position: { x: x0, y: y0 } });
            }
        });

        canvas.css('cursor', 'default');
        awaitingInstruction = false;
        return;
    }

    canvas.one('mouseup', function(e) {
        // when user is holding the shift key, start off with current selection
        var elements = shiftDown ? $.extend({}, selections) : {};
        var x1 = e.pageX-offset.x;
        var y1 = e.pageY-offset.y;

        // click
        if (distance(x0, y0, x1, y1) < 10) {
            var element = getSelectedElementByClick(x0, y0, gameElements);
            if (element) {
                elements[element.id] = element;
            } 
        // box
        } else {
            $.each(getSelectedElementsByBox(x0, y0, x1, y1, gameElements), function(k,v) {
                elements[v.id] = v;
            });
        }

        if ($.isEmptyObject(elements)) {
            return;
        }

        updateSelections(selections, elements);
        selections = elements;
    });
});

$(window).on('mousemove', function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    if (isOutsideView(mouseX, mouseY, view)) {
        if (!scrollTimer) {
            scrollTimer = setInterval(function() {
                if (mouseX < scrollTriggerBorder && offset.x < offscreenBorder) {
                    offset.x += scrollRate;
                } else if (mouseX > view.width()-scrollTriggerBorder && 
                           offset.x > -(map.width+offscreenBorder-view.width())) {
                    offset.x -= scrollRate;
                } else if (mouseY < scrollTriggerBorder && offset.y < offscreenBorder) {
                    offset.y += scrollRate;
                } else if (mouseY > view.height()-scrollTriggerBorder && 
                           offset.y > -(map.height+offscreenBorder-view.height())) {
                    offset.y -= scrollRate;
                }
                canvas.css({top: offset.y, left: offset.x});
            }, 20);
        }
    } else {
        clearInterval(scrollTimer);
        scrollTimer = null;
    }
});

$(window).on('keydown', function(e) {
    if (e.keyCode == hotkeys.multiSelect) {
        shiftDown = true;
    } else if (e.keyCode == hotkeys.action) {
        if (!$.isEmptyObject(selections)) {
            canvas.css('cursor', 'pointer');
            awaitingInstruction = true;
        }
    }
});

$(window).on('keyup', function(e) {
    if (e.keyCode == hotkeys.multiSelect) {
        shiftDown = false;
    }
});

var attackElement = function(element, attackAmount) {
    element.health -= attackAmount;
    element.div.css({ opacity: element.health / element.maxHealth });
};

var consumeFrame = function(frameId) {
    if (frameId % 100 == 0) {
        console.log('consuming frame: ' + frameId);
    }

    currentFrameId = frameId;
    var elementsToDelete = [];

    // execute frame instructions
    if (frames[frameId]) {
        $.each(frames[frameId], function(k, instructions) {
            console.log(instructions);
            var subjectId = instructions[0];
            var verb = instructions[1];
            var object = instructions[2];

            if (gameElements[subjectId] && verb == 'attack') {
                gameElements[subjectId].target = object;
            }
        });
    }

    // create map occupancy
    var mapOccupancy = new kdTree($.map(gameElements, function(e) { return e; }), function(a,b) {
        return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
    }, ["position.x", "position.y"]);

    fogOfWar.hideAll();

    // update view
    $.each(gameElements, function(k, element) {
        if (element.target && element.movementSpeed) {
            var target = element.target;
            var madeAction = false;

            // target no longer exist
            if (target.id && gameElements[target.id] == undefined) {
                delete element.target;
            } else {

                // target is an absolute point, and enemy around
                if (target.position) {
                    var neighbors = mapOccupancy.nearest(element.position, Math.min(5, liveElementCount));
                    $.each(neighbors, function(i, n) {
                        var e = n[0];
                        if (e.playerId != playerId 
                            && dist(element.position, e.position) < element.attackRange+element.size+e.size) {
                            attackElement(e, element.attack);
                            madeAction = true;

                            if (e.health < 0) {
                                elementsToDelete.push(e.id);
                            }
                            return false;
                        }
                    });
                } else if (target.playerId != playerId) {
                // target is specific game object, and is around
                    var neighbors = mapOccupancy.nearest(element.position, Math.min(5, liveElementCount));
                    $.each(neighbors, function(i, n) {
                        var e = n[0];
                        if (e.id == target.id) {
                            if (dist(element.position, e.position) < element.attackRange+element.size+e.size) {
                                attackElement(e, element.attack);
                                if (e.health < 0) {
                                    elementsToDelete.push(e.id);
                                }
                                madeAction = true;
                                return false;
                            }
                        }
                    });
                }

                if (!madeAction) {
                    var targetPosition;
                    if (target.position) {
                        targetPosition = target.position
                    } else {
                        targetPosition = gameElements[target.id].position;
                    } 

                    var d = distance(element.position.x, element.position.y, targetPosition.x, targetPosition.y);
                    var delta = Math.min(d, element.movementSpeed);
                    var direction = unitVector(element.position.x, element.position.y, targetPosition.x, targetPosition.y);
                    var newPos = moveVector(element.position, direction, delta);

                    var neighbors = mapOccupancy.nearest(newPos, Math.min(5, liveElementCount));
                    var occupied = false;
                    $.each(neighbors, function(i, n) {
                        var e = n[0];
                        if (e.id != element.id && areOverlapping(e.position, newPos, e.size+element.size)) {
                            occupied = true;
                            return;
                        }
                    });

                    if (!occupied) {
                        updatePosition(newPos, element);
                    }
                }
            }
        }

        if (element.playerId == playerId) {
            fogOfWar.revealCircle(element.position, element.vision);
        }
    });
    
    $.each(elementsToDelete.sort().reverse(), function(i, id) {
        delete gameElements[id];
        liveElementCount--;
    });

    frames.push([]);
    setTimeout(function() { consumeFrame(frameId+1) }, frameMs);
};

consumeFrame(0);

