"use strict";

function Buffer(width, height, tilewidth) {
    // singleton pattern for the screen
    Buffer.main = this;

    // number of tiles in each dimension of the buffer
    this.width = width;
    this.height = height;
    this.area = this.width * this.height;

    // width in pixels of each tile
    this.tilewidth = tilewidth;

    // contains drawing instructions for every tile
    this.tilepainters = [];

    // execute all drawing instructions in buffer
    this.flush = function() {
        for (let i = 0; i < this.tilepainters.length; ++i) {
            this.tilepainters[i](Cd.fromMonoCd(i));
        }
    };

    // clear and fill buffer with a drawing instruction
    this.fill = function(painter) {
        this.tilepainters = [];
        for (let i = 0; i < this.area; ++i) {
            this.tilepainters.push(painter);
        }
    };

    // set drawing instructions for a tile in buffer
    this.settile = function(cd, painter) {
        this.tilepainters[cd.monoCd] = painter;
    };
}

// contains a pipeline of shaders to draw tiles on the canvas
function Window(origin, width, height) {
	// holds the shader pipeline
	let pipeline = [];

	// checks if coordinate is within the window
	const withinwin = (cd) => 0 <= cd.x && cd.x < width && 0 <= cd.y && cd.y < height;

	this.origin = origin;
	this.width = width;
	this.height = height;

	// draw the window based on the stored pipeline
	this.flush = function() {
		pipeline.forEach(function(value) {
			value();
		});
		// reset pipeline after execution
		pipeline = [];
	};

/*	// add shader at local coordinate to the window's pipeline
	this.add = function(cd, id) {
		// do bounds check for cd
		if (!withinwin(cd)) {
			console.log("writing to a coordinate outside of window!");
			return;
		}
		// convert cd to world coordinate
		const wcd = origin.add(cd);

		// create shader from world coordinate and id
		const s = some function... 

		// add the shader to the pipeline
		pipeline.push(s);
	}; */

/*	// fill the window with shader
	this.fill = function(id) {
		// create container for multiple related shaders
		const sc = function() {
			// iterate through every coordinate in the window
			for (let i = 0; i < width * height; ++i) {
				const cd = Cd.frommono(i, width);

				// get world coordinate
				const wcd = origin.add(cd);

				// run shader with world coordinate and id
				some function... 
			}
		};

		// add the shader container to the pipeline as a single instruction
		pipeline.push(sc);
	}; */

	// wraps a local coordinate into a coordinate within the window
	this.wrap = function(cd) {
		const wrapint = (i, len) => ((i % len) + len) % len;
		return new Cd(wrapint(cd.x, width), wrapint(cd.y, height));
	};
}

function Cd(x, y) {
    this.monoCd = Buffer.main.width * y + x; 
    this.x = x;
    this.y = y;

    // vector addition
    this.add = (other) => new Cd(x + other.x, y + other.y);

    // vector scale
    this.scale = (factor) => new Cd(x * factor, y * factor);

    // vector comparison
	this.isEqual = (other) => x === other.x && y === other.y;

    // method to wrap coordinates to within the buffer
    this.wrap = function() { 
        const wrapint = (wraplen, i) => ((i % wraplen) + wraplen) % wraplen;
        return new Cd(wrapint(Buffer.main.width, x), wrapint(Buffer.main.height, y));
    };

    // static method to convert monocoordinate to Cd
    Cd.fromMonoCd = (monocd) => new Cd(monocd % Buffer.main.width, Math.floor(monocd / Buffer.main.width)); 

    Cd.frommono = (mono, w) => new Cd(mono % w, Math.floor(mono / w)); 
    Cd.tomono = (cd, w) => w * cd.y + cd.x; 
}
