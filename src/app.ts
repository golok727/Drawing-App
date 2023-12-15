import UI from "./ui";
import AppHistory, { HistoryAction, UndoOrRedo } from "./history";
import { Tool } from "./toolbar";
import Renderer from "./renderer";
import Viewport from "./viewport";
import Keyboard, { AppKeyboardEvent } from "./keyboard";
import { RoughCanvas } from "roughjs/bin/canvas";
import rough from "roughjs";
import InteractiveCanvas from "./interactiveCanvas";
import StaticCanvas from "./staticCanvas";
import DestroyableEvent from "./destroyableEvent";

export const MOUSE_BUTTONS = {
	LMB: 0,
	MMB: 1,
	RMB: 2,
};

export type Vec2 = [number, number];

class Application extends DestroyableEvent {
	private staticCanvasElement: HTMLCanvasElement =
		document.createElement("canvas");
	private interactiveCanvasElement: HTMLCanvasElement =
		document.createElement("canvas");

	private interactiveCanvas: InteractiveCanvas;
	private staticCanvas: StaticCanvas;

	private drawingCtx!: CanvasRenderingContext2D;
	private interactiveCtx!: CanvasRenderingContext2D;
	private roughCanvas!: RoughCanvas;

	renderer: Renderer;
	ui = new UI();
	history = new AppHistory();
	keyboard: Keyboard;
	viewport: Viewport;

	currentTool: Tool = "brush";

	constructor(container: HTMLElement) {
		super();
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

		this.setupUI();
		this.ui.makeToolBar(this.setTool.bind(this));

		this.interactiveCanvas = new InteractiveCanvas(this);
		this.staticCanvas = new StaticCanvas(this.renderer, this.viewport);

		this.listen();
	}
	get cWidth() {
		return this.staticCanvasElement.offsetWidth;
	}
	get cHeight() {
		return this.staticCanvasElement.offsetHeight;
	}

	public dispose() {
		this.viewport.destroy();
		this.interactiveCanvas.destroy();
		this.keyboard.destroy();
		this.ui.destroy();
		this.destroy();
		this.history.clear();
	}

	public render() {
		this.interactiveCanvas.render();
		this.staticCanvas.render();
	}

	private setupCanvas(container: HTMLElement) {
		const {
			staticCanvasElement: staticCanvas,
			interactiveCanvasElement: interactiveCanvas,
		} = this;
		this.ui.setCursor(interactiveCanvas, this.currentTool);

		container.style.position = "relative";

		interactiveCanvas.id = "canvas-interactive";
		staticCanvas.id = "canvas-static";

		interactiveCanvas.style.position = "absolute";
		interactiveCanvas.style.inset = "0";
		interactiveCanvas.style.zIndex = "10";
		interactiveCanvas.style.pointerEvents = "all";

		container.appendChild(this.interactiveCanvasElement);
		container.appendChild(this.staticCanvasElement);

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
		this.roughCanvas = rough.canvas(this.staticCanvasElement);

		if (!this.drawingCtx)
			throw new Error("Canvas API is not supported in your browser");

		if (!this.interactiveCtx)
			throw new Error("Canvas API is not supported in your browser");
	}

	public isCurrentTool(tool: Tool) {
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
		this.ui.setCursor(this.interactiveCanvasElement, this.currentTool);
		if (tool !== "selector") this.renderer.DeselectAll();
	}
	private changeTool(tool: Tool) {
		this.setTool(tool);
		this.ui.toolbar?.setTool(this.currentTool);
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
			this.interactiveCanvas.cancelAction();
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
	private handleKeyUp(evt: AppKeyboardEvent) {
		if (evt.isReleased("space")) {
			this.interactiveCanvas.drag.unpause();
		}
	}

	private handleResize(_evt: UIEvent) {
		const {
			staticCanvasElement: staticCanvas,
			interactiveCanvasElement: interactiveCanvas,
		} = this;
		console.log("resize");
		staticCanvas.width = this.staticCanvasElement.offsetWidth;
		staticCanvas.height = this.staticCanvasElement.offsetHeight;
		interactiveCanvas.width = this.staticCanvasElement.offsetWidth;
		interactiveCanvas.height = this.staticCanvasElement.offsetHeight;
	}

	protected override addEventListeners() {
		const resizeHandler = this.handleResize.bind(this);

		window.addEventListener("resize", resizeHandler);

		return () => {
			window.removeEventListener("resize", resizeHandler);
		};
	}
}

export default Application;
