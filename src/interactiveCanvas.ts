import Application, { MOUSE_BUTTONS } from "./app";
import Drag from "./drag";
import Vector from "./vector";
import BoundingBox from "./boundingBox";
import EventHandlerX from "./event";

class InteractiveCanvas {
	ctx: CanvasRenderingContext2D;
	drawingCtx: CanvasRenderingContext2D;
	app: Application;
	drag: Drag;

	private isDrawing = false;
	private isErasing = false;

	private mouse = new Vector(0);

	constructor(app: Application) {
		this.drag = new Drag();
		this.app = app;

		this.ctx = this.app.renderer.interactiveCtx;
		this.drawingCtx = this.app.renderer.drawingCtx;
		this.addEventListeners();
	}

	get cWidth() {
		return this.ctx.canvas.width;
	}
	get cHeight() {
		return this.ctx.canvas.height;
	}

	public addHandle(x: number, y: number, size: number = 10) {
		this.ctx.beginPath();
		this.ctx.roundRect(x, y, size, size, 2);
		this.ctx.fill();
		this.ctx.stroke();
	}

	public drawHandles(boundingBox: BoundingBox) {
		const { tl, tr, bl, br, mid, top, left, right, bottom } = boundingBox;

		const { ctx } = this;

		const size = 10;
		const hSize = size / 2;
		ctx.fillStyle = "black";
		ctx.strokeStyle = "rebeccapurple";
		ctx.lineWidth = 3 * Math.max(1, this.app.viewport.zoom);

		this.addHandle(tl.x - hSize, tl.y - hSize, size);

		this.addHandle(tr.x - hSize, tr.y - hSize, size);

		this.addHandle(bl.x - hSize, bl.y - hSize, size);

		this.addHandle(br.x - hSize, br.y - hSize, size);

		this.addHandle(left - hSize, mid.y);
		this.addHandle(right - hSize, mid.y);
		this.addHandle(mid.x, top - hSize);
		this.addHandle(mid.x, bottom - hSize);
	}

	public drawSelectionBoundingBox() {
		for (const element of this.app.renderer.selectedElements) {
			const box = element.boundingBox;

			this.ctx.strokeStyle = "rebeccapurple";
			this.ctx.lineWidth = 2 * Math.max(1, this.app.viewport.zoom);
			this.ctx.beginPath();
			this.ctx.rect(box.x, box.y, box.w, box.h);
			this.ctx.stroke();
			// this.drawHandles(box);
		}
	}
	drawSelection() {
		if (
			this.drag.isDragging() &&
			this.app.isCurrentTool("selector") &&
			!this.drag.offset.isZero()
		) {
			this.ctx.beginPath();
			this.ctx.strokeStyle = "rebeccapurple";
			this.ctx.fillStyle = "rgba(102, 51, 153, 0.2)";
			this.ctx.lineWidth = 2 * Math.max(1, this.app.viewport.zoom);

			this.ctx.rect(
				this.drag.state.start.x,
				this.drag.state.start.y,
				this.drag.offset.x,
				this.drag.offset.y
			);
			this.ctx.stroke();
			this.ctx.fill();
		}
	}

	public render() {
		this.ctx.clearRect(0, 0, this.cWidth, this.cHeight);
		this.ctx.save();
		this.ctx.translate(this.app.viewport.center.x, this.app.viewport.center.y);
		this.ctx.scale(1 / this.app.viewport.zoom, 1 / this.app.viewport.zoom);
		this.ctx.translate(this.app.viewport.offset.x, this.app.viewport.offset.y);

		this.drawSelectionBoundingBox();
		this.drawSelection();
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

		if (this.app.keyboard.isPressed("space") && !this.app.isCurrentTool("rect"))
			return;

		// Dragger
		this.drag.dragTo(this.mouse.clone());

		if (this.app.isCurrentTool("selector") && this.drag.isDragging()) {
			const boundingBox = new BoundingBox(
				this.drag.state.start.x,
				this.drag.state.start.y,
				Math.abs(this.drag.offset.x),
				Math.abs(this.drag.offset.y)
			);
			this.app.renderer.SelectInsideBoundingBox(boundingBox);
		}
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
				this.app.keyboard.isPressed("", { shift: true }),
				this.app.keyboard.isPressed.bind(this.app.keyboard)
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
		this.drag.stop();

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
	private addEventListeners() {
		const { canvas: interactiveCanvas } = this.ctx;
		EventHandlerX.on(
			interactiveCanvas,
			"pointerup",
			this.handlePointerUp.bind(this)
		);
		EventHandlerX.on(
			interactiveCanvas,
			"pointermove",
			this.handlePointerMove.bind(this)
		);
		EventHandlerX.on(
			interactiveCanvas,
			"pointerdown",
			this.handlePointerDown.bind(this)
		);
		EventHandlerX.on(
			document,
			"pointerleave",
			this.handlePointerLeave.bind(this)
		);
	}
}

export default InteractiveCanvas;
