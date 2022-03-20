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
	selectBtnState: 'keyup',

	// control events
	onDpadChange: newDir => {},
	onSelectChange: newState => {},

	// setup method (to call at initialization)
	init() {
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
				else {
					console.log('error: invalid keyPressDir');
				}
				// fire the payload event stored in .onDpadChange()
				controls.onDpadChange(controls.dpadState);
			}

			// determine which control changed and fire corresponding event
			switch (key) {
				case 'KeyW': btnToAxis('vertical', 1); break;
				case 'KeyA': btnToAxis('horizontal', -1); break;
				case 'KeyS': btnToAxis('vertical', -1); break;
				case 'KeyD': btnToAxis('horizontal', 1); break;
				case 'Space':
					if (keyPressDir !== controls.selectBtnState) {
						controls.selectBtnState = keyPressDir;
						// fire the payload event stored in .onSelectChange()
						controls.onSelectChange(keyPressDir);
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
// constructor for menu screen item
function MenuItem(text, index) {
	this.text = text;
	this.index = index;
	this.print = function(colour, y) {
		const itemSpacing = 30;
		ctx.font = 'bold 20px courier';
		ctx.fillStyle = colour;
		ctx.fillText(text, cwidth / 2, y + itemSpacing * index);
	};
}

// base template for a navigable menu screen
const navScr = {
	items: [ /* array of MenuItems */ ],
	cursor: 0,
	// initialize and show the screen
	init() {
		// reset cursor to first item
		this.cursor = 0;

		// draw title screen
		this.draw();

		// set title screen control profile
		controls.onDpadChange = (newDir) => {
			if (newDir.vertical !== 0) this.nav(newDir.vertical);
		};
		controls.onSelectChange = (newState) => {
			if (newState === 'keydown') this.select();
		};
	},
	drawItems(y) {
		for (const item of this.items) { item.print('gray', y); }
		this.items[this.cursor].print('white', y);
	},
	draw() { /* redraw the screen */ },
	nav(dir) {
		// wrap cursor and change selection
		let count = this.items.length;
		this.cursor = (((this.cursor - dir) % count) + count) % count;

		// redraw screen with new menu item highlight
		this.draw();
	},
	select() { /* switch on the items */ }
};

// title screen
const titleScr = Object.create(navScr);
{
	titleScr.items = [
		new MenuItem('START', 0),
		new MenuItem('HIGH SCORES', 1),
		new MenuItem('OPTIONS', 2)
	];
	titleScr.draw = function () {
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
		this.drawItems(cheight / 2);
	};
	titleScr.select = function () {
		switch (this.items[this.cursor].text) {
			case 'START': game.start(); break;
			case 'HIGH SCORES': break;
			case 'OPTIONS': break;
			default: console.log(`error: ${this.items[this.cursor].text} is not a valid menu option`); 
		}
	};
}

// game
function Cd(x, y) {
	this.x = x;
	this.y = y;
	this.equals = other => this.x === other.x && this.y === other.y;
	this.add = other => new Cd(this.x + other.x, this.y + other.y);
	this.scale = factor => new Cd(this.x * factor, this.y * factor);
}
function monoToCd(w, mono) { return new Cd(mono % w, Math.floor(mono / w)); }
function cdToMono(w, cd) { return cd.x + cd.y * w; }
const game = {
	boardWidth: 20,
	boardHeight: 19,
	getTileSize() { return Math.floor(cwidth / game.boardWidth); },
	getBoardOrigin() { return new Cd(0, game.getTileSize()); },
	turnDelay: 350,

	timer: undefined,
	score: 0,
	savedDir: undefined,
	prevDir: undefined,
	canPause: false,
	wrapSnake(cd) {
		if (cd.x < 0) { cd.x = game.boardWidth - 1; }
		else if (cd.x > game.boardWidth - 1) { cd.x = 0; }
		if (cd.y < 0) { cd.y = game.boardHeight - 1; }
		else if (cd.y > game.boardHeight - 1) { cd.y = 0; }
		return cd;
	},
	snake: {
		// head is a get/set property for the cd of the snake's head
		getHead() { return this.body[this.body.length - 1] },
		setHead(cd) { this.body.push(cd); },
		removeTail() { this.body.shift(); },
		testCollision() {
			// search through the whole snake body for another instance of head
			const body = this.body;
			const headI = body.length - 1;
			for (let i = 0; i < body.length; ++i) {
				if (body[i].equals(body[headI]) && i !== headI) return true;
			}
			return false;
		},
		// the array of snake segment cds
		body: undefined
	},
	food: {
		pos: undefined,
		make() {
			/// PROBLEMATIC ALGORITHM!!! 
			const numFreeTiles = game.boardWidth * game.boardHeight - game.snake.body.length;
			if (numFreeTiles === 0) console.log('error: no more tiles to generate food'); 
			let ran = Math.floor(Math.random() * numFreeTiles);
			for (let i = 0; i < game.snake.body.length; ++i) {
				if (ran === cdToMono(game.boardWidth, game.snake.body[i])) {
					ran = numFreeTiles + i;
					break;
				}
			}
			this.pos = monoToCd(game.boardWidth, ran);
		}
	},
	drawBoard() {
		const w = game.getTileSize();

		// fill with background
		ctx.fillStyle = 'black';
		ctx.fillRect(
				game.getBoardOrigin().x,
				game.getBoardOrigin().y,
				game.boardWidth * w,
				game.boardHeight * w
		);

		// draw food
		const f = game.food.pos;
		ctx.beginPath();
		ctx.arc(
				w * f.x + w / 2 + game.getBoardOrigin().x,
				w * f.y + w / 2 + game.getBoardOrigin().y,
				w / 2,
				0, 2 * Math.PI, false
		);
		ctx.fillStyle = 'yellow';
		ctx.fill();

		// draw snake
		ctx.beginPath();
		game.snake.body.forEach(function (segment, i, body) {
			ctx.rect(
					w * segment.x + game.getBoardOrigin().x,
					w * segment.y + game.getBoardOrigin().y,
					w, w
			);
		});
		ctx.fillStyle = 'red';
		ctx.fill();
	},
	drawScore() {
		// clear the score area
		ctx.fillStyle = 'midnightblue';
		ctx.fillRect(0, 0, cwidth, game.getTileSize());

		// print the score
		ctx.fillStyle = 'white';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = `bold ${game.getTileSize() - 4}px courier`;
		ctx.fillText(`Score: ${game.score}`, 4, game.getTileSize() / 2);
	},
	changeDir(newDir) {
		const newDirCd = new Cd(newDir.horizontal, -newDir.vertical);
		if (
				!newDirCd.equals(new Cd(0, 0)) &&
				!newDirCd.equals(game.prevDir.scale(-1)) &&
				(
					newDirCd.equals(new Cd( 1,  0)) ||
					newDirCd.equals(new Cd(-1,  0)) ||
					newDirCd.equals(new Cd( 0,  1)) ||
					newDirCd.equals(new Cd( 0, -1))
				)
		) { game.savedDir = newDirCd; }
	},
	start() {
		// init properties
		game.snake.body = [];
		game.score = 0;
		game.savedDir = new Cd(0, -1);
		game.prevDir = new Cd(0, -1);
		game.canPause = true;

		// init the snake
		game.snake.body.push(new Cd(
				Math.round(game.boardWidth / 2),
				Math.round(game.boardHeight / 2)
		));
		game.snake.body.push(game.snake.body[0].add(new Cd(0, 1)));

		// generate first food
		game.food.make();

		game.resume();
	},
	turn() {
		game.prevDir = game.savedDir;
		game.snake.setHead(
			game.wrapSnake(game.snake.getHead().add(game.savedDir))
		);
		if (game.snake.getHead().equals(game.food.pos)) {
			++game.score;
			// update score display when score changes
			game.drawScore();
			game.food.make();
		}
		else { game.snake.removeTail(); }

		// draw game screen
		game.drawBoard();

		if (game.snake.testCollision()) { game.end(); }
	},
	pause() {
		if (!game.canPause) return;
		clearInterval(game.timer);
		gamePauseScr.init();
	},
	resume() {
		// init controls
		controls.onDpadChange = game.changeDir;
		controls.onSelectChange = newState => { if (newState === 'keydown') game.pause(); };

		// draw game board
		game.drawBoard();

		// draw score header
		game.drawScore();

		// start turn system
		game.timer = setInterval(() => { game.turn(); }, game.turnDelay);
	},
	end() {
		game.canPause = false;
		clearInterval(game.timer);
		setTimeout(() => { gameOverScr.init(); }, 1500);
	}
};

// game pause screen
const gamePauseScr = Object.create(navScr);
{
	gamePauseScr.items = [
		new MenuItem('CONTINUE', 0),
		new MenuItem('MAIN MENU', 1)
	];
	gamePauseScr.draw = function () {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// clear whole screen
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, cwidth, cheight);

		// print paused
		ctx.fillStyle = 'white';
		ctx.font = 'bold 40px courier';
		ctx.fillText('Paused', cwidth / 2, cheight / 5);

		// print score
		ctx.font = 'bold 20px courier';
		ctx.fillText(`Score: ${game.score}`, cwidth / 2, cheight / 3);

		// print items
		this.drawItems(cheight / 2);
	};
	gamePauseScr.select = function () {
		switch (this.items[this.cursor].text) {
			case 'CONTINUE': game.resume(); break;
			case 'MAIN MENU': titleScr.init(); break;
			default: console.log(`error: ${this.items[this.cursor].text} is not a valid menu option`);
		}
	};
}

const gameOverScr = Object.create(navScr);
{
	gameOverScr.items = [
		new MenuItem('PLAY AGAIN', 0),
		new MenuItem('MAIN MENU', 1)
	];
	gameOverScr.draw = function () {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// clear whole screen
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, cwidth, cheight);

		// print game over
		ctx.fillStyle = 'white';
		ctx.font = 'bold 40px courier';
		ctx.fillText('Game Over', cwidth / 2, cheight / 5);

		// print score
		ctx.font = 'bold 20px courier';
		ctx.fillText(`Score: ${game.score}`, cwidth / 2, cheight / 3);

		// print items
		this.drawItems(cheight / 2);
	};
	gameOverScr.select = function () {
		switch (this.items[this.cursor].text) {
			case 'PLAY AGAIN': game.start(); break;
			case 'MAIN MENU': titleScr.init(); break;
			default: console.log(`error: ${this.items[this.cursor].text} is not a valid menu option`); 
		}
	};
}

// init
controls.init();
titleScr.init();
