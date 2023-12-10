import Application, { MOUSE_BUTTONS } from "./app";
import Drag from "./drag";
import Keyboard, { AppKeyboardEvent } from "./keyboard";
import UI from "./ui";
import Vector from "./vector";

class Viewport {
	private interactiveCanvas: HTMLCanvasElement;
	private ui: UI;
	private app: Application;
	private keyboard: Keyboard;
	private zoomDisplay = document.getElementById(
		"zoom-display-value"
	) as HTMLDivElement;

	public center: Vector;
	private _zoom = 1;
	private _offset: Vector;

	private dragState = new Drag();

	constructor(
		interactiveCtx: CanvasRenderingContext2D,

		keyboard: Keyboard,
		app: Application,
		ui: UI
	) {
		this.interactiveCanvas = interactiveCtx.canvas;
		this.center = new Vector(
			this.interactiveCanvas.width / 2,
			this.interactiveCanvas.height / 2
		);
		this._offset = this.center.scale(-1);

		this.ui = ui;
		this.keyboard = keyboard;
		this.app = app;
		this.keyboard.on("keydown", this.onPanStart.bind(this));
		this.keyboard.on("keyup", this.onPanEnd.bind(this));

		this.addEventListeners();
		if (!this.zoomDisplay) {
			console.warn("Zoom value display container is empty");
		}
	}

	public get zoom() {
		return this._zoom;
	}
	public get offset() {
		return this._offset.add(this.dragState.offset);
	}

	public resetZoom() {
		this._zoom = 1;
		this.updateZoomDisplay();
	}

	public reset() {
		this.resetZoom();
		this._offset = this.center.scale(-1);
	}

	public zoomCanvas(direction: number, step = 0.1) {
		const maxZoomOut = 5;
		const maxZoomIn = 0.1;
		this._zoom = Math.max(
			maxZoomIn,
			Math.min(maxZoomOut, this._zoom + direction * step)
		);
		this.updateZoomDisplay();
	}

	public getMouse(evt: MouseEvent) {
		return new Vector(evt.offsetX, evt.offsetY)
			.subtract(this.center)
			.scale(this._zoom)
			.subtract(this._offset);
	}

	private updateZoomDisplay() {
		const zoomPercent = (1 / this.zoom) * 100;
		this.zoomDisplay.textContent = `${zoomPercent.toFixed(0)}%`;
	}

	private onPanStart(evt: AppKeyboardEvent) {
		if (evt.isPressed("space") && !this.dragState.isDragging()) {
			this.interactiveCanvas.style.cursor = "grab";
		}
	}
	private onPanEnd(evt: AppKeyboardEvent) {
		if (evt.key === "space") {
			this.ui.setCursor(this.interactiveCanvas, this.app.currentTool);
			this._offset = this._offset.add(this.dragState.offset);
			this.dragState.stop();
		}
	}

	private addEventListeners() {
		const { interactiveCanvas } = this;
		interactiveCanvas.addEventListener("wheel", this.handleWheel.bind(this));
		interactiveCanvas.addEventListener(
			"pointerdown",
			this.handlePointerDown.bind(this)
		);
		interactiveCanvas.addEventListener(
			"pointermove",
			this.handlePointerMove.bind(this)
		);
		interactiveCanvas.addEventListener(
			"pointerup",
			this.handlePointerUp.bind(this)
		);
	}

	private handlePointerDown(evt: PointerEvent) {
		if (
			(this.keyboard.isPressed("space") && evt.button == MOUSE_BUTTONS.LMB) ||
			evt.button === MOUSE_BUTTONS.MMB
		) {
			this.interactiveCanvas.style.cursor = "grabbing";
			this.dragState.dragStart(this.getMouse(evt));
		}
	}
	private handlePointerMove(evt: PointerEvent) {
		this.dragState.dragTo(this.getMouse(evt));
	}

	private handlePointerUp(evt: PointerEvent) {
		if (this.dragState.isDragging()) {
			this.interactiveCanvas.style.cursor = "grab";
			this._offset = this._offset.add(this.dragState.offset);
			this.dragState.stop();
		}

		if (evt.button === MOUSE_BUTTONS.MMB) {
			this.ui.setCursor(this.interactiveCanvas, this.app.currentTool);
		}
	}

	private handleWheel(evt: WheelEvent) {
		const direction = Math.sign(evt.deltaY);
		this.zoomCanvas(direction);
	}
}
export default Viewport;
