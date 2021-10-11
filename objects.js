"use strict";

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
