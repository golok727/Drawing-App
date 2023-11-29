import UI from "./ui";
import AppHistory from "./history";
import { Tool } from "./toolbar";
import Vector from "./vector";
import Renderer from "./renderer";
import { COLORS } from "./utils";

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

	private renderer!: Renderer;

	private ui = new UI();
	private history: AppHistory = new AppHistory();

	private isDrawing = false;
	private isErasing = false;
	private isPanning = false;

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

	private startDrawing() {
		this.isDrawing = true;
	}
	private endDrawing() {
		this.isDrawing = false;
	}
	private startErasing() {
		this.isErasing = true;
	}
	private endErasing() {
		this.isErasing = false;
	}
	private startPan() {
		this.isPanning = true;
	}
	private endPan() {
		this.isPanning = false;
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
	private setMouse(...pos: [number, number]) {
		this.mouse.x = pos[0];
		this.mouse.y = pos[1];
	}
	private getMouseLocation(): Vec2 {
		return [this.mouse.x, this.mouse.y];
	}

	/* Event Handlers  */
	private handleMouseDown(evt: MouseEvent) {
		this.ui.disableNavEvents();
		this.setMouse(evt.offsetX, evt.offsetY);

		if (!this.isCurrentTool("selector")) {
			// Brush Mode
			if (evt.button == MOUSE_BUTTONS.LMB && this.isCurrentTool("brush")) {
				this.renderer.onBeginStroke(Vector.from(this.getMouseLocation()), {
					strokeColor: COLORS.ORANGE,
				});
				this.startDrawing();
				this.history.clear();
			}
			// Eraser Mode
			else if (
				evt.button == MOUSE_BUTTONS.LMB &&
				this.isCurrentTool("eraser")
			) {
				this.isErasing = true;
				this.renderer.Erase(this.getMouseLocation());
			}
		}
	}
	// Mouse Move
	private handleMouseMove(evt: MouseEvent) {
		this.setMouse(evt.offsetX, evt.offsetY);

		// Draw
		if (this.isDrawing && this.isCurrentTool("brush")) {
			this.renderer.onStroke(Vector.from(this.getMouseLocation()));
		}

		// Erase
		if (this.isErasing && this.isCurrentTool("eraser")) {
			this.renderer.Erase(this.getMouseLocation());
		}
	}
	// Mouse Up
	private handleMouseUp(evt: MouseEvent) {
		this.endDrawing();
		this.endErasing();

		this.ui.enableNavEvents();

		// BrusH
		if (evt.button == MOUSE_BUTTONS.LMB && this.isCurrentTool("brush")) {
			this.renderer.onStrokeEnd();
		}
		// Eraser
		else if (evt.button == MOUSE_BUTTONS.LMB && this.isCurrentTool("eraser")) {
			this.renderer.onEraseEnd();
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
