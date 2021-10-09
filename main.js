"use strict";

const screen = document.getElementById("screen");
const ctx = screen.getContext("2d");
const buffer = new Buffer(4, 4, 20);
const snake = new Snake(2, "down");
const food = new Food();

// paints background
function paintBackground(cd) {
    ctx.fillStyle = "#000000";
    const w = Buffer.main.tilewidth;
    ctx.fillRect(cd.x * w, cd.y * w, w, w);
}

// paints snake body
function paintBody(cd) {
    paintBackground(cd);
    ctx.fillStyle = "#ff0000";
    const w = Buffer.main.tilewidth;
    ctx.beginPath();
    ctx.arc(cd.x * w + w / 2, cd.y * w + w / 2, w / 2, 0, 2 * Math.PI);
    ctx.fill();
}

// paints food
function paintFood(cd) {
    paintBackground(cd);
    ctx.fillStyle = "#00ff00";
    const w = Buffer.main.tilewidth;
    ctx.beginPath();
    ctx.arc(cd.x * w + w / 2, cd.y * w + w / 2, w / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function redraw() {
    // clear screen
    Buffer.main.fill(paintBackground);

    // redraw whole snake
    snake.body.forEach(function(partcd) {
        Buffer.main.settile(partcd, paintBody);
    });

    // redraw food
    Buffer.main.settile(food.pos, paintFood);

    // flush buffer
    Buffer.main.flush();
}

function turnactions() {
    // record the old head, and calculate newhead as prevhead+dir
    const prevhead = snake.body[snake.body.length - 1];
    const newhead = Cd.wrap(prevhead.add(snake.dir));

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
redraw();
document.getElementById("btn").onclick = turnactions;
//setInterval(turnactions, 500);
