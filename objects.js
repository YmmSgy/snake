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
    // static method to convert monocoordinate to Cd
    Cd.fromMonoCd = (monocd) => new Cd(monocd % Buffer.main.width, Math.floor(monocd / Buffer.main.width));
    // static method to wrap coordinates to within the buffer
    Cd.wrap = function(cd) {
        const wrapint = (wraplen, i) => ((i % wraplen) + wraplen) % wraplen;
        return new Cd(wrapint(Buffer.main.width, cd.x), wrapint(Buffer.main.height, cd.y));
    }
}

function Snake(initlen, initdir) {
    // initial coordinate is at the middle of the screen
    const initcd = new Cd(Math.floor(Buffer.main.width / 2), Math.floor(Buffer.main.height / 2));

    // array of snake body coordinates
    this.body = undefined;

    // setup direction-changing system
    this.dir = undefined;
    this.prevdir = new Cd(0, 0);

    // bool check if specified coordinate is in snake.body
    this.isInBody = function(cd) {
        let flag = false;
        this.body.forEach(function(bodypart) {
            if (bodypart.isEqual(cd)) { flag = true; }
        });
        return flag;
    };

    // change current direction to newdirlabel
    this.changeDir = function(newdirlabel) {
        // convert newdirlabel to newdir direction coordinate
        const newdir = (function() {
            switch (newdirlabel) {
                case "up": return new Cd(0, -1);
                case "right": return new Cd(1, 0);
                case "down": return new Cd(0, 1);
                case "left": return new Cd(-1, 0);
                default: console.log("switch failed: " + newdirlabel);
            }
        })();

        // change dir only if newdir is not opposite of prevdir
        if (!newdir.isEqual(this.prevdir.scale(-1))) {
            this.dir = newdir;
        }
    };

    // initial values setup
    this.body = [];
    for (let i = 0; i < initlen; ++i) { this.body.push(initcd); }
    this.changeDir(initdir);
}

function Food() {
    // the coordinate of the food
    this.pos = undefined;

    // creates new food at random position
    this.createFood = function() {
        // build array of possible food tiles
        const safeforfood = [];
        for (let i = 0; i < Buffer.main.area; ++i) {
            const newcd = Cd.fromMonoCd(i);
            if (!snake.isInBody(newcd)) safeforfood.push(newcd);
        }

        // create random number
        const rng = Math.floor(Math.random() * safeforfood.length);

        this.pos = safeforfood[rng];
    };

    // initialization
    this.createFood();
}
