"use strict";

const screen = document.getElementById("screen");
const ctx = screen.getContext("2d");

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

function resizescr(width, height) {
    screen.width = width;
    screen.height = height;
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
