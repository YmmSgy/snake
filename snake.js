const screen = document.getElementById("screen");
const initxy = {x:4, y:4};
const buffer = {
    tiles: "",

    // flush buffer
    flush: function() {
        screen.innerHMTL = this.tiles;
    },

    // clear and fill buffer
    fill: function(tile) {
        for (let y = 0; y < 10; ++y) {
            for (let x = 0; x < 10; ++x) {
                this.tiles += tile;
            }
            this.tiles += "\n";
        }
    },

    // count number of tiles
    count: function() {
        return this.tiles.length;
    }
};


function turnactions() {
    
}


buffer.fill(".");
buffer.flush();
alert(buffer.count());
setInterval(turnactions, 1000);
