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
