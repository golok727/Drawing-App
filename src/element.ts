import { CanvasStyles, DefaultCanvasStyles } from "./styles";
import { v4 as uuidv4 } from "uuid";
import Vector from "./vector";
import BoundingBox from "./bounding-box";

export const ElementTypes = {
	Stroke: "stroke",
	Circle: "circle",
	Rect: "rect",
	Line: "line",
} as const;

type ElementType = (typeof ElementTypes)[keyof typeof ElementTypes];

// type BoundingBox = { top: number; left: number; right: number; bottom: number };

class CanvasElement {
	protected _id: string = uuidv4();
	public type: ElementType;
	public _isDeleted = false; // for easy history purposes

	protected previousStyles: CanvasStyles = { ...DefaultCanvasStyles };
	protected styles: CanvasStyles = { ...DefaultCanvasStyles };

	protected _boundingBox = new BoundingBox(0, 0, 0, 0);
	constructor(type: ElementType) {
		this.type = type;
	}

	public calculateBoundingBox(): void {}

	get boundingBox() {
		return this._boundingBox;
	}

	get isDeleted() {
		return this._isDeleted;
	}

	delete() {
		this.revertToPreviousStyles();
		this.previousStyles = this.styles;
		this._isDeleted = true;
	}
	recover() {
		this.revertToPreviousStyles();
		this._isDeleted = false;
	}
	// Use to get data saving
	getData() {
		console.warn("getData Should be implemented for data storage");
	}

	revertToPreviousStyles() {
		const temp = { ...this.previousStyles };
		this.previousStyles = this.styles;
		this.styles = temp;
	}
	setStyles(newStyles: Partial<CanvasStyles>) {
		this.previousStyles = { ...this.styles };
		this.styles = { ...this.styles, ...newStyles };
	}

	// Common method to render elements
	draw(_: CanvasRenderingContext2D): void {
		console.warn(
			`The Draw method for ElementType: ${this.type} should be implemented separately`
		);
	}

	checkIntersection(
		_: [number, number],
		_ctx: CanvasRenderingContext2D
	): boolean {
		return false;
	}

	serialize() {}
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

// Circle
export class CircleElement extends CanvasElement {
	constructor() {
		super(ElementTypes.Circle);
	}
}

export default CanvasElement;
