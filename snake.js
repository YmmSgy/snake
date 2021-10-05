const screen = document.getElementById("screen");
const initxy = {x:4, y:4};
let buffer = "";

function resetbuffer() {
    buffer = "";
    for (let y = 0; y < 10; ++y) {
        for (let x = 0; x < 10; ++x) {
            buffer += ".";
        }
        buffer += "\n";
    }
    screen.innerHTML = buffer;
}

function turnactions() {
    
}

resetbuffer();
setInterval(turnactions, 1000);
