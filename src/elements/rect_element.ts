import { RoughCanvas } from "roughjs/bin/canvas";
import BoundingBox from "../boundingBox";
import { COLORS } from "../utils";
import Vector from "../vector";
import CanvasElement, { ElementTypes } from "./element";
import { generator } from "../shape";
import ShapeGenerator from "../ShapeGenerator";

// Rectangles
class RectangleElement extends CanvasElement {
	x: number;
	y: number;
	width: number;
	height: number;
	roundness: number;

	constructor(x: number, y: number, width = 0, height = 0, roundness = 0.3) {
		super(ElementTypes.Rect);
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.roundness = roundness;
	}
	public setWidth(width: number) {
		this.width = width;
	}

	public setHeight(height: number) {
		this.height = height;
	}

	public override checkIntersection(
		point: Vector,
		_ctx: CanvasRenderingContext2D
	): boolean {
		const p = Vector.from(point);
		if (this.styles.fillColor !== COLORS.NONE)
			return this.checkFilledRectIntersection(p);
		else return this.checkStrokedRectIntersection(p);
	}
	private checkFilledRectIntersection(p: Vector) {
		return this.boundingBox.isIntersecting(p);
	}

	private checkStrokedRectIntersection(p: Vector): boolean {
		const lineWidth = this.styles.strokeWidth;

		// Define the boundaries for the outer edge of the stroked rectangle
		const left = this.x - lineWidth;
		const right = this.x + this.width + lineWidth;
		const top = this.y - lineWidth;
		const bottom = this.y + this.height + lineWidth;

		// Define the boundaries for the inner edge of the stroked rectangle
		const innerLeft = this.x + lineWidth;
		const innerRight = this.x + this.width - lineWidth;
		const innerTop = this.y + lineWidth;
		const innerBottom = this.y + this.height - lineWidth;

		// Check if the point is within the outer edge but outside the inner edge
		return (
			p.x >= left &&
			p.x <= right &&
			p.y >= top &&
			p.y <= bottom &&
			(p.x < innerLeft ||
				p.x > innerRight ||
				p.y < innerTop ||
				p.y > innerBottom)
		);
	}

	public override calculateBoundingBox(): void {
		this._boundingBox = new BoundingBox(
			this.x,
			this.y,
			this.width,
			this.height
		);
	}

	protected override generateShape() {
		const w = this.width;
		const h = this.height;
		const r = Math.min(w, h) * 0.25;

		const shape = ShapeGenerator.rectangle(
			this.x,
			this.y,
			w,
			h,
			this.getRoughStyles(),
			this
		);

		this.shape = shape;
	}

	protected override onDraw(
		_drawingCtx: CanvasRenderingContext2D,
		roughCanvas: RoughCanvas
	): void {
		this.drawRect(_drawingCtx, roughCanvas);
	}

	private drawRect(
		_drawingCtx: CanvasRenderingContext2D,
		roughCanvas: RoughCanvas
	) {
		if (!this.isDone) {
			this.generateShape();
		}
		if (this.shape) roughCanvas.draw(this.shape);
	}
}

export default RectangleElement;
