'use strict';

const ctx = document.getElementById('canvas').getContext('2d');
let cwidth, cheight;
let controls;

// controls
class Controls {
	// control states
	#dpadState = {
		vertical: 0,
		horizontal: 0
	};
	#selectBtnState = 'keyup';

	// control events
	onDpadChange = newDir => {};
	onSelectChange = newState => {};

	constructor () {
		// parses input into control events and changes control state
		const receiveInput = (keyPressDir, key) => {
			// translate key presses into axis changes
			const btnToAxis = (axis, limit) => {
				if (keyPressDir === 'keydown') {
					if (this.#dpadState[axis] === limit) return;
					this.#dpadState[axis] += limit;
				}
				else if (keyPressDir === 'keyup') {
					if (this.#dpadState[axis] === -limit) return;
					this.#dpadState[axis] -= limit;
				}
				else {
					throw new Error('invalid keyPressDir');
				}
				// fire the payload event stored in .onDpadChange()
				this.onDpadChange(this.#dpadState);
			};

			// determine which control changed and fire corresponding event
			switch (key) {
				case 'KeyW': btnToAxis('vertical', 1); break;
				case 'KeyA': btnToAxis('horizontal', -1); break;
				case 'KeyS': btnToAxis('vertical', -1); break;
				case 'KeyD': btnToAxis('horizontal', 1); break;
				case 'Space':
					if (keyPressDir !== this.#selectBtnState) {
						this.#selectBtnState = keyPressDir;
						// fire the payload event stored in .onSelectChange()
						this.onSelectChange(keyPressDir);
					}
					break;
				default:
			}
		};

		// register for keyboard events
		document.addEventListener('keydown', e => {
			if (!e.repeat) receiveInput('keydown', e.code);
		});
		document.addEventListener('keyup', e => {
			receiveInput('keyup', e.code);
		});
	}
}

// menu screen item
class MenuItem {
	text;
	onSelect;
	constructor (text, onSelectFn) {
		this.text = text;
		this.onSelect = onSelectFn;
	}
}

class RedrawableScreen {
	static curScreen;
	redraw() { RedrawableScreen.curScreen = this; }
}

// menu screens
class MenuScreen extends RedrawableScreen {
	items = [];
	cursor = 0;
	itemsOffset;
	itemsSpacing;
	clearScreen() {
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, cwidth, cheight);
	}
	drawItems() {
		this.itemsSpacing = cheight / 12;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `bold ${cheight / 20}px courier`;
		for (let i = 0; i < this.items.length; i++) {
			if (i === this.cursor) { ctx.fillStyle = 'white'; }
			else { ctx.fillStyle = 'gray'; }

			ctx.fillText(
				this.items[i].text,
				cwidth / 2,
				this.itemsOffset + this.itemsSpacing * i
			);
		}
	}
	initControls() {
		const nav = dir => {
			// wrap cursor and change selection
			let count = this.items.length;
			this.cursor = (((this.cursor - dir) % count) + count) % count;

			// redraw screen with new menu item highlight
			this.redraw();
		};

		controls.onDpadChange = newDir => {
			if (newDir.vertical !== 0) nav(newDir.vertical);
		};
		controls.onSelectChange = newState => {
			if (newState === 'keydown') this.items[this.cursor].onSelect();
		};
	}
}

class TitleScreen extends MenuScreen {
	items = [
		new MenuItem('START', () => new Game()),
		new MenuItem('HIGH SCORES', () => {}),
		new MenuItem('OPTIONS', () => {})
	];
	constructor () {
		super();
		this.redraw();
		this.initControls();
	}
	redraw() {
		super.redraw();
		this.itemsOffset = cheight / 2;
		this.clearScreen();

		// text preparations
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// main title
		ctx.fillStyle = 'white';
		ctx.font = `bold ${cheight / 8}px courier`;
		ctx.fillText('Snake', cwidth / 2, cheight / 5);

		// menu items
		this.drawItems();
	}
}

class GamePauseScreen extends MenuScreen {
	items = [
		new MenuItem('CONTINUE', () => this.#resume()),
		new MenuItem('MAIN MENU', () => new TitleScreen())
	];
	#resume;
	#score;
	constructor (resumeFn, score) {
		super();
		this.#resume = resumeFn;
		this.#score = score;
		this.redraw();
		this.initControls();
	}
	redraw() {
		super.redraw();
		this.itemsOffset = cheight / 2;
		this.clearScreen();

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// print paused
		ctx.fillStyle = 'white';
		ctx.font = `bold ${cheight / 10}px courier`;
		ctx.fillText('Paused', cwidth / 2, cheight / 5);

		// print score
		ctx.font = `bold ${cheight / 20}px courier`;
		ctx.fillText(`Score: ${this.#score}`, cwidth / 2, cheight / 3);

		// print items
		this.drawItems();
	}
}

class GameOverScreen extends MenuScreen {
	items = [
		new MenuItem('PLAY AGAIN', () => new Game()),
		new MenuItem('MAIN MENU', () => new TitleScreen())
	];
	#score;
	constructor (score) {
		super();
		this.#score = score;
		this.redraw();
		this.initControls();
	}
	redraw() {
		super.redraw();
		this.itemsOffset = cheight / 2;
		this.clearScreen();

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// print game over
		ctx.fillStyle = 'white';
		ctx.font = `bold ${cheight / 10}px courier`;
		ctx.fillText('Game Over', cwidth / 2, cheight / 5);

		// print score
		ctx.font = `bold ${cheight / 20}px courier`;
		ctx.fillText(`Score: ${this.#score}`, cwidth / 2, cheight / 3);

		// print items
		this.drawItems();
	}
}

// game
class Cd {
	constructor (x, y) {
		this.x = x;
		this.y = y;
	}
	x; y;
	equals(other) { return this.x === other.x && this.y === other.y; }
	add(other) { return new Cd(this.x + other.x, this.y + other.y); }
	scale(factor) { return new Cd(this.x * factor, this.y * factor); }
}
class Board {
	constructor (w, h) {
		this.width = w;
		this.height = h;
	}
	width = 20;
	height = 19;
	get tileSize() { return cwidth / this.width; }
	get origin() { return new Cd(0, this.tileSize); }
	wrap(cd) {
		if (cd.x < 0) { cd.x = this.width - 1; }
		else if (cd.x > this.width - 1) { cd.x = 0; }
		if (cd.y < 0) { cd.y = this.height - 1; }
		else if (cd.y > this.height - 1) { cd.y = 0; }
		return cd;
	}
}
class Snake extends Array {
	prevDir;
	savedDir;
	constructor (initHeadPos, initDir) {
		const initTailPos = initHeadPos.add(initDir.scale(-1));
		super(initTailPos, initHeadPos);
		this.prevDir = this.savedDir = initDir;
	}
	get head() { return this[this.length - 1] }
	set head(cd) { this.push(cd); }
	removeTail() { this.shift(); }
	testCollision() {
		// search through the whole snake body for another instance of head
		const i = this.findIndex(s => s.equals(this.head));
		return 0 <= i && i < this.length - 1;
	}
}
class Food extends Cd {
	constructor (game) {
		const whitelist = [];

		for (let y = 0; y < game.board.height; y++) {
			for (let x = 0; x < game.board.width; x++) {
				const cd = new Cd(x, y);
				// as long as snake does not contain cd, add to whitelist
				if (!game.snake.some(scd => scd.equals(cd))) {
					whitelist.push(cd);
				}
			}
		}

		if (whitelist.length === 0) throw new Error('no tiles left to generate food');

		const foodCd = whitelist[Math.floor(Math.random() * whitelist.length)];
		super(foodCd.x, foodCd.y);
	}
}
class GameScreen extends RedrawableScreen {
	#game;
	constructor (game) {
		super();
		this.#game = game;
	}
	redraw() {
		super.redraw();
		this.drawBoard();
		this.drawScore();
	}
	drawBoard() {
		const w = this.#game.board.tileSize;
		const o = this.#game.board.origin;

		// fill with background
		ctx.fillStyle = 'black';
		ctx.fillRect(
			o.x, o.y,
			this.#game.board.width * w,
			this.#game.board.height * w
		);

		// draw food
		const f = this.#game.food;
		ctx.beginPath();
		ctx.arc(
			w * f.x + w / 2 + o.x,
			w * f.y + w / 2 + o.y,
			w / 2,
			0, 2 * Math.PI, false
		);
		ctx.fillStyle = 'yellow';
		ctx.fill();

		// draw snake
		ctx.beginPath();
		this.#game.snake.forEach(segment => {
			ctx.rect(
				w * segment.x + o.x,
				w * segment.y + o.y,
				w, w
			);
		});
		ctx.fillStyle = 'red';
		ctx.fill();
	}
	drawScore() {
		// clear the score area
		ctx.fillStyle = 'midnightblue';
		ctx.fillRect(0, 0, cwidth, this.#game.board.tileSize);

		// print the score
		ctx.fillStyle = 'white';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = `bold ${this.#game.board.tileSize - 4}px courier`;
		ctx.fillText(`Score: ${this.#game.score}`, 4, this.#game.board.tileSize / 2);
	}
}
class Game {
	board; snake; food; screen; #timer;
	turnDelay = 350;
	score = 0;
	constructor () {
		// create board
		this.board = new Board(20, 19);

		// create snake
		const initHead = new Cd(
			Math.round(this.board.width / 2),
			Math.round(this.board.height / 2)
		);
		this.snake = new Snake(initHead, new Cd(0, -1));

		// create food
		this.food = new Food(this);

		// create screen
		this.screen = new GameScreen(this);
		this.resume();
	}
	turn() {
		this.snake.prevDir = this.snake.savedDir;
		this.snake.head = this.board.wrap(this.snake.head.add(this.snake.savedDir));
		if (this.snake.head.equals(this.food)) {
			++this.score;
			// update score display when score changes
			this.screen.drawScore();
			try { this.food = new Food(this); }
			catch (e) {
				this.end();
			}
		}
		else { this.snake.removeTail(); }

		// draw game screen
		this.screen.drawBoard();

		if (this.snake.testCollision()) { this.end(); }
	}
	pause() {
		clearInterval(this.#timer);
		new GamePauseScreen(() => this.resume(), this.score);
	}
	resume() {
		const handleDpad = (newDir) => {
			const newDirCd = new Cd(newDir.horizontal, -newDir.vertical);
			if (
					!newDirCd.equals(this.snake.prevDir.scale(-1)) &&
					(
						newDirCd.equals(new Cd( 1,  0)) ||
						newDirCd.equals(new Cd(-1,  0)) ||
						newDirCd.equals(new Cd( 0,  1)) ||
						newDirCd.equals(new Cd( 0, -1))
					)
			) { this.snake.savedDir = newDirCd; }
		};
		// init controls
		controls.onDpadChange = newDir => handleDpad(newDir);
		controls.onSelectChange = newState => { if (newState === 'keydown') this.pause(); };

		// draw game board and score header
		this.screen.redraw();

		// start turn system
		this.#timer = setInterval(() => this.turn(), this.turnDelay);
	}
	end() {
		controls.onDpadChange = () => {};
		controls.onSelectChange = () => {};
		clearInterval(this.#timer);
		setTimeout(() => new GameOverScreen(this.score), 1500);
	}
}

// init
const initCanvasWH = () => {
	cwidth = cheight = ctx.canvas.width = ctx.canvas.height =
	Math.min(
		document.documentElement.clientWidth,
		document.documentElement.clientHeight
	);
};
initCanvasWH();

addEventListener('resize', () => {
	initCanvasWH();
	RedrawableScreen.curScreen.redraw();
})
controls = new Controls();
new TitleScreen();
