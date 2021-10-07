function Cd(x, y) {
    this.x = x;
    this.y = y;
    this.toMonoCd = () => 10 * this.y + x;
    // vector addition
    this.add = (other) => new Cd(this.x + other.x, this.y + other.y);
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

    this.isInBody = function(cd) {
        let flag = false;
        for (let i = 0; i < this.body.length; ++i) {
            const bodypart = this.body[i];
            if (bodypart.x === cd.x && bodypart.y === cd.y) { flag = true; }
        }
        return flag;
    };
}

const screen = document.getElementById("screen");
const ctx = screen.getContext("2d");
const buffer = new Buffer(ctx);
const snake = new Snake();

function wrap(cd) {
    wrapint = (wraplen, i) => ((i % wraplen) + wraplen) % wraplen;
    return new Cd(wrapint(10, cd.x), wrapint(10, cd.y));
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
    // remove the tail (index 0) and add prevhead+dir to the head (index length-1)
    const prevtail = snake.body.shift();
    const prevhead = snake.body[snake.body.length - 1];
    const newhead = wrap(prevhead.add(snake.dir));
    snake.body.push(newhead);

    // clear screen and redraw whole snake
    redraw();
}

redraw();
document.getElementById("btn").onclick = turnactions;
//setInterval(turnactions, 1000);
