import UI from "./ui";
import AppHistory from "./history";
import { Tool } from "./toolbar";
import Vector from "./vector";
import Renderer from "./renderer";

const MOUSE_BUTTONS = {
	LMB: 0,
	MMB: 1,
	RMB: 2,
};

export type Vec2 = [number, number];
class Canvas {
	private canvas: HTMLCanvasElement = document.createElement("canvas");
	private ctx!: CanvasRenderingContext2D;
	private cWidth!: number;
	private cHeight!: number;
	private centerX!: number;
	private centerY!: number;

	private renderer!: Renderer;

	private ui = new UI();
	private history: AppHistory = new AppHistory();

	private isDrawing = false;

	private isTransforming = false;
	private isReadOnly = false;

	private mouse: { x: number; y: number } = { x: 0, y: 0 };

	private currentTool: Tool = "brush";

	private refHandlers!: {
		mouseDownHandler: (evt: MouseEvent) => void;
		mouseUpHandler: (evt: MouseEvent) => void;
		mouseMoveHandler: (evt: MouseEvent) => void;
		keyDownHandler: (evt: KeyboardEvent) => void;
	};

	constructor(container: HTMLElement) {
		this.setupCanvas(container);
		this.addEventListeners();
		this.setupUI();

		this.renderer = new Renderer(this.ctx);
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
		this.renderer.Render();
	}

	private setupCanvas(container: HTMLElement) {
		this.ui.setCursor(this.canvas, this.currentTool);
		this.canvas.classList.add("min-h-screen");

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
	}

	private isCurrentTool(tool: Tool) {
		return tool === this.currentTool;
	}

	private setupUI() {
		const { ui } = this;

		// Undo Button
		ui.addComponent(document.querySelector("[data-undo-btn]")!, {
			click: () => {
				// TODO HISTORY
			},
		});

		// Redo Button
		ui.addComponent(document.querySelector("[data-redo-btn]")!, {
			click: () => {
				// TODO HISTORY
			},
		});

		// Clear All Button
		ui.addComponent(document.querySelector("[data-clear-all-btn]"!)!, {
			click: () => {
				// TODO HISTORY
				this.renderer.clear();
			},
		});

		// Initialize the toolbar
		ui.toolbarInit((tool) => {
			this.currentTool = tool;
			this.ui.setCursor(this.canvas, this.currentTool);
		});
	}

	private getMouseLocation(): Vec2 {
		return [this.mouse.x, this.mouse.y];
	}

	/* Event Handlers  */
	private handleMouseDown(evt: MouseEvent) {
		if (!this.isCurrentTool("hand")) {
			// Brush Mode
			if (evt.button == MOUSE_BUTTONS.LMB && this.isCurrentTool("brush")) {
				this.renderer.beginStroke(Vector.from(this.getMouseLocation()));
				this.isDrawing = true;
				this.history.clear();
			}
		}
	}
	private handleMouseUp(evt: MouseEvent) {
		this.isDrawing = false;

		if (evt.button == MOUSE_BUTTONS.LMB && this.isCurrentTool("brush")) {
			this.renderer.endStroke();
		}
	}

	private handleMouseMove(evt: MouseEvent) {
		this.mouse.x = evt.offsetX;
		this.mouse.y = evt.offsetY;

		if (this.isDrawing && this.isCurrentTool("brush")) {
			const point = this.getMouseLocation();
			this.renderer.stroke(Vector.from(point));
		}
	}

	private handleKeyDown(evt: KeyboardEvent) {
		const key = evt.key.toLocaleLowerCase();
		const CTRL = evt.ctrlKey;
		const SHIFT = evt.shiftKey;

		if (CTRL && SHIFT && key === "z") {
			// TODO
		} else if (CTRL && key === "z") {
			// TODO
		}
	}

	// Register Events
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
}

export default Canvas;
