import CanvasElement, { ElementTypes } from "./element";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from "./utils";

type BrushTypes = "normal" | "tapered";
// Strokes
export class StrokeElement extends CanvasElement {
	private brushType: BrushTypes = "normal";
	private _points: number[][] = [];
	private _done = false;
	private computedPath!: Path2D;

	constructor() {
		super(ElementTypes.Stroke);
	}

	addPoint(point: number[]) {
		this._points.push(point);
	}
	setDone(val: boolean) {
		this._done = val;
	}

	private calcuatePath() {
		console.log(1);
		const outlinePoints = getStroke(this._points, {
			simulatePressure: false,
			size: this.styles.lineWidth,
			end: { taper: 3 },
		});
		const pathData = getSvgPathFromStroke(outlinePoints);
		this.computedPath = new Path2D(pathData);
	}

	private freeDraw(ctx: CanvasRenderingContext2D) {
		if (!this._done) this.calcuatePath();
		ctx.fillStyle = this.styles.strokeColor;
		ctx.fill(this.computedPath);
	}

	private drawStroke(ctx: CanvasRenderingContext2D) {
		switch (this.brushType) {
			case "normal":
				this.freeDraw(ctx);
				break;
			case "tapered":
				break;
		}
	}

	override draw(ctx: CanvasRenderingContext2D): void {
		this.drawStroke(ctx);
	}
}
