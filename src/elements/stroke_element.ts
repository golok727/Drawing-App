import CanvasElement, { ElementTypes } from "./element";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from "../utils";
import Vector from "../vector";
import { CanvasStyles } from "../styles";
import BoundingBox from "../bounding-box";

type BrushTypes = "normal" | "tapered";
// Strokes
export class StrokeElement extends CanvasElement {
	private brushType: BrushTypes = "normal";
	private _points: Vector[] = [];
	private _done = false;
	private computedPath!: Path2D;

	constructor(styles?: Partial<CanvasStyles>) {
		super(ElementTypes.Stroke);
		if (styles) {
			this.styles = { ...this.styles, ...styles };
		}
	}

	public addPoint(point: Vector) {
		this._points.push(point);
	}
	public setDone(val: boolean) {
		this._done = val;
		this.calculateBoundingBox();
	}
	public override calculateBoundingBox(): void {
		if (this._points.length === 0) return;
		let minX = this._points[0].x;
		let minY = this._points[0].y;
		let maxX = this._points[0].x;
		let maxY = this._points[0].y;

		for (const point of this._points) {
			minX = Math.min(minX, point.x);
			minY = Math.min(minY, point.y);
			maxX = Math.max(maxX, point.x);
			maxY = Math.max(maxY, point.y);
		}

		const width = maxX - minX;
		const height = maxY - minY;

		this._boundingBox = new BoundingBox(minX, minY, width, height);
	}

	override checkIntersection(
		point: Vector,
		ctx: CanvasRenderingContext2D
	): boolean {
		return ctx.isPointInPath(this.computedPath, point.x, point.y, "nonzero");
	}

	private generatePath() {
		const outlinePoints = getStroke(this._points, {
			simulatePressure: true,
			size: this.styles.strokeWidth,
			thinning: 0.6,
			smoothing: 0.7,
			streamline: 0.5,
			easing: (t) => Math.sin((t * Math.PI) / 2), // https://easings.net/#easeOutSine
		});
		const pathData = getSvgPathFromStroke(outlinePoints);
		this.computedPath = new Path2D(pathData);
	}

	private freeDraw(ctx: CanvasRenderingContext2D) {
		if (!this._done) this.generatePath();
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
