var Bitmask = function(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint32Array(height * Math.ceil(width / 32));
    this.idx = function(x, y) {
        return y+Math.floor(x/32);
    };
};

Bitmask.prototype.get = function(x, y) {
    return (this.data[this.idx(x,y)] << (x%32)) & 1;
};

Bitmask.prototype.set = function(x, y, bit) {
    var i = this.idx(x,y);
    var v = this.data[i];
    if (bit) {
        this.data[i] = v | (1 << (31-x%32));
    } else {
        this.data[i] = v & (~(1 << (31-x%32)));
    }
};

var ScaledBitmask = function(width, height, scaling_factor) {
    this.width = width;
    this.height = height;
    this.scaling_factor = scaling_factor;
    this.bitmask = new Bitmask(Math.ceil(width/scaling_factor), Math.ceil(height/scaling_factor));
};

ScaledBitmask.prototype.get = function(x, y) {
    return this.bitmask.get(Math.round(x/this.scaling_factor), Math.round(y/this.scaling_factor));
};

ScaledBitmask.prototype.set = function(x, y, bit) {
    this.bitmask.set(Math.round(x/this.scaling_factor), Math.round(y/this.scaling_factor), 1);
};

ScaledBitmask.prototype.set_area = function(x, y, bit, size) {
    var x_ = Math.round(x/this.scaling_factor);
    var y_ = Math.round(y/this.scaling_factor);
    var scaled_size = Math.round(size/this.scaled_size);

    for (var dx = -scaled_size; dx <= scaled_size; dx++) {
        var x__ = x_ + dx;
        if (x__ < 0 || x__ >= this.bitmask.width) {
            continue;
        }

        for (var dy = -scaled_size; dy <= scaled_size; dy++) {
            var y__ = y_ + dy;
            if (y__ < 0 || y__ >= this.bitmask.height) {
                continue;
            }

            this.bitmask.set(x__, y__, bit);
        }
    }
};
