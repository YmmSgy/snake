"use strict";

function turnactions() {
    // calculate newhead as prevhead+dir
    const prevhead = snake.body[snake.body.length - 1];
    const newhead = prevhead.add(snake.dir).wrap();

    // check if new head is inside snake.body minus the tail
    if (snake.isInBody(newhead) && !newhead.isEqual(snake.body[0])) {
        endgame();
        return;
    }

    // check if food will be eaten
    const foodeaten = newhead.isEqual(food.pos);

    // remove the tail (index 0), unless food was eaten
    // and add the head (index length-1)
    if (!foodeaten) snake.body.shift();
    snake.body.push(newhead);

    // update old snake direction
    snake.prevdir = snake.dir;

    // if food was eaten, create new food and increment score
    if (foodeaten) {
        food.createFood();
        ++score;
    }

    // clear screen and redraw whole snake
    redraw();
}

function startgame() {
    // initialize new game objects
    buffer = new Buffer(vtilesnum, htilesnum, tilewidth);
    snake = new Snake(initsnakelen, initdir);
    food = new Food();
    score = 0;

    // render screen
    redraw();

    // start turn based system and timer
    timer = setInterval(turnactions, 500);
}

function endgame() {
    clearInterval(timer);
    console.log("game over! score: " + score);
}

// MAIN

// globals
const vtilesnum = 20;
const htilesnum = 20;
const tileheight = Math.floor(Shader.canvas.height / vtilesnum);
const tilewidth = Math.floor(Shader.canvas.width / htilesnum);
const initsnakelen = 2;
const initdir = "down";

const dpad = {
    up: document.getElementById("dpad_up"),
    right: document.getElementById("dpad_right"),
    down: document.getElementById("dpad_down"),
    left: document.getElementById("dpad_left")
};

let buffer, snake, food, timer, score;

// bind dpad
dpad.up.addEventListener("click", () => snake.changeDir("up"));
dpad.right.addEventListener("click", () => snake.changeDir("right"));
dpad.down.addEventListener("click", () => snake.changeDir("down"));
dpad.left.addEventListener("click", () => snake.changeDir("left"));

startgame();
