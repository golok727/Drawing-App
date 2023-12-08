import UI from "./ui";
import AppHistory, { HistoryAction, UndoOrRedo } from "./history";
import { Tool } from "./toolbar";
import Vector from "./vector";
import Renderer from "./renderer";
import Viewport from "./viewport";
import Keyboard, { AppKeyboardEvent } from "./keyboard";
import Drag from "./drag";

const MOUSE_BUTTONS = {
	LMB: 0,
	MMB: 1,
	RMB: 2,
};

export type Vec2 = [number, number];

class Application {
	private canvas: HTMLCanvasElement = document.createElement("canvas");
	private ctx!: CanvasRenderingContext2D;
	private cWidth!: number;
	private cHeight!: number;

	private renderer: Renderer;
	private ui: UI;
	private _history = new AppHistory();
	private keyboard;
	private viewport: Viewport;

	private isDrawing = false;
	private isErasing = false;

	private mouse: Vector = new Vector(0);

	private drag = new Drag();

	currentTool: Tool = "brush";

	private refHandlers!: {
		pointerDownHandler: (evt: PointerEvent) => void;
		pointerUpHandler: (evt: PointerEvent) => void;
		pointerMoveHandler: (evt: PointerEvent) => void;
	};

	constructor(container: HTMLElement) {
		this.ui = new UI(this.canvas);
		this.setupCanvas(container);

		this.renderer = new Renderer(this.ctx, this._history);
		this.keyboard = new Keyboard(
			this.handleKeyDown.bind(this),
			this.handleKeyUp.bind(this)
		);
		this.viewport = new Viewport(this.ctx, this.keyboard, this, this.ui);

		this.addEventListeners();
		this.setupUI();
	}

	destroy() {
		const { pointerDownHandler, pointerMoveHandler, pointerUpHandler } =
			this.refHandlers;

		this.canvas.removeEventListener("pointerdown", pointerDownHandler);
		this.canvas.removeEventListener("pointerup", pointerUpHandler);
		this.canvas.removeEventListener("pointermove", pointerMoveHandler);
		this.keyboard.destroy();
	}

	render() {
		const { ctx } = this;

		ctx.fillStyle = "black";
		ctx.clearRect(0, 0, this.cWidth, this.cHeight);
		ctx.fillRect(0, 0, this.cWidth, this.cHeight);
		ctx.save();
		ctx.translate(this.viewport.center.x, this.viewport.center.y);
		ctx.scale(1 / this.viewport.zoom, 1 / this.viewport.zoom);
		ctx.translate(this.viewport.offset.x, this.viewport.offset.y);
		this.renderer.Render();
		ctx.restore();
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
				this.handleUndo();
			},
		});

		// Redo Button
		ui.addComponent(document.querySelector("[data-redo-btn]")!, {
			click: () => {
				this.handleRedo();
			},
		});

		// Clear All Button
		ui.addComponent(document.querySelector("[data-clear-all-btn]"!)!, {
			click: () => {
				this.renderer.clear();
			},
		});

		// Initialize the toolbar
		ui.toolbarInit((tool: Tool) => {
			this.currentTool = tool;
			this.ui.setCursor(this.canvas, this.currentTool);
			if (tool !== "selector") this.renderer.DeselectAll();
		});
	}

	private cancel() {
		if (this.isErasing) this.renderer.cancelEraser();

		this.endDrawing();
		this.endErasing();
	}
	private setMouse(newPos: Vector) {
		this.mouse.x = newPos.x;
		this.mouse.y = newPos.y;
	}
	private getMouseLocation(): Vector {
		return this.mouse.clone();
	}

	/* Event Handlers  */
	private handlePointerDown(evt: MouseEvent) {
		// this.ui.disableNavigationBarPointerEvents();
		this.ui.disableAppPointerEvents();
		this.setMouse(this.viewport.getMouse(evt));

		if (this.keyboard.isPressed("space")) return;

		// For drag Ones
		this.drag.dragStart(this.mouse.clone());

		if (this.isCurrentTool("selector")) {
			this.renderer.DeselectAll();
			const element = this.renderer.getIntersectingElement(
				this.getMouseLocation()
			);
			if (element) this.renderer.Select(element);

			return;
		}
		if (evt.button === MOUSE_BUTTONS.LMB) {
			// Brush Mode
			if (this.isCurrentTool("brush")) {
				this.renderer.onBeginStroke(this.mouse.clone(), {
					...this.ui.drawingState,
				});
				this.startDrawing();
			}
			// Eraser Mode
			else if (this.isCurrentTool("eraser")) {
				this.startErasing();
				this.renderer.Erase(this.getMouseLocation());
			}

			// Rectangle
			else if (this.isCurrentTool("rect")) {
				this.renderer.BeginRect(
					this.getMouseLocation(),
					{
						...this.ui.drawingState,
					},
					0.5
				);
			}
			// Circle
			else if (this.isCurrentTool("circle")) {
				this.renderer.BeginCircle(this.getMouseLocation(), {
					...this.ui.drawingState,
				});
			}
		}
	}
	// Mouse Move
	private handlePointerMove(evt: MouseEvent) {
		this.setMouse(this.viewport.getMouse(evt));

		if (this.keyboard.isPressed("space")) return;

		// Dragger
		this.drag.dragTo(this.mouse.clone());

		// Draw
		if (this.isCurrentTool("brush") && this.isDrawing) {
			this.renderer.onStroke(Vector.from(this.getMouseLocation()));
		}

		// Erase
		if (this.isCurrentTool("eraser") && this.isErasing) {
			this.renderer.Erase(this.getMouseLocation());
		}

		if (this.isCurrentTool("rect") && this.drag.isDragging()) {
			this.renderer.DrawRect(
				this.drag,
				this.keyboard.isPressed("", { shift: true })
			);
		}

		if (this.isCurrentTool("circle") && this.drag.isDragging()) {
			this.renderer.DrawCircle(this.drag);
		}
	}
	// Mouse Up
	private handlePointerUp(evt: MouseEvent) {
		// this.ui.enableNavEvents();
		this.ui.enableAppPointerEvents();
		this.endDrawing();
		this.endErasing();

		// Brush
		if (evt.button === MOUSE_BUTTONS.LMB) {
			if (this.isCurrentTool("brush")) {
				this.renderer.onStrokeEnd();
			}
			// Eraser
			if (this.isCurrentTool("eraser")) {
				this.renderer.onEraseEnd();
			}

			if (this.isCurrentTool("rect")) {
				this.renderer.RectEnd();
			}

			if (this.isCurrentTool("circle")) {
				this.renderer.EndCircle();
			}
		}
		if (this.drag.isDragging()) this.drag.stop();
	}

	// History handle
	private historyHandler(type: UndoOrRedo, action: HistoryAction) {
		let rendererUndoRedoHandler =
			type === "undo"
				? this.renderer.applyUndo.bind(this.renderer)
				: this.renderer.applyRedo.bind(this.renderer);

		switch (action.type) {
			case "add_element":
			case "erase":
			case "clear_all": {
				rendererUndoRedoHandler(action);
				break;
			}
		}
	}

	private handleUndo() {
		const lastAction = this._history.undo();

		if (!lastAction) return;

		this.historyHandler("undo", lastAction);
	}

	private handleRedo() {
		const lastAction = this._history.redo();

		if (!lastAction) return;

		this.historyHandler("redo", lastAction);
	}
	// Keyboard class handlers
	private handleKeyDown(evt: AppKeyboardEvent) {
		const { isPressed } = evt;
		if (isPressed("z", { ctrl: true, shift: true })) {
			this.handleRedo();
		}

		if (isPressed("z", { ctrl: true })) {
			this.handleUndo();
		}

		if (isPressed("0", { ctrl: true })) {
			this.viewport.reset();
		}

		if (isPressed("escape")) {
			this.cancel();
		}

		if (isPressed("=")) {
			this.viewport.zoomCanvas(-1);
		}

		if (isPressed("-")) {
			this.viewport.zoomCanvas(1);
		}
	}
	// Keyboard class Handlers
	private handleKeyUp(_evt: AppKeyboardEvent) {}

	// Register Events
	private addEventListeners() {
		const pointerDownHandler = this.handlePointerDown.bind(this);
		const pointerUpHandler = this.handlePointerUp.bind(this);
		const pointerMoveHandler = this.handlePointerMove.bind(this);

		this.refHandlers = {
			...this.refHandlers,
			pointerDownHandler,
			pointerMoveHandler,
			pointerUpHandler,
		};

		this.canvas.addEventListener("pointerdown", pointerDownHandler);
		this.canvas.addEventListener("pointerup", pointerUpHandler);
		this.canvas.addEventListener("mousemove", pointerMoveHandler);
	}
}

export default Application;
