import { COLORS } from "./utils";
import Vector from "./vector";

const defaultStyles = {
	fillColor: COLORS.CYAN,
	strokeColor: COLORS.WHITE,
	lineWidth: 10,
	lineDash: [],
};

export const ElementTypes = {
	Stroke: "stroke",
	Circle: "circle",
	Rect: "rect",
	Line: "line",
} as const;

type ElementType = (typeof ElementTypes)[keyof typeof ElementTypes];

// type BoundingBox = { top: number; left: number; right: number; bottom: number };

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
	getData() {
		console.warn("getData Should be implemented for data storage");
	}

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
		super(ElementTypes.Line);

		this.begin = Vector.from(begin);
		this.end = Vector.from(end);
	}
}

// Rectangles
export class RectangleElement extends CanvasElement {
	constructor() {
		super(ElementTypes.Rect);
	}
}

// Strokes
export class StrokeElement extends CanvasElement {
	private points: Vector[];
	private taper = true;
	constructor() {
		super(ElementTypes.Stroke);
		this.points = [];
	}

	addPoint(point: Vector) {
		this.points.push(point);
	}
	smooth(factor: number = 1) {
		for (let i = 0; i < factor; i++) this.postProcessPoints();
	}

	private postProcessPoints() {
		let { points } = this;

		const len = points.length;
		if (len <= 2) return;

		// Averaging algorithm
		for (let i = 1; i < len - 1; i++) {
			points[i].x = (points[i - 1].x + points[i].x + points[i + 1].x) / 3;
			points[i].y = (points[i - 1].y + points[i].y + points[i + 1].y) / 3;
		}
	}

	private drawStroke(ctx: CanvasRenderingContext2D) {
		if (this.points.length === 0) return;

		ctx.strokeStyle = this.styles.strokeColor;
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

// Circle
export class CircleElement extends CanvasElement {
	constructor() {
		super(ElementTypes.Circle);
	}
}

export default CanvasElement;
