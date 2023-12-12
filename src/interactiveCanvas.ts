import Application, { MOUSE_BUTTONS } from "./app";
import Drag from "./drag";
import Keyboard from "./keyboard";
import Renderer from "./renderer";
import UI from "./ui";
import Vector from "./vector";
import Viewport from "./viewport";

class InteractiveCanvas {
	ctx: CanvasRenderingContext2D;
	drawingCtx: CanvasRenderingContext2D;
	renderer: Renderer;
	viewport: Viewport;
	history: History;
	ui: UI;
	app: Application;
	keyboard: Keyboard;
	drag = new Drag();

	private isDrawing = false;
	private isErasing = false;

	private mouse = new Vector(0);

	private refHandlers!: {
		pointerDownHandler: (evt: PointerEvent) => void;
		pointerUpHandler: (evt: PointerEvent) => void;
		pointerMoveHandler: (evt: PointerEvent) => void;
		pointerLeaveHandler: (evt: PointerEvent) => void;
	};

	constructor(
		contexts: {
			interactiveCanvasCtx: CanvasRenderingContext2D;
			drawingCanvasCtx: CanvasRenderingContext2D;
		},
		app: Application,
		renderer: Renderer,
		keyboard: Keyboard,
		viewport: Viewport,
		history: History,
		ui: UI
	) {
		this.ctx = contexts.interactiveCanvasCtx;
		this.drawingCtx = contexts.drawingCanvasCtx;
		this.app = app;
		this.history = history;
		this.renderer = renderer;
		this.viewport = viewport;
		this.keyboard = keyboard;
		this.ui = ui;

		this.addEventListeners();
	}

	public destroy() {
		const { pointerDownHandler, pointerMoveHandler, pointerUpHandler } =
			this.refHandlers;

		const interactiveCanvas = this.ctx.canvas;

		interactiveCanvas.removeEventListener("pointerdown", pointerDownHandler);
		interactiveCanvas.removeEventListener("pointerup", pointerUpHandler);
		interactiveCanvas.removeEventListener("pointermove", pointerMoveHandler);
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

	private cancelAction() {
		if (this.isErasing) this.renderer.cancelEraser();

		this.endDrawing();
		this.endErasing();
	}
	private setMouse(newPos: Vector) {
		this.mouse.x = newPos.x;
		this.mouse.y = newPos.y;
	}

	getMouseLocation(): Vector {
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

			if (this.app.isCurrentTool("selector")) {
				this.renderer.DeselectAll();
				const element = this.renderer.getIntersectingElement(
					this.getMouseLocation()
				);
				if (element) this.renderer.Select(element);

				return;
			}
			// Brush Mode
			if (this.app.isCurrentTool("brush")) {
				this.renderer.onBeginStroke(this.mouse.clone(), {
					...this.ui.drawingState,
				});
				this.startDrawing();
			}
			// Eraser Mode
			else if (this.app.isCurrentTool("eraser")) {
				this.startErasing();
				this.renderer.Erase(this.getMouseLocation());
			}

			// Rectangle
			else if (this.app.isCurrentTool("rect")) {
				this.renderer.BeginRect(
					this.getMouseLocation(),
					{
						...this.ui.drawingState,
					},
					0.5
				);
			}
			// Circle
			else if (this.app.isCurrentTool("circle")) {
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
		if (this.app.isCurrentTool("brush") && this.isDrawing) {
			this.renderer.onStroke(Vector.from(this.getMouseLocation()));
		}

		// Erase
		if (this.app.isCurrentTool("eraser") && this.isErasing) {
			this.renderer.Erase(this.getMouseLocation());
		}

		if (this.app.isCurrentTool("rect") && this.drag.isDragging()) {
			this.renderer.DrawRect(
				this.drag,
				this.keyboard.isPressed("", { shift: true })
			);
		}

		if (this.app.isCurrentTool("circle") && this.drag.isDragging()) {
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
			if (this.app.isCurrentTool("brush")) {
				this.renderer.onStrokeEnd();
			}
			// Eraser
			if (this.app.isCurrentTool("eraser")) {
				this.renderer.onEraseEnd();
			}

			if (this.app.isCurrentTool("rect")) {
				this.renderer.RectEnd();
			}

			if (this.app.isCurrentTool("circle")) {
				this.renderer.EndCircle();
			}
		}
		if (this.drag.isDragging()) this.drag.stop();
	}

	private handlePointerLeave(_evt: PointerEvent) {
		this.cancelAction();
	}

	// Register Events
	private addEventListeners() {
		const pointerDownHandler = this.handlePointerDown.bind(this);
		const pointerUpHandler = this.handlePointerUp.bind(this);
		const pointerMoveHandler = this.handlePointerMove.bind(this);
		const pointerLeaveHandler = this.handlePointerLeave.bind(this);

		this.refHandlers = {
			...this.refHandlers,
			pointerDownHandler,
			pointerMoveHandler,
			pointerUpHandler,
			pointerLeaveHandler,
		};

		const { canvas: interactiveCanvas } = this.ctx;
		interactiveCanvas.addEventListener("pointerdown", pointerDownHandler);
		interactiveCanvas.addEventListener("pointerup", pointerUpHandler);
		interactiveCanvas.addEventListener("pointermove", pointerMoveHandler);
		document.addEventListener("pointerleave", pointerLeaveHandler);
	}
}

export default InteractiveCanvas;
