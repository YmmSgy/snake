"use strict";

const buffer = new Buffer(4, 4, 20);
const snake = new Snake(2, "down");
const food = new Food();

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
