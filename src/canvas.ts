import UI from "./ui";
import AppHistory from "./history";
type Vec2 = [number, number];

class Canvas {
	canvas: HTMLCanvasElement = document.createElement("canvas");
	ctx: CanvasRenderingContext2D;
	cWidth: number;
	cHeight: number;
	centerX: number;
	centerY: number;

	private ui = new UI();
	private history = new AppHistory();

	private paths: Vec2[][] = [];

	private isDrawing = false;

	private mouse: { x: number; y: number } = { x: 0, y: 0 };

	constructor(container: HTMLElement) {
		this.canvas.style.cursor = "url(/cursor.png), default";
		this.canvas.className += "min-h-screen";
		// this.canvas.style.height = "100%";
		// this.canvas.style.width = "100%";

		container.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		if (!this.ctx)
			throw new Error("Canvas API is not supported in your browser");

		this.cWidth = this.canvas.offsetWidth;
		this.cHeight = this.canvas.offsetHeight;

		this.canvas.width = this.cWidth;
		this.canvas.height = this.cHeight;

		this.centerX = this.cWidth / 2;
		this.centerY = this.cHeight / 2;

		this.addEventListeners();
		this.setupUI();
	}
	private setupUI() {
		const { ui } = this;

		ui.addComponent(document.querySelector("[data-undo-btn]")!, {
			click: () => {
				console.log("Undo");
			},
		});

		ui.addComponent(document.querySelector("[data-redo-btn]")!, {
			click: () => {
				console.log("Redo");
			},
		});
	}
	private drawPath(path: Vec2[]) {
		const { ctx } = this;
		ctx.strokeStyle = "white";
		ctx.lineWidth = 3;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(...path[0]);
		for (let i = 1; i < path.length; i++) {
			ctx.lineTo(...path[i]);
		}
		ctx.stroke();
	}
	private drawPaths() {
		for (const path of this.paths) {
			this.drawPath(path);
		}
	}
	private handleMouseDown(evt: MouseEvent) {
		this.mouse.x = evt.offsetX;
		this.mouse.y = evt.offsetY;
		const mouse = this.mouseVec();

		this.paths.push([mouse]);

		this.isDrawing = true;
	}
	private handleMouseUp(_evt: MouseEvent) {
		this.isDrawing = false;
	}

	private handleMouseMove(evt: MouseEvent) {
		this.mouse.x = evt.offsetX;
		this.mouse.y = evt.offsetY;

		if (this.isDrawing) {
			let point = this.mouseVec();
			let currPath = this.paths[this.paths.length - 1];
			currPath.push(point);
		}
	}
	private mouseVec(): Vec2 {
		return [this.mouse.x, this.mouse.y];
	}

	private addEventListeners() {
		this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
		this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
		this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
	}

	private draw() {
		this.drawPaths();
	}
	render() {
		const { ctx } = this;
		ctx.clearRect(0, 0, this.cWidth, this.cHeight);
		this.draw();
	}
}

export default Canvas;
