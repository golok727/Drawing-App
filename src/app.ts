import UI from "./ui";
import AppHistory, { HistoryAction, UndoOrRedo } from "./history";
import { Tool } from "./toolbar";
import Vector from "./vector";
import Renderer from "./renderer";
import Viewport from "./viewport";
import Keyboard, { AppKeyboardEvent } from "./keyboard";
import Drag from "./drag";
import { RoughCanvas } from "roughjs/bin/canvas";
import rough from "roughjs";

export const MOUSE_BUTTONS = {
	LMB: 0,
	MMB: 1,
	RMB: 2,
};

export type Vec2 = [number, number];

class Application {
	private staticCanvas: HTMLCanvasElement = document.createElement("canvas");
	private interactiveCanvas: HTMLCanvasElement =
		document.createElement("canvas");

	private drawingCtx!: CanvasRenderingContext2D;
	private interactiveCtx!: CanvasRenderingContext2D;
	private roughCanvas!: RoughCanvas;

	private renderer: Renderer;
	private ui = new UI();
	private history = new AppHistory();
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
		pointerLeaveHandler: (evt: PointerEvent) => void;
		resizeHandler: (evt: UIEvent) => void;
	};

	constructor(container: HTMLElement) {
		this.setupCanvas(container);

		this.keyboard = new Keyboard(
			this.handleKeyDown.bind(this),
			this.handleKeyUp.bind(this)
		);

		this.viewport = new Viewport(
			this.interactiveCtx,
			this.keyboard,
			this,
			this.ui
		);

		this.renderer = new Renderer(
			this.drawingCtx,
			this.interactiveCtx,
			this.roughCanvas,
			this.viewport,
			this.history
		);

		this.addEventListeners();
		this.setupUI();
		this.ui.makeToolBar(this.setTool.bind(this));
	}
	get cWidth() {
		return this.staticCanvas.offsetWidth;
	}
	get cHeight() {
		return this.staticCanvas.offsetHeight;
	}
	public destroy() {
		const {
			pointerDownHandler,
			pointerMoveHandler,
			pointerUpHandler,
			resizeHandler,
		} = this.refHandlers;

		this.interactiveCanvas.removeEventListener(
			"pointerdown",
			pointerDownHandler
		);
		this.interactiveCanvas.removeEventListener("pointerup", pointerUpHandler);
		this.interactiveCanvas.removeEventListener(
			"pointermove",
			pointerMoveHandler
		);
		window.removeEventListener("resize", resizeHandler);
		this.keyboard.destroy();
	}

	public render() {
		const { drawingCtx, interactiveCtx } = this;

		drawingCtx.fillStyle = "black";
		const contexts = [interactiveCtx, drawingCtx];

		for (const ctx of contexts) {
			ctx.clearRect(0, 0, this.cWidth, this.cHeight);
		}

		drawingCtx.fillRect(0, 0, this.cWidth, this.cHeight);

		for (const ctx of contexts) {
			ctx.save();
			ctx.translate(this.viewport.center.x, this.viewport.center.y);
			ctx.scale(1 / this.viewport.zoom, 1 / this.viewport.zoom);
			ctx.translate(this.viewport.offset.x, this.viewport.offset.y);
		}

		this.renderer.Render();

		drawingCtx.restore();
		interactiveCtx.restore();
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
		const { staticCanvas, interactiveCanvas } = this;
		this.ui.setCursor(interactiveCanvas, this.currentTool);

		container.style.position = "relative";

		interactiveCanvas.id = "canvas-interactive";
		staticCanvas.id = "canvas-static";

		interactiveCanvas.style.position = "absolute";
		interactiveCanvas.style.inset = "0";
		interactiveCanvas.style.zIndex = "10";
		interactiveCanvas.style.pointerEvents = "all";

		container.appendChild(this.interactiveCanvas);
		container.appendChild(this.staticCanvas);

		for (const canvas of [staticCanvas, interactiveCanvas]) {
			canvas.classList.add("min-h-screen");
			canvas.classList.add("h-screen");

			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		}

		this.drawingCtx = staticCanvas.getContext("2d") as CanvasRenderingContext2D;
		this.interactiveCtx = interactiveCanvas.getContext(
			"2d"
		) as CanvasRenderingContext2D;
		this.roughCanvas = rough.canvas(this.staticCanvas);

		if (!this.drawingCtx)
			throw new Error("Canvas API is not supported in your browser");

		if (!this.interactiveCtx)
			throw new Error("Canvas API is not supported in your browser");
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
		ui.addComponent(document.querySelector("[data-clear-all-btn]")!, {
			click: () => {
				this.renderer.clear();
			},
		});

		ui.addComponent(document.getElementById("zoom-in-btn")!, {
			click: () => {
				this.viewport.zoomCanvas(-1);
			},
		});

		ui.addComponent(document.getElementById("zoom-out-btn")!, {
			click: () => {
				this.viewport.zoomCanvas(1);
			},
		});

		// Initialize the toolbar
	}

	private setTool(tool: Tool) {
		this.currentTool = tool;
		this.ui.setCursor(this.interactiveCanvas, this.currentTool);
		if (tool !== "selector") this.renderer.DeselectAll();
	}
	private changeTool(tool: Tool) {
		this.setTool(tool);
		this.ui.toolbar?.setTool(this.currentTool);
	}

	private cancelAction() {
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
		this.ui.disableAppPointerEvents();
		this.setMouse(this.viewport.getMouse(evt));

		if (this.keyboard.isPressed("space")) return;

		// For drag Ones
		if (evt.button === MOUSE_BUTTONS.LMB) {
			this.drag.dragStart(this.mouse.clone());

			if (this.isCurrentTool("selector")) {
				this.renderer.DeselectAll();
				const element = this.renderer.getIntersectingElement(
					this.getMouseLocation()
				);
				if (element) this.renderer.Select(element);

				return;
			}
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
			this.renderer.DrawCircle(
				this.drag,
				this.keyboard.isPressed("", { shift: true })
			);
		}
	}
	// Mouse Up
	private handlePointerUp(evt: MouseEvent) {
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

	private handlePointerLeave(_evt: PointerEvent) {
		this.cancelAction();
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
		const lastAction = this.history.undo();

		if (!lastAction) return;

		this.historyHandler("undo", lastAction);
	}

	private handleRedo() {
		const lastAction = this.history.redo();

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
			this.cancelAction();
		}

		if (isPressed("=")) {
			this.viewport.zoomCanvas(-1);
		}

		if (isPressed("-")) {
			this.viewport.zoomCanvas(1);
		}

		if (isPressed("a")) {
			this.changeTool("selector");
		}

		if (isPressed("b")) {
			this.changeTool("brush");
		}

		if (isPressed("e")) {
			this.changeTool("eraser");
		}

		if (isPressed("r")) {
			this.changeTool("rect");
		}

		if (isPressed("c")) {
			this.changeTool("circle");
		}

		if (isPressed("l")) {
			this.changeTool("line");
		}

		if (isPressed("h")) {
			this.changeTool("highlighter");
		}

		if (isPressed("i")) {
			this.changeTool("texture");
		}
	}

	// Keyboard class Handlers
	private handleKeyUp(_evt: AppKeyboardEvent) {}

	private handleResize(_evt: UIEvent) {
		const { staticCanvas, interactiveCanvas } = this;

		staticCanvas.width = this.staticCanvas.offsetWidth;
		staticCanvas.height = this.staticCanvas.offsetHeight;
		interactiveCanvas.width = this.staticCanvas.offsetWidth;
		interactiveCanvas.height = this.staticCanvas.offsetHeight;
	}

	// Register Events
	private addEventListeners() {
		const pointerDownHandler = this.handlePointerDown.bind(this);
		const pointerUpHandler = this.handlePointerUp.bind(this);
		const pointerMoveHandler = this.handlePointerMove.bind(this);
		const pointerLeaveHandler = this.handlePointerLeave.bind(this);
		const resizeHandler = this.handleResize.bind(this);
		this.refHandlers = {
			...this.refHandlers,
			pointerDownHandler,
			pointerMoveHandler,
			pointerUpHandler,
			pointerLeaveHandler,
			resizeHandler,
		};

		this.interactiveCanvas.addEventListener("pointerdown", pointerDownHandler);
		this.interactiveCanvas.addEventListener("pointerup", pointerUpHandler);
		this.interactiveCanvas.addEventListener("pointermove", pointerMoveHandler);
		document.addEventListener("pointerleave", pointerLeaveHandler);
		window.addEventListener("resize", resizeHandler);
	}
}

export default Application;
