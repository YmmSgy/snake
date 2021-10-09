function Cd(x, y) {
    this.monoCd = buffer.width * y + x;
    this.x = x;
    this.y = y;
    // vector addition
    this.add = (other) => new Cd(this.x + other.x, this.y + other.y);
    // vector scale
    this.scale = (factor) => new Cd(this.x * factor, this.y * factor);
    // vector comparison
    this.isEqual = (other) => this.monoCd === other.monoCd;
    // static method to convert monocoordinate to Cd
    Cd.fromMonoCd = (monocd) => new Cd(monocd % buffer.width, Math.floor(monocd / buffer.width));
}

// contains drawing instructions for every tile in tilePainters
function Buffer() {
    // number of tiles in each dimension of the buffer
    this.width = 4;
    this.height = 4;
    this.area = this.width * this.height;

    // width in pixels of each tile
    this.tilewidth = 20;

    this.tilePainters = [];

    // execute all drawing instructions in buffer
    this.flush = function() {
        for (let i = 0; i < this.tilePainters.length; ++i) {
            this.tilePainters[i](Cd.fromMonoCd(i));
        }
    };

    // clear and fill buffer with a single drawing instruction
    this.fill = function(painter) {
        this.tilePainters = [];
        for (let i = 0; i < this.area; ++i) {
            this.tilePainters.push(painter);
        }
    };

    // set drawing instructions for a tile in buffer
    this.settile = function(cd, painter) {
        this.tilePainters[cd.monoCd] = painter;
    };
}

function Snake() {
    const initcd = new Cd(Math.floor(buffer.width / 2), Math.floor(buffer.height / 2));
    this.body = [initcd, initcd];

    this.dir = new Cd(0, 1);
    this.prevdir = new Cd(0, 0);

    this.isInBody = function(cd) {
        let flag = false;
        this.body.forEach(function(bodypart) {
            if (bodypart.isEqual(cd)) { flag = true; }
        });
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
}

function Food() {
    this.pos = undefined;

    // creates new food at random position
    this.createFood = function() {
        // build array of possible food tiles
        const safeforfood = [];
        for (let i = 0; i < buffer.area; ++i) {
            const newcd = Cd.fromMonoCd(i);
            if (!snake.isInBody(newcd)) safeforfood.push(newcd);
        }

        // create random number
        const rng = Math.floor(Math.random() * safeforfood.length);

        this.pos = safeforfood[rng];
    };
}

const screen = document.getElementById("screen");
const ctx = screen.getContext("2d");
const buffer = new Buffer();
const snake = new Snake();
const food = new Food();

function wrap(cd) {
    wrapint = (wraplen, i) => ((i % wraplen) + wraplen) % wraplen;
    return new Cd(wrapint(buffer.width, cd.x), wrapint(buffer.height, cd.y));
}

// paints background
function paintBackground(cd) {
    ctx.fillStyle = "#000000";
    const w = buffer.tilewidth;
    ctx.fillRect(cd.x * w, cd.y * w, w, w);
}

// paints snake body
function paintBody(cd) {
    paintBackground(cd);
    ctx.fillStyle = "#ff0000";
    const w = buffer.tilewidth;
    ctx.beginPath();
    ctx.arc(cd.x * w + w / 2, cd.y * w + w / 2, w / 2, 0, 2 * Math.PI);
    ctx.fill();
}

// paints food
function paintFood(cd) {
    paintBackground(cd);
    ctx.fillStyle = "#00ff00";
    const w = buffer.tilewidth;
    ctx.beginPath();
    ctx.arc(cd.x * w + w / 2, cd.y * w + w / 2, w / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function redraw() {
    // clear screen
    buffer.fill(paintBackground);

    // redraw whole snake
    snake.body.forEach(function(partcd) {
        buffer.settile(partcd, paintBody);
    });

    // redraw food
    buffer.settile(food.pos, paintFood);

    // flush buffer
    buffer.flush();
}

function turnactions() {
    // record the old head, and calculate newhead as prevhead+dir
    const prevhead = snake.body[snake.body.length - 1];
    const newhead = wrap(prevhead.add(snake.dir));

    // check if food will be eaten
    const foodeaten = newhead.isEqual(food.pos);

    // remove the tail (index 0), unless food was eaten
    // and add the head (index length-1)
    if (!foodeaten) snake.body.shift();
    snake.body.push(newhead);

    // update old snake direction
    snake.prevdir = snake.dir;

    // create new food, if food was eaten
    if (foodeaten) food.createFood();

    // clear screen and redraw whole snake
    redraw();
}

// bind dpad
document.getElementById("dpad_up").onclick = () => snake.changeDir("up");
document.getElementById("dpad_right").onclick = () => snake.changeDir("right");
document.getElementById("dpad_down").onclick = () => snake.changeDir("down");
document.getElementById("dpad_left").onclick = () => snake.changeDir("left");

// start game
food.createFood();
redraw();
document.getElementById("btn").onclick = turnactions;
//setInterval(turnactions, 500);
