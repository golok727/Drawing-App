import { RoughCanvas } from "roughjs/bin/canvas";
import BoundingBox from "../bounding-box";
import Vector from "../vector";
import CanvasElement, { ElementTypes } from "./element";

// Circle
export class CircleElement extends CanvasElement {
	private center: Vector;
	private _radius: number = 0;
	public width = 0;
	public height = 0;

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
			this.center.x - this.width / 2,
			this.center.y - this.height / 2,
			this.width,
			this.height
		);
	}
	public override checkIntersection(
		point: Vector,
		_ctx: CanvasRenderingContext2D
	): boolean {
		return this.boundingBox.isIntersecting(point);
	}

	public override draw(
		_drawingContext: CanvasRenderingContext2D,
		roughCanvas: RoughCanvas
	): void {
		if (roughCanvas) {
			roughCanvas.ellipse(
				this.center.x,
				this.center.y,
				this.width,
				this.height,
				{
					bowing: 1.6,
					fill: this.styles.fillColor,
					fillWeight: 3,
					stroke: this.styles.strokeColor,
					strokeWidth: this.styles.strokeWidth,
					seed: this.seed,
					hachureAngle: 60, // angle of hachure,
					hachureGap: this.styles.strokeWidth * 5,
					roughness: 0.1,
				}
			);
		}
	}
}

export default CircleElement;
