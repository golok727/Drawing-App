import CanvasElement, { ElementTypes } from "./element";

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

	public override draw(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = this.styles.fillColor;
		ctx.strokeStyle = this.styles.strokeColor;
		ctx.lineWidth = this.styles.strokeWidth;
		ctx.rect(this.x, this.y, this.width, this.height);
		ctx.stroke();
		ctx.fill();
	}
}

export default RectangleElement;
