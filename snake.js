function Cd(x, y) {
    this.x = x;
    this.y = y;
    this.toMonoCd = () => buffer.width * this.y + x;
    // vector addition
    this.add = (other) => new Cd(this.x + other.x, this.y + other.y);
    // vector scale
    this.scale = (factor) => new Cd(this.x * factor, this.y * factor);
    // vector comparison
    this.isEqual = (other) => this.x === other.x && this.y === other.y;
}

function Buffer(canvasCtx) {
    this.ctx = canvasCtx;

    // number of tiles in each dimension of the buffer
    this.width = 10;
    this.height = 10;
    this.area = () => this.width * this.height;

    this.tiles = [];

    // flush buffer
    this.flush = function() {
        // define width of tile
        const tilewidth = 20;

        // for each tile
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                ctx.fillStyle = this.tiles[this.width * y + x];
                ctx.fillRect(tilewidth * x, tilewidth * y, tilewidth, tilewidth);
            }
        }
    };

    // clear and fill buffer
    this.fill = function(tile) {
        this.tiles = [];
        for (let i = 0; i < this.area(); ++i) {
            this.tiles.push(tile);
        }
    };

    // set tile in buffer
    this.settile = function(cd, tile) {
        this.tiles[cd.toMonoCd()] = tile;
    };
}

function Snake() {
    const initxy = new Cd(4, 4);
    this.body = [initxy, initxy];

    this.dir = new Cd(0, 1);
    this.prevdir = new Cd(0, 0);

    this.isInBody = function(cd) {
        let flag = false;
        for (let i = 0; i < this.body.length; ++i) {
            const bodypart = this.body[i];
            if (bodypart.x === cd.x && bodypart.y === cd.y) { flag = true; }
        }
        return flag;
    };

    this.changeDir = function(newdirlabel) {
        // convert newdirlabel to newdir direction coordinate
        let newdir = undefined;
        switch (newdirlabel) {
            case "up": newdir = new Cd(0, -1); break;
            case "right": newdir = new Cd(1, 0); break;
            case "down": newdir = new Cd(0, 1); break;
            case "left": newdir = new Cd(-1, 0); break;
            default: console.log("switch failed: " + newdirlabel);
        }

        // change dir only if newdir is not parallel to prevdir
        if (!newdir.isEqual(this.prevdir) && !newdir.isEqual(this.prevdir.scale(-1))) {
            this.dir = newdir;
        }
    };

    this.updateBody = function() {
        // remove the tail (index 0) and add prevhead+dir to the head (index length-1)
        const prevtail = this.body.shift();
        const prevhead = this.body[this.body.length - 1];
        const newhead = wrap(prevhead.add(this.dir));
        this.body.push(newhead);
    };
}

const screen = document.getElementById("screen");
const ctx = screen.getContext("2d");
const buffer = new Buffer(ctx);
const snake = new Snake();

function wrap(cd) {
    wrapint = (wraplen, i) => ((i % wraplen) + wraplen) % wraplen;
    return new Cd(wrapint(buffer.width, cd.x), wrapint(buffer.height, cd.y));
}

function redraw() {
    // clear screen
    buffer.fill("#000000");

    // redraw whole snake
    snake.body.forEach((partcd) => buffer.settile(partcd, "#ff0000"));

    // flush buffer
    buffer.flush();
}

function turnactions() {
    // update the snake body
    snake.updateBody();

    // update old snake direction
    snake.prevdir = snake.dir;

    // clear screen and redraw whole snake
    redraw();
}

// bind dpad
document.getElementById("dpad_up").onclick = () => snake.changeDir("up");
document.getElementById("dpad_right").onclick = () => snake.changeDir("right");
document.getElementById("dpad_down").onclick = () => snake.changeDir("down");
document.getElementById("dpad_left").onclick = () => snake.changeDir("left");

// start game
redraw();
document.getElementById("btn").onclick = turnactions;
//setInterval(turnactions, 1000);
