import BoundingBox from "../bounding-box";
import { COLORS } from "../utils";
import Vector from "../vector";
import CanvasElement, { ElementTypes } from "./element";

// Circle
export class CircleElement extends CanvasElement {
	private center: Vector;
	private _radius: number = 0;

	constructor(center: Vector) {
		super(ElementTypes.Circle);
		this.center = center;
	}

	get radius() {
		return this._radius;
	}
	public setRadius(newRad: number) {
		this._radius = newRad;
	}
	public override calculateBoundingBox(): void {
		this._boundingBox = new BoundingBox(
			this.center.x - this.radius,
			this.center.y - this.radius,
			this.radius * 2,
			this.radius * 2
		);
	}
	public override checkIntersection(
		point: Vector,
		_ctx: CanvasRenderingContext2D
	): boolean {
		return this.boundingBox.isIntersecting(point);
	}

	public override draw(ctx: CanvasRenderingContext2D): void {
		ctx.beginPath();
		ctx.fillStyle = this.styles.fillColor;
		ctx.strokeStyle = this.styles.strokeColor;
		ctx.lineWidth = this.styles.strokeWidth;

		// TODO: convert this into ellipse
		ctx.arc(this.center.x, this.center.y, this._radius, 0, Math.PI * 2);

		if (this.styles.strokeColor !== COLORS.NONE) ctx.stroke();
		if (this.styles.fillColor !== COLORS.NONE) ctx.fill();
	}
}

export default CircleElement;
