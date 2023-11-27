import { COLORS, getColor } from "./utils";
import Vector from "./vector";

const defaultStyles = {
	fillColor: COLORS.WHITE,
	strokeColor: COLORS.WHITE,
	lineWidth: 10,
	lineDash: [],
};

export type ElementType = "stroke" | "circle" | "rect" | "line";

type BoundingBox = { top: number; left: number; right: number; bottom: number };

class CanvasElement {
	id: string = Math.random().toString().replace(".", "");
	type: ElementType;

	styles = {
		...defaultStyles,
	};

	private boundingBox: { topLeft: Vector; bottomRight: Vector };

	constructor(type: ElementType) {
		this.type = type;
		this.boundingBox = { topLeft: new Vector(), bottomRight: new Vector() };
	}

	protected calculateBoundingBox(): void {
		console.log(this.boundingBox);
	}
	// Use to get data saving
	getData() {}

	// Common method to render elements
	draw(_: CanvasRenderingContext2D): void {
		console.warn(
			`The Draw method for ElementType: ${this.type} should be implemented separately`
		);
	}
}

export class LineElement extends CanvasElement {
	begin: Vector;
	end: Vector;

	constructor(begin: [number, number], end: [number, number]) {
		super("line");

		this.begin = Vector.from(begin);
		this.end = Vector.from(end);
	}
}

export class RectangleElement extends CanvasElement {
	constructor() {
		super("rect");
	}
}

export class StrokeElement extends CanvasElement {
	private points: Vector[];

	constructor() {
		super("stroke");
		this.points = [];
	}

	addPoint(point: Vector) {
		this.points.push(point);
	}

	private drawStroke(ctx: CanvasRenderingContext2D) {
		if (this.points.length === 0) return;

		ctx.strokeStyle = getColor(this.styles.strokeColor);
		ctx.lineWidth = this.styles.lineWidth;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);

		for (let i = 0; i < this.points.length; i++)
			ctx.lineTo(this.points[i].x, this.points[i].y);

		ctx.stroke();
	}

	override draw(ctx: CanvasRenderingContext2D): void {
		this.drawStroke(ctx);
	}
}

export class CircleElement extends CanvasElement {
	constructor() {
		super("circle");
	}
}

export default CanvasElement;
