import Application from "./app";
import Keyboard, { isPressedFn } from "./keyboard";
import UI from "./ui";
import Vector from "./vector";

class Viewport {
	private canvas: HTMLCanvasElement;
	private ui: UI;
	private app: Application;
	private keyboard: Keyboard;

	center: Vector;
	private _zoom = 1;
	private _offset: Vector;

	private drag = {
		start: new Vector(0),
		end: new Vector(0),
		offset: new Vector(0),
		active: false,
	};

	constructor(
		ctx: CanvasRenderingContext2D,
		keyboard: Keyboard,
		app: Application,
		ui: UI
	) {
		this.canvas = ctx.canvas;
		this.center = new Vector(this.canvas.width / 2, this.canvas.height / 2);
		this._offset = this.center.multiplyScalar(-1);

		this.ui = ui;
		this.keyboard = keyboard;
		this.app = app;
		this.keyboard.on("keydown", this.onPanStart.bind(this));
		this.keyboard.on("keyup", this.onPanEnd.bind(this));

		this.addEventListeners();
	}

	get zoom() {
		return this._zoom;
	}
	get offset() {
		return this._offset.add(this.drag.offset);
	}

	resetZoom() {
		this._zoom = 1;
	}

	reset() {
		this.resetZoom();
		this._offset = this.center.multiplyScalar(-1);
	}
	getMouse(evt: MouseEvent) {
		return new Vector(evt.offsetX, evt.offsetY)
			.subtract(this.center)
			.multiplyScalar(this._zoom)
			.subtract(this._offset);
	}

	private resetDrag() {
		this.drag = {
			start: new Vector(0),
			end: new Vector(0),
			offset: new Vector(0),
			active: false,
		};
	}
	private onPanStart(isPressed: isPressedFn) {
		if (isPressed("space") && !this.drag.active) {
			this.canvas.style.cursor = "grab";
		}
	}
	private onPanEnd(_: any, key: string) {
		if (key === "space") {
			this.ui.setCursor(this.canvas, this.app.currentTool);
			this.drag.active = false;
			this._offset = this._offset.add(this.drag.offset);
			this.resetDrag();
		}
	}

	private addEventListeners() {
		this.canvas.addEventListener("wheel", this.handleWheel.bind(this));
		this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
		this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
		this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
	}

	private handleMouseDown(evt: MouseEvent) {
		if (this.keyboard.isPressed("space") && evt.button == 0) {
			this.canvas.style.cursor = "grabbing";
			this.drag.start = this.getMouse(evt);
			this.drag.active = true;
		}
	}
	private handleMouseMove(evt: MouseEvent) {
		if (this.drag.active) {
			this.drag.end = this.getMouse(evt);
			this.drag.offset = this.drag.end.subtract(this.drag.start);
		}
	}

	private handleMouseUp(_: MouseEvent) {
		if (this.drag.active) {
			this.canvas.style.cursor = "grab";
			this._offset = this._offset.add(this.drag.offset);
			this.resetDrag();
		}
	}

	private handleWheel(evt: WheelEvent) {
		const direction = Math.sign(evt.deltaY);
		const step = 0.1;
		this._zoom = Math.max(0, Math.min(5, this._zoom + direction * step));
	}
}
export default Viewport;
