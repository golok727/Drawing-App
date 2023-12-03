import Application from "./app";
import Keyboard, { isPressedFn } from "./keyboard";
import UI from "./ui";

class Viewport {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private ui: UI;
	private app: Application;
	private keyboard: Keyboard;
	private _zoom = 1;
	private isPanning = false;
	constructor(
		ctx: CanvasRenderingContext2D,
		keyboard: Keyboard,
		app: Application,
		ui: UI
	) {
		this.ctx = ctx;
		this.canvas = ctx.canvas;
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

	resetZoom() {
		this._zoom = 1;
	}

	reset() {
		this.resetZoom();
	}

	getMouse(evt: MouseEvent): [number, number] {
		return [evt.offsetX * this._zoom, evt.offsetY * this._zoom];
	}

	private onPanStart(isPressed: isPressedFn) {
		if (isPressed("space") && !this.isPanning) {
			this.canvas.style.cursor = "grab";
			this.isPanning = true;
		}
	}
	private onPanEnd(_: any, key: string) {
		if (key === "space") {
			this.ui.setCursor(this.canvas, this.app.currentTool);
			this.isPanning = false;
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
		}
	}

	private handleMouseUp(evt: MouseEvent) {
		if (this.isPanning) this.canvas.style.cursor = "grab";
	}

	private handleMouseMove(evt: MouseEvent) {}

	private handleWheel(evt: WheelEvent) {
		const direction = Math.sign(evt.deltaY);
		const step = 0.1;
		this._zoom = Math.max(0, Math.min(5, this._zoom + direction * step));
	}
}
export default Viewport;
