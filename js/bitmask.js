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

var ScaledBitmask = function(width, height, scalingFactor) {
    this.width = width;
    this.height = height;
    this.scalingFactor = scalingFactor;
    this.bitmask = new Bitmask(Math.ceil(width/scalingFactor), Math.ceil(height/scalingFactor));
};

ScaledBitmask.prototype.get = function(x, y) {
    return this.bitmask.get(Math.round(x/this.scalingFactor), Math.round(y/this.scalingFactor));
};

ScaledBitmask.prototype.set = function(x, y, bit) {
    this.bitmask.set(Math.round(x/this.scalingFactor), Math.round(y/this.scalingFactor), 1);
};

ScaledBitmask.prototype.setArea = function(x, y, bit, size) {
    var x_ = Math.round(x/this.scalingFactor);
    var y_ = Math.round(y/this.scalingFactor);
    var scaledSize = Math.round(size/this.scaledSize);

    for (var dx = -scaledSize; dx <= scaledSize; dx++) {
        var x_ = x_ + dx;
        if (x_ < 0 || x_ >= this.bitmask.width) {
            continue;
        }

        for (var dy = -scaledSize; dy <= scaledSize; dy++) {
            var y_ = y_ + dy;
            if (y_ < 0 || y_ >= this.bitmask.height) {
                continue;
            }

            this.bitmask.set(x_, y_, bit);
        }
    }
};
