"use strict";

function Buffer(width, height, tilewidth) {
    // singleton pattern for the screen
    Buffer.main = this;

    // number of tiles in each dimension of the buffer
    this.width = width;
    this.height = height;
    this.area = this.width * this.height;

    // width in pixels of each tile
    this.tilewidth = tilewidth;

    // contains drawing instructions for every tile
    this.tilepainters = [];

    // execute all drawing instructions in buffer
    this.flush = function() {
        for (let i = 0; i < this.tilepainters.length; ++i) {
            this.tilepainters[i](Cd.fromMonoCd(i));
        }
    };

    // clear and fill buffer with a drawing instruction
    this.fill = function(painter) {
        this.tilepainters = [];
        for (let i = 0; i < this.area; ++i) {
            this.tilepainters.push(painter);
        }
    };

    // set drawing instructions for a tile in buffer
    this.settile = function(cd, painter) {
        this.tilepainters[cd.monoCd] = painter;
    };
}

function Cd(x, y) {
    this.monoCd = Buffer.main.width * y + x;
    this.x = x;
    this.y = y;
    // vector addition
    this.add = (other) => new Cd(this.x + other.x, this.y + other.y);
    // vector scale
    this.scale = (factor) => new Cd(this.x * factor, this.y * factor);
    // vector comparison
    this.isEqual = (other) => this.monoCd === other.monoCd;
    // method to wrap coordinates to within the buffer
    this.wrap = function() {
        const wrapint = (wraplen, i) => ((i % wraplen) + wraplen) % wraplen;
        return new Cd(wrapint(Buffer.main.width, this.x), wrapint(Buffer.main.height, this.y));
    };
    // static method to convert monocoordinate to Cd
    Cd.fromMonoCd = (monocd) => new Cd(monocd % Buffer.main.width, Math.floor(monocd / Buffer.main.width));
}
