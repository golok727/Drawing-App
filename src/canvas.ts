import UI from "./ui";
import AppHistory from "./history";
import Toolbar, { Tool } from "./toolbar";
const MOUSE_BUTTONS = {
	LMB: 0,
	MMB: 1,
	RMB: 2,
};

const COLORS = {
	BLACK: 0,
	WHITE: 1,
	RED: 2,
	GREEN: 3,
	BLUE: 4,
	CYAN: 5,
	YELLOW: 6,
	HOT_PINK: 7,
} as const;

const getColor = (color: (typeof COLORS)[keyof typeof COLORS]) => {
	switch (color) {
		case COLORS.BLACK:
			return "#000";
		case COLORS.WHITE:
			return "#ffffff";

		case COLORS.RED:
			return "#ff0000";

		case COLORS.GREEN:
			return "#00ff00";

		case COLORS.BLUE:
			return "#0000ff";

		case COLORS.YELLOW:
			return "#ffff00";

		case COLORS.CYAN:
			return "#00ffff";

		case COLORS.HOT_PINK:
			return "#FF69B4";
		default:
			return "#000";
	}
};

export type Vec2 = [number, number];
class Canvas {
	canvas: HTMLCanvasElement = document.createElement("canvas");
	ctx: CanvasRenderingContext2D;
	cWidth: number;
	cHeight: number;
	centerX: number;
	centerY: number;

	private ui = new UI();

	private paths: Vec2[][] = [];

	private history = new AppHistory(this.paths);

	private isDrawing = false;

	private mouse: { x: number; y: number } = { x: 0, y: 0 };

	private currentTool: Tool = "brush";

	private toolbar = new Toolbar((tool) => {
		this.currentTool = tool;
		this.setCursor();
	});

	private refHandlers!: {
		mouseDownHandler: (evt: MouseEvent) => void;
		mouseUpHandler: (evt: MouseEvent) => void;
		mouseMoveHandler: (evt: MouseEvent) => void;
		keyDownHandler: (evt: KeyboardEvent) => void;
	};

	constructor(container: HTMLElement) {
		this.setCursor();
		this.canvas.classList.add("min-h-screen");
		// this.canvas.style.height = "100%";
		// this.canvas.style.width = "100%";

		container.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		if (!this.ctx)
			throw new Error("Canvas API is not supported in your browser");

		this.cWidth = this.canvas.offsetWidth;
		this.cHeight = this.canvas.offsetHeight;

		this.canvas.width = this.cWidth;
		this.canvas.height = this.cHeight;

		this.centerX = this.cWidth / 2;
		this.centerY = this.cHeight / 2;

		this.addEventListeners();
		this.setupUI();
	}

	private setCursor() {
		switch (this.currentTool) {
			case "brush":
				this.canvas.style.cursor = "url(/brush-cursor.png), default";
				break;
			case "eraser":
				this.canvas.style.cursor = "url(/eraser-cursor.png), default";
				break;
			default:
				break;
		}
	}

	private setupUI() {
		const { ui } = this;

		ui.addComponent(document.querySelector("[data-undo-btn]")!, {
			click: () => {
				this.history.undo();
			},
		});

		ui.addComponent(document.querySelector("[data-redo-btn]")!, {
			click: () => {
				this.history.redo();
			},
		});

		ui.addComponent(document.querySelector("[data-clear-all-btn]"!)!, {
			click: () => {
				// Change this
				this.history.clear();
				this.paths = [];
			},
		});
	}
	private drawPath(path: Vec2[]) {
		const { ctx } = this;
		ctx.strokeStyle = getColor(COLORS.HOT_PINK);
		ctx.lineWidth = 6;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(...path[0]);
		for (let i = 1; i < path.length; i++) {
			ctx.lineTo(...path[i]);
		}
		ctx.stroke();
	}
	private drawPaths() {
		for (const path of this.paths) {
			this.drawPath(path);
		}
	}
	private handleMouseDown(evt: MouseEvent) {
		this.mouse.x = evt.offsetX;
		this.mouse.y = evt.offsetY;
		const mouse = this.mouseVec();

		this.paths.push([mouse]);
		if (evt.button == MOUSE_BUTTONS.LMB) {
			this.isDrawing = true;
			this.history.clear();
		}
	}
	private handleMouseUp(_evt: MouseEvent) {
		this.isDrawing = false;
	}

	private handleMouseMove(evt: MouseEvent) {
		this.mouse.x = evt.offsetX;
		this.mouse.y = evt.offsetY;

		if (this.isDrawing) {
			let point = this.mouseVec();
			let currPath = this.paths[this.paths.length - 1];
			currPath.push(point);
		}
	}
	private mouseVec(): Vec2 {
		return [this.mouse.x, this.mouse.y];
	}

	private handleKeyDown(evt: KeyboardEvent) {
		const key = evt.key.toLocaleLowerCase();
		const CTRL = evt.ctrlKey;
		const SHIFT = evt.shiftKey;

		if (CTRL && SHIFT && key === "z") {
			this.history.redo();
		} else if (CTRL && key === "z") {
			this.history.undo();
		}
	}

	private addEventListeners() {
		const mouseDownHandler = this.handleMouseDown.bind(this);
		const mouseUpHandler = this.handleMouseUp.bind(this);
		const mouseMoveHandler = this.handleMouseMove.bind(this);
		const keyDownHandler = this.handleKeyDown.bind(this);

		this.refHandlers = {
			...this.refHandlers,
			keyDownHandler,
			mouseDownHandler,
			mouseMoveHandler,
			mouseUpHandler,
		};

		this.canvas.addEventListener("mousedown", mouseDownHandler);
		this.canvas.addEventListener("mouseup", mouseUpHandler);
		this.canvas.addEventListener("mousemove", mouseMoveHandler);
		document.addEventListener("keydown", keyDownHandler);
	}

	private draw() {
		this.drawPaths();
	}

	destroy() {
		const {
			keyDownHandler,
			mouseDownHandler,
			mouseMoveHandler,
			mouseUpHandler,
		} = this.refHandlers;

		this.canvas.removeEventListener("mousedown", mouseDownHandler);
		this.canvas.removeEventListener("mouseup", mouseUpHandler);
		this.canvas.removeEventListener("mousemove", mouseMoveHandler);
		document.removeEventListener("keydown", keyDownHandler);
	}

	render() {
		const { ctx } = this;
		ctx.clearRect(0, 0, this.cWidth, this.cHeight);
		this.draw();
	}
}

export default Canvas;
