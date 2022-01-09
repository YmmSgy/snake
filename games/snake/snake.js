'use strict';

const ctx = document.getElementById('canvas').getContext('2d');
const cwidth = ctx.canvas.width;
const cheight = ctx.canvas.height;



// controls
const controls = {
	// control states
	dpadState: {
		vertical: 0,
		horizontal: 0
	},
	btnAState: 'keyup',
	btnBState: 'keyup',

	// control events
	onDpadChange: newDir => {},
	onBtnAChange: newState => {},
	onBtnBChange: newState => {},

	// setup method (to call at initialization)
	init: function () {
		// parses input into control events and changes control state
		function receiveInput(keyPressDir, key) {
			// translate key presses into axis changes
			function btnToAxis(axis, limit) {
				if (keyPressDir === 'keydown') {
					if (controls.dpadState[axis] === limit) return;
					controls.dpadState[axis] += limit;
				}
				else if (keyPressDir === 'keyup') {
					if (controls.dpadState[axis] === -limit) return;
					controls.dpadState[axis] -= limit;
				}
				controls.onDpadChange(controls.dpadState);
			}

			// determine which control changed and fire corresponding event
			switch (key) {
				case 'KeyW': btnToAxis('vertical', 1); break;
				case 'KeyA': btnToAxis('horizontal', -1); break;
				case 'KeyS': btnToAxis('vertical', -1); break;
				case 'KeyD': btnToAxis('horizontal', 1); break;
				case 'Semicolon':
					if (keyPressDir !== controls.btnAState) {
						controls.btnAState = keyPressDir;
						controls.onBtnAChange(keyPressDir);
					}
					break;
				case 'Quote':
					if (keyPressDir !== controls.btnBState) {
						controls.btnBState = keyPressDir;
						controls.onBtnBChange(keyPressDir);
					}
					break;
				default:
			}
		}

		// register for keyboard events
		document.addEventListener('keydown', function (e) {
			if (!e.repeat) receiveInput('keydown', e.code);
		});
		document.addEventListener('keyup', function (e) {
			receiveInput('keyup', e.code);
		});
	}
};



// title screen
function TitleScrItem(text, index) {
	this.text = text;
	this.index = index;
	this.print = function(colour) {
		ctx.font = 'bold 20px courier';
		ctx.fillStyle = colour;
		ctx.fillText(text, cwidth / 2, cheight / 2 + 30 * index);
	};
}
const titleScr = {
	items: [
		new TitleScrItem('START', 0),
		new TitleScrItem('HIGH SCORES', 1),
		new TitleScrItem('OPTIONS', 2)
	],
	cursor: 0,
	start: function () {
		// draw title screen
		this.draw();

		// set title screen control profile
		controls.onDpadChange = newDir => { if (newDir.vertical !== 0) titleScr.nav(newDir.vertical); };
		controls.onBtnAChange = newState => { if (newState === 'keydown') titleScr.select(); };
		controls.onBtnBChange = () => {};
	},
	draw: function () {
		// text preparations
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// background
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, cwidth, cheight);

		// main title
		ctx.fillStyle = 'white';
		ctx.font = 'bold 50px courier';
		ctx.fillText('Snake', cwidth / 2, cheight / 5);

		// menu items
		this.items.forEach(item => item.print('gray'));
		this.items[this.cursor].print('white');
	},
	nav: function (dir) {
		// wrap cursor and change selection
		let count = this.items.length;
		this.cursor = (((this.cursor - dir) % count) + count) % count;

		// redraw screen with new menu item highlight
		this.draw();
	},
	select: function () {
		switch (this.items[this.cursor].text) {
			case 'START':
			case 'HIGH SCORES':
			case 'OPTIONS':
			default: console.log(this.items[this.cursor].text);
		}
	}
};




// init
controls.init();
titleScr.start();
