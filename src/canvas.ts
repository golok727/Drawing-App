import UI from "./ui";
import { getColor, COLORS } from "./utils";
import AppHistory from "./history";
import Toolbar, { Tool } from "./toolbar";
const MOUSE_BUTTONS = {
	LMB: 0,
	MMB: 1,
	RMB: 2,
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

	private refHandlers!: {
		mouseDownHandler: (evt: MouseEvent) => void;
		mouseUpHandler: (evt: MouseEvent) => void;
		mouseMoveHandler: (evt: MouseEvent) => void;
		keyDownHandler: (evt: KeyboardEvent) => void;
	};

	constructor(container: HTMLElement) {
		this.setupToolBar();

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

	private setupToolBar() {
		new Toolbar((tool) => {
			this.currentTool = tool;
			this.setCursor();
		});
	}
	private setCursor() {
		switch (this.currentTool) {
			case "brush":
				this.canvas.style.cursor = "url(/brush-cursor.png), crosshair";
				break;

			case "eraser":
				this.canvas.style.cursor = "url(/eraser-cursor.png) 25 15, crosshair";
				break;

			case "rect":
			case "circle":
			case "line":
			case "texture":
				this.canvas.style.cursor = "crosshair";
				break;

			case "highlighter":
				this.canvas.style.cursor = "url(/laser-cursor.png) 20 15, crosshair";
				break;

			case "hand":
				this.canvas.style.cursor = "grab";
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
		ctx.strokeStyle = getColor(COLORS.GREEN);
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
}

export default Canvas;
