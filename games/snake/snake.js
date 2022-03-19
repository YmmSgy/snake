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
				controls.onDpadChange(controls.dpadState);
			}

			// determine which control changed and fire corresponding event
			switch (key) {
				case 'KeyW': btnToAxis('vertical', 1); break;
				case 'KeyA': btnToAxis('horizontal', -1); break;
				case 'KeyS': btnToAxis('vertical', -1); break;
				case 'KeyD': btnToAxis('horizontal', 1); break;
				case 'Space':
					if (keyPressDir !== controls.btnAState) {
						controls.btnAState = keyPressDir;
						controls.onBtnAChange(keyPressDir);
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
function ScrItem(text, index) {
	this.text = text;
	this.index = index;
	this.print = function(colour, y) {
		ctx.font = 'bold 20px courier';
		ctx.fillStyle = colour;
		ctx.fillText(text, cwidth / 2, y + 30 * index);
	};
}
const navScr = {
	items: [ /* array of ScrItems */ ],
	cursor: 0,
	start() {
		// reset cursor to first item
		this.cursor = 0;

		// draw title screen
		this.draw();

		// set title screen control profile
		controls.onDpadChange = newDir => { if (newDir.vertical !== 0) this.nav(newDir.vertical); };
		controls.onBtnAChange = newState => { if (newState === 'keydown') this.select(); };
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
const titleScr = Object.create(navScr);
{
	titleScr.items = [
		new ScrItem('START', 0),
		new ScrItem('HIGH SCORES', 1),
		new ScrItem('OPTIONS', 2)
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
			default: console.log(this.items[this.cursor].text); 
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
	get tileSize() { return Math.floor(cwidth / game.boardWidth); },
	get boardOrigin() { return new Cd(0, game.tileSize); },
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
		get head() { return this.body[this.body.length - 1] },
		set head(cd) { this.body.push(cd); },
		removeTail() { this.body.shift(); },
		// search through the whole snake body for another instance of head
		testCollision() {
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
			// PROBLEMATIC ALGORITHM!!! 
			const numFreeTiles = game.boardWidth * game.boardHeight - game.snake.body.length;
			if (numFreeTiles === 0) console.log('...nice...'); 
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
		const w = game.tileSize;

		// fill with background
		ctx.fillStyle = 'black';
		ctx.fillRect(
				game.boardOrigin.x,
				game.boardOrigin.y,
				game.boardWidth * w,
				game.boardHeight * w
		);

		// draw food
		const f = game.food.pos;
		ctx.beginPath();
		ctx.arc(
				w * f.x + w / 2 + game.boardOrigin.x,
				w * f.y + w / 2 + game.boardOrigin.y,
				w / 2,
				0, 2 * Math.PI, false
		);
		ctx.fillStyle = 'yellow';
		ctx.fill();

		// draw snake
		ctx.beginPath();
		game.snake.body.forEach(function (segment, i, body) {
			ctx.rect(
					w * segment.x + game.boardOrigin.x,
					w * segment.y + game.boardOrigin.y,
					w, w
			);
		});
		ctx.fillStyle = 'red';
		ctx.fill();
	},
	drawScore() {
		// clear the score area
		ctx.fillStyle = 'midnightblue';
		ctx.fillRect(0, 0, cwidth, game.tileSize);

		// print the score
		ctx.fillStyle = 'white';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = `bold ${game.tileSize - 4}px courier`;
		ctx.fillText(`Score: ${game.score}`, 4, game.tileSize / 2);
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
		const snake = game.snake;

		game.prevDir = game.savedDir;
		snake.head = game.wrapSnake(snake.head.add(game.savedDir));
		if (snake.head.equals(game.food.pos)) {
			++game.score;
			// only need to update score display when score changes
			game.drawScore();
			game.food.make();
		}
		else { snake.removeTail(); }

		// draw game screen
		game.drawBoard();

		if (snake.testCollision()) { game.end(); }
	},
	pause() {
		if (!game.canPause) return;
		clearInterval(game.timer);
		gamePauseScr.start();
	},
	resume() {
		// init controls
		controls.onDpadChange = game.changeDir;
		controls.onBtnAChange = newState => { if (newState === 'keydown') game.pause(); };

		// draw game board
		game.drawBoard();

		// draw score header
		game.drawScore();

		// start turn system
		game.timer = setInterval(function () { game.turn(); }, game.turnDelay);
	},
	end() {
		game.canPause = false;
		clearInterval(game.timer);
		setTimeout(function () { gameOverScr.start(); }, 1500);
	}
};



const gamePauseScr = Object.create(navScr);
{
	gamePauseScr.items = [
		new ScrItem('CONTINUE', 0),
		new ScrItem('MAIN MENU', 1)
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
			case 'MAIN MENU': titleScr.start(); break;
			default: console.log(this.items[this.cursor].text);
		}
	};
}



const gameOverScr = Object.create(navScr);
{
	gameOverScr.items = [
		new ScrItem('PLAY AGAIN', 0),
		new ScrItem('MAIN MENU', 1)
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
			case 'MAIN MENU': titleScr.start(); break;
			default: console.log(this.items[this.cursor].text); 
		}
	};
}



// init
controls.init();
titleScr.start();
