'use strict';

const ctx = document.getElementById('canvas').getContext('2d');
let cwidth, cheight;

// global functions
function initCanvasWH() {
	cwidth = cheight = ctx.canvas.width = ctx.canvas.height =
	devicePixelRatio * Math.min(
		document.documentElement.clientWidth,
		document.documentElement.clientHeight
	);
}
function wrap(val, count) {
	if (count === 0) throw new Error('cannot wrap around 0');
	return ((val % count) + count) % count;
}

// controls
class Controls {
	static main;
	// control states
	#dpadState = {
		vertical: 0,
		horizontal: 0
	};
	#selectBtnState = 'keyup';
	constructor() {
		Controls.main = this;
		// parses input into control events and changes control state
		const receiveInput = e => {
			// translate key presses into axis changes
			const btnToAxis = (axis, limit) => {
				if (e.type === 'keydown') {
					if (this.#dpadState[axis] === limit) return;
					this.#dpadState[axis] += limit;
				}
				else if (e.type === 'keyup') {
					if (this.#dpadState[axis] === -limit) return;
					this.#dpadState[axis] -= limit;
				}
				else {
					throw new Error('invalid key event type');
				}
				// fire the payload event stored in .onDpadChange()
				this.onDpadChange(this.#dpadState);
			};

			// determine which control changed and fire corresponding event
			switch (e.code) {
				case 'KeyW': btnToAxis('vertical', 1); break;
				case 'KeyA': btnToAxis('horizontal', -1); break;
				case 'KeyS': btnToAxis('vertical', -1); break;
				case 'KeyD': btnToAxis('horizontal', 1); break;
				case 'Space':
					if (e.type !== this.#selectBtnState) {
						this.#selectBtnState = e.type;
						// fire the payload event stored in .onSelectChange()
						this.onSelectChange(e.type);
					}
					break;
				default:
			}
		};

		// register for keyboard events
		document.addEventListener('keydown', e => {
			if (!e.repeat) receiveInput(e);
		});
		document.addEventListener('keyup', e => {
			receiveInput(e);
		});
	}
	// control events
	onDpadChange = newDir => {};
	onSelectChange = newState => {};
}

// screens
// screen that can survive screen refreshes
class RedrawableScreen {
	static curScreen;
	clearScreen() {
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, cwidth, cheight);
	}
	redraw() { RedrawableScreen.curScreen = this; }
}
// selectable item in a MenuScreen
class MenuItem {
	#text;
	get text() { return this.#text; }
	onSelect = () => {};
	constructor(text, onSelectFn) {
		this.#text = text;
		this.onSelect = onSelectFn;
	}
}
// screen with selectable items
class MenuScreen extends RedrawableScreen {
	#cursor = 0; items = [];
	get cursor() { return this.#cursor; }
	set cursor(v) { this.#cursor = wrap(v, this.items.length); }
	get cursorItem() { return this.items[this.cursor]; }
	itemsOffsetFrac = 1/2;
	itemsSpacingFrac = 1/12;
	constructor() {
		super();
		Controls.main.onDpadChange = newDir => {
			if (newDir.vertical === 0) return;
			this.navCursor(newDir.vertical);
			this.redraw();
		};
		Controls.main.onSelectChange = newState => {
			if (newState === 'keydown') this.cursorItem.onSelect();
		};
	}
	drawText(text, colour, fontSizeFrac, yPosFrac) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = colour;
		ctx.font = `bold ${fontSizeFrac * cheight}px courier`;
		ctx.fillText(text, cwidth / 2, yPosFrac * cheight);
	}
	drawItems() {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `bold ${cheight / 20}px courier`;
		for (let i = 0; i < this.items.length; i++) {
			ctx.fillStyle = i === this.cursor ? 'white' : 'gray';
			ctx.fillText(
				this.items[i].text,
				cwidth / 2,
				(this.itemsOffsetFrac + this.itemsSpacingFrac * i) * cheight
			);
		}
	}
	navCursor(vertDir) { this.cursor += -vertDir; }
}
class TitleScreen extends MenuScreen {
	items = [
		new MenuItem('START', () => new Game()),
		new MenuItem('HIGH SCORES', () => {}),
		new MenuItem('OPTIONS', () => new OptionsScreen())
	];
	constructor() {
		super();
		this.redraw();
	}
	redraw() {
		super.redraw();
		this.clearScreen();

		// main title
		this.drawText('Snake', 'white', 1/8, 1/5);

		// menu items
		this.drawItems();
	}
}
class GamePauseScreen extends MenuScreen {
	items = [
		new MenuItem('CONTINUE', () => this.resume()),
		new MenuItem('MAIN MENU', () => new TitleScreen())
	];
	resume; #score;
	constructor(resumeFn, score) {
		super();
		this.resume = resumeFn;
		this.#score = score;
		this.redraw();
	}
	redraw() {
		super.redraw();
		this.clearScreen();

		// print paused
		this.drawText('Paused', 'white', 1/10, 1/5);

		// print score
		this.drawText(`Score: ${this.#score}`, 'white', 1/20, 1/3);

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
	constructor(score) {
		super();
		this.#score = score;
		this.redraw();
	}
	redraw() {
		super.redraw();
		this.clearScreen();

		// print game over
		this.drawText('Game Over', 'white', 1/10, 1/5);

		// print score
		this.drawText(`Score: ${this.#score}`, 'white', 1/20, 1/3);

		// print items
		this.drawItems();
	}
}
// selectable and tunable item in an OptionsScreen
class OptionsItem extends MenuItem {
	#label; field;
	get text() { return this.#label + this.field.curChoice.text; }
	constructor(label, optionsField, onSelectFn) {
		super(label, onSelectFn);
		this.#label = label;
		this.field = optionsField;
	}
}
class OptionsScreen extends MenuScreen {
	items = [
		new OptionsItem('Game Speed: ', GameOptions.main.turnDelayField, () => {}),
		new OptionsItem('Board Size: ', GameOptions.main.boardField, () => {}),
		new OptionsItem('Back', GameOptionField.empty, () => new TitleScreen())
	];
	constructor() {
		super();
		Controls.main.onDpadChange = newDir => {
			if (newDir.vertical === 0 && newDir.horizontal === 0) return;
			this.navCursor(newDir.vertical);
			this.navSubCursor(newDir.horizontal);
			this.redraw();
		};
		this.redraw();
	}
	navSubCursor(horiDir) { this.cursorItem.field.curIndex += horiDir; }
	redraw() {
		super.redraw();
		this.clearScreen();
		this.drawText('Options', 'white', 1/10, 1/5);
		this.drawItems();
	}
}
class GameScreen extends RedrawableScreen {
	#foodBlinkState = false;
	#foodWidthScale = 1;
	blinkFood() {
		this.#foodBlinkState = !this.#foodBlinkState;
		if (this.#foodBlinkState) { this.#foodWidthScale = 0.8; }
		else { this.#foodWidthScale = 1; }
	}
	redraw() {
		super.redraw();

		const w = Game.main.board.tileSize;
		const o = Game.main.board.origin;

		// fill with background
		this.clearScreen();

		// draw food
		const f = Game.main.food;
		ctx.beginPath();
		ctx.arc(
			o.x + w / 2 + w * f.x,
			o.y + w / 2 + w * f.y,
			this.#foodWidthScale * 0.9 * w / 2,
			0, 2 * Math.PI, false
		);
		ctx.fillStyle = 'yellow';
		ctx.fill();

		// draw snake body
		const snake = Game.main.snake;
		ctx.beginPath();
		ctx.lineWidth = 0.6 * w;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.strokeStyle = 'red';
		ctx.moveTo(
			o.x + w / 2 + w * snake[0].x,
			o.y + w / 2 + w * snake[0].y
		);
		// connect the dots to draw snake
		for (let i = 1; i < snake.length; i++) {
			const delta = snake[i].add(snake[i - 1].scale(-1));
			if (delta.magnitude === 1) {
				// if cds are adjacent, no wrapping
				ctx.lineTo(
					o.x + w / 2 + w * snake[i].x,
					o.y + w / 2 + w * snake[i].y
				);
			}
			else {
				// if cds are not adjacent, wrap

				// direction of delta is opposite to real direction, as next
				// body coordinate is wrapped across the screen
				const oppRealDir = delta.normalised;
				const realDir = oppRealDir.scale(-1);
				// line to a point offscreen
				ctx.lineTo(
					o.x + w / 2 + w * (snake[i - 1].x + realDir.x),
					o.y + w / 2 + w * (snake[i - 1].y + realDir.y)
				);
				// move to a point offscreen in the opposite direction
				ctx.moveTo(
					o.x + w / 2 + w * (snake[i].x + oppRealDir.x),
					o.y + w / 2 + w * (snake[i].y + oppRealDir.y)
				);
				// line back to the next body coordinate within screen
				ctx.lineTo(
					o.x + w / 2 + w * snake[i].x,
					o.y + w / 2 + w * snake[i].y
				);
			}
			
		}
		ctx.stroke();

		// draw snake head
		ctx.beginPath();
		ctx.arc(
			o.x + w / 2 + w * snake.head.x,
			o.y + w / 2 + w * snake.head.y,
			w / 2,
			0, 2 * Math.PI, false
		);
		ctx.fillStyle = 'red';
		ctx.fill();

		// clear the score area
		ctx.fillStyle = 'midnightblue';
		ctx.fillRect(0, 0, cwidth, Game.main.board.scoreHeight);

		// print the score
		ctx.fillStyle = 'white';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = `bold ${Game.main.board.scoreHeight - 4}px courier`;
		ctx.fillText(
			`Score: ${Game.main.score}`,
			4, Game.main.board.scoreHeight / 2
		);
	}
}

// options
// collection of option choices and the selected choice
class GameOptionField {
	static empty = new GameOptionField(0, [{text:'',value:null}]);
	#curIndex; choices;
	get curIndex() { return this.#curIndex; }
	set curIndex(v) { this.#curIndex = wrap(v, this.choices.length); }
	get curChoice() { return this.choices[this.#curIndex]; }
	constructor(initIndex, choices) {
		this.#curIndex = initIndex;
		this.choices = choices;
	}
}
class GameOptions {
	static main;
	turnDelayField; boardField;
	constructor() {
		GameOptions.main = this;
		this.turnDelayField = new GameOptionField(2, [
			{ text: '>....', value: 500 },
			{ text: '>>...', value: 400 },
			{ text: '>>>..', value: 300 },
			{ text: '>>>>.', value: 200 },
			{ text: '>>>>>', value: 100 }
		]);
		this.boardField = new GameOptionField(2, [
			{ text: '#....', value: new Board(10, 9) },
			{ text: '##...', value: new Board(15, 14) },
			{ text: '###..', value: new Board(20, 19) },
			{ text: '####.', value: new Board(40, 38) },
			{ text: '#####', value: new Board(80, 76) }
		]);
	}
}

// game
class Cd {
	x; y;
	get magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
	get normalised() { return new Cd(this.x / this.magnitude, this.y / this.magnitude);	}
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	equals(other) { return this.x === other.x && this.y === other.y; }
	add(other) { return new Cd(this.x + other.x, this.y + other.y); }
	scale(factor) { return new Cd(this.x * factor, this.y * factor); }
}
class Board extends Cd {
	width = 20;
	height = 19;
	get tileSize() { return cwidth / this.width; }
	get scoreHeight() { return this.tileSize * (this.width - this.height); }
	get origin() { return new Cd(0, this.scoreHeight); }
	constructor(w, h) {
		super(w, h);
		this.width = w;
		this.height = h;
	}
	wrap(cd) {
		return new Cd(wrap(cd.x, this.width), wrap(cd.y, this.height));
	}
}
class Snake extends Array {
	prevDir; savedDir;
	get head() { return this[this.length - 1]; }
	set head(cd) { this.push(cd); }
	get tail() { return this[0]; }
	constructor(initHeadPos, initDir) {
		const initTailPos = initHeadPos.add(initDir.scale(-1));
		super(initTailPos, initHeadPos);
		this.prevDir = this.savedDir = initDir;
	}
	removeTail() { this.shift(); }
	testCollision() {
		// search through the whole snake body for another instance of head
		const i = this.findIndex(s => s.equals(this.head));
		return 0 <= i && i < this.length - 1;
	}
}
class Food extends Cd {
	constructor() {
		const whitelist = [];

		for (let y = 0; y < Game.main.board.height; y++) {
			for (let x = 0; x < Game.main.board.width; x++) {
				const cd = new Cd(x, y);
				// as long as snake does not contain cd, add to whitelist
				if (!Game.main.snake.some(scd => scd.equals(cd))) {
					whitelist.push(cd);
				}
			}
		}

		if (whitelist.length === 0) throw new Error('no tiles left to generate food');

		const foodCd = whitelist[Math.floor(Math.random() * whitelist.length)];
		super(foodCd.x, foodCd.y);
	}
}
class Game {
	static main;
	board; turnDelay; snake; food; screen; #timer;
	score = 0;
	constructor() {
		Game.main = this;

		// import game options
		this.turnDelay = GameOptions.main.turnDelayField.curChoice.value;
		this.board = GameOptions.main.boardField.curChoice.value;

		// create snake
		const initHead = new Cd(
			Math.round(this.board.width / 2),
			Math.round(this.board.height / 2)
		);
		this.snake = new Snake(initHead, new Cd(0, -1));

		// create food
		this.food = new Food();

		// create screen
		this.screen = new GameScreen();
		this.resume();
	}
	turn() {
		this.snake.prevDir = this.snake.savedDir;
		this.snake.head = this.board.wrap(this.snake.head.add(this.snake.savedDir));
		if (this.snake.head.equals(this.food)) {
			++this.score;
			try { this.food = new Food(this); }
			catch (e) {
				this.end();
			}
		}
		else { this.snake.removeTail(); }

		// draw game screen
		this.screen.blinkFood();
		this.screen.redraw();

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
		Controls.main.onDpadChange = newDir => handleDpad(newDir);
		Controls.main.onSelectChange = newState => { if (newState === 'keydown') this.pause(); };

		// draw game board and score header
		this.screen.redraw();

		// start turn system
		this.#timer = setInterval(() => this.turn(), this.turnDelay);
	}
	end() {
		Controls.main.onDpadChange = () => {};
		Controls.main.onSelectChange = () => {};
		clearInterval(this.#timer);
		setTimeout(() => new GameOverScreen(this.score), 1500);
	}
}

// init
initCanvasWH();

addEventListener('resize', () => {
	initCanvasWH();
	RedrawableScreen.curScreen.redraw();
})
new GameOptions();
new Controls();
new TitleScreen();
