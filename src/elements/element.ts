import { CanvasStyles, DefaultCanvasStyles } from "../styles";
import { nanoid } from "nanoid";
import Vector from "../vector";
import BoundingBox from "../bounding-box";
import { RoughCanvas } from "roughjs/bin/canvas";

export const ElementTypes = {
	Stroke: "stroke",
	Circle: "circle",
	Rect: "rect",
	Line: "line",
} as const;

type ElementType = (typeof ElementTypes)[keyof typeof ElementTypes];

class CanvasElement {
	protected _id: string = nanoid();
	public type: ElementType;
	public _isDeleted = false; // for easy history purposes

	protected seed: number;
	protected previousStyles: CanvasStyles = { ...DefaultCanvasStyles };
	protected styles: CanvasStyles = { ...DefaultCanvasStyles };

	protected _boundingBox = new BoundingBox(0, 0, 0, 0);
	constructor(type: ElementType) {
		this.type = type;
		this.seed = Math.floor(Math.random() * 100);
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
	draw(ctx: CanvasRenderingContext2D, roughCanvas?: RoughCanvas): void {
		console.warn(
			`The Draw method for ElementType: ${this.type} should be implemented separately\n CTX:`,
			ctx,
			roughCanvas
		);
	}

	checkIntersection(point: Vector, _ctx: CanvasRenderingContext2D): boolean {
		return this._boundingBox.isIntersecting(point);
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

export default CanvasElement;
