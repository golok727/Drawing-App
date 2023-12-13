import DestroyableEvent from "./destroyableEvent";
import Application, { MOUSE_BUTTONS } from "./app";
import Drag from "./drag";
import Vector from "./vector";

class InteractiveCanvas extends DestroyableEvent {
	ctx: CanvasRenderingContext2D;
	drawingCtx: CanvasRenderingContext2D;
	app: Application;
	drag = new Drag();

	private isDrawing = false;
	private isErasing = false;

	private mouse = new Vector(0);

	constructor(app: Application) {
		super();
		this.app = app;

		this.ctx = this.app.renderer.interactiveCtx;
		this.drawingCtx = this.app.renderer.drawingCtx;

		this.listen();
	}

	get cWidth() {
		return this.ctx.canvas.offsetWidth;
	}
	get cHeight() {
		return this.ctx.canvas.offsetHeight;
	}

	public draw() {
		for (const element of this.app.renderer.selectedElements) {
			const box = element.boundingBox;
			const padding = 10;

			this.ctx.strokeStyle = "blue";
			this.ctx.lineWidth = 2;
			this.ctx.beginPath();
			this.ctx.rect(
				box.x - padding,
				box.y - padding,
				box.w + 2 * padding,
				box.h + 2 * padding
			);
			this.ctx.stroke();
		}
	}

	public render() {
		this.ctx.clearRect(0, 0, this.cWidth, this.cHeight);
		this.ctx.save();
		this.ctx.translate(this.app.viewport.center.x, this.app.viewport.center.y);
		this.ctx.scale(1 / this.app.viewport.zoom, 1 / this.app.viewport.zoom);
		this.ctx.translate(this.app.viewport.offset.x, this.app.viewport.offset.y);

		this.draw();
		this.ctx.restore();
	}

	public cancelAction() {
		if (this.isErasing) this.app.renderer.cancelEraser();

		this.endDrawing();
		this.endErasing();
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

	private setMouse(newPos: Vector) {
		this.mouse.x = newPos.x;
		this.mouse.y = newPos.y;
	}

	getMouseLocation(): Vector {
		return this.mouse.clone();
	}

	/* Event Handlers  */
	private handlePointerDown(evt: MouseEvent) {
		this.app.ui.disableAppPointerEvents();
		this.setMouse(this.app.viewport.getMouse(evt));

		if (this.app.keyboard.isPressed("space")) return;

		// For drag Ones
		if (evt.button === MOUSE_BUTTONS.LMB) {
			this.drag.dragStart(this.mouse.clone());

			if (this.app.isCurrentTool("selector")) {
				this.app.renderer.DeselectAll();
				const element = this.app.renderer.getIntersectingElementOnPoint(
					this.getMouseLocation()
				);
				if (element) this.app.renderer.Select(element);

				return;
			}
			// Brush Mode
			if (this.app.isCurrentTool("brush")) {
				this.app.renderer.onBeginStroke(this.mouse.clone(), {
					...this.app.ui.drawingState,
				});
				this.startDrawing();
			}
			// Eraser Mode
			else if (this.app.isCurrentTool("eraser")) {
				this.startErasing();
				this.app.renderer.Erase(this.getMouseLocation());
			}

			// Rectangle
			else if (this.app.isCurrentTool("rect")) {
				this.app.renderer.BeginRect(
					this.getMouseLocation(),
					{
						...this.app.ui.drawingState,
					},
					0.5
				);
			}
			// Circle
			else if (this.app.isCurrentTool("circle")) {
				this.app.renderer.BeginCircle(this.getMouseLocation(), {
					...this.app.ui.drawingState,
				});
			}
		}
	}
	// Mouse Move
	private handlePointerMove(evt: MouseEvent) {
		this.setMouse(this.app.viewport.getMouse(evt));

		if (this.app.keyboard.isPressed("space")) return;

		// Dragger
		this.drag.dragTo(this.mouse.clone());

		// Draw
		if (this.app.isCurrentTool("brush") && this.isDrawing) {
			this.app.renderer.onStroke(Vector.from(this.getMouseLocation()));
		}

		// Erase
		if (this.app.isCurrentTool("eraser") && this.isErasing) {
			this.app.renderer.Erase(this.getMouseLocation());
		}

		if (this.app.isCurrentTool("rect") && this.drag.isDragging()) {
			this.app.renderer.DrawRect(
				this.getMouseLocation(),
				this.drag,
				this.app.keyboard.isPressed("", { shift: true })
			);
		}

		if (this.app.isCurrentTool("circle") && this.drag.isDragging()) {
			this.app.renderer.DrawCircle(
				this.drag,
				this.app.keyboard.isPressed("", { shift: true })
			);
		}
	}
	// Mouse Up
	private handlePointerUp(evt: MouseEvent) {
		this.app.ui.enableAppPointerEvents();
		this.endDrawing();
		this.endErasing();

		// Brush
		if (evt.button === MOUSE_BUTTONS.LMB) {
			if (this.app.isCurrentTool("brush")) {
				this.app.renderer.onStrokeEnd();
			}
			// Eraser
			if (this.app.isCurrentTool("eraser")) {
				this.app.renderer.onEraseEnd();
			}

			if (this.app.isCurrentTool("rect")) {
				this.app.renderer.RectEnd();
			}

			if (this.app.isCurrentTool("circle")) {
				this.app.renderer.EndCircle();
			}
		}
		if (this.drag.isDragging()) this.drag.stop();
	}

	private handlePointerLeave(_evt: PointerEvent) {
		this.cancelAction();
	}

	// Register Events
	protected override addEventListeners() {
		const pointerDownHandler = this.handlePointerDown.bind(this);
		const pointerUpHandler = this.handlePointerUp.bind(this);
		const pointerMoveHandler = this.handlePointerMove.bind(this);
		const pointerLeaveHandler = this.handlePointerLeave.bind(this);

		const { canvas: interactiveCanvas } = this.ctx;
		interactiveCanvas.addEventListener("pointerdown", pointerDownHandler);
		interactiveCanvas.addEventListener("pointerup", pointerUpHandler);
		interactiveCanvas.addEventListener("pointermove", pointerMoveHandler);
		document.addEventListener("pointerleave", pointerLeaveHandler);

		return () => {
			interactiveCanvas.removeEventListener("pointerdown", pointerDownHandler);
			interactiveCanvas.removeEventListener("pointerup", pointerUpHandler);
			interactiveCanvas.removeEventListener("pointermove", pointerMoveHandler);
			document.removeEventListener("pointerleave", pointerLeaveHandler);
		};
	}
}

export default InteractiveCanvas;
