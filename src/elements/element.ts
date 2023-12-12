import { CanvasStyles, DefaultCanvasStyles } from "../styles";
import { nanoid } from "nanoid";
import Vector from "../vector";
import BoundingBox from "../bounding-box";
import { RoughCanvas } from "roughjs/bin/canvas";
import { randomInteger } from "../random";
import { Options as RoughOptions } from "roughjs/bin/core";

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
	public isStagedForDelete = false;
	public isDone = false;

	protected seed: number;
	protected styles: CanvasStyles = { ...DefaultCanvasStyles };

	protected _boundingBox = new BoundingBox(0, 0, 0, 0);
	constructor(type: ElementType) {
		this.type = type;
		this.seed = randomInteger();
	}

	public calculateBoundingBox(): void {}

	get boundingBox() {
		return this._boundingBox;
	}

	get isDeleted() {
		return this._isDeleted;
	}

	stageForDelete() {
		this.isStagedForDelete = true;
	}
	unStageFromDelete() {
		this.isStagedForDelete = false;
	}

	delete() {
		// this.revertToPreviousStyles();
		// this.previousStyles = this.styles;
		this._isDeleted = true;
	}
	recover() {
		this.isStagedForDelete = false;
		this._isDeleted = false;
	}
	// Use to get data saving
	getData() {
		console.warn("getData Should be implemented for data storage");
	}

	setDone(val: boolean) {
		this.isDone = val;

		if (this.isDone) this.calculateBoundingBox();
	}

	setStyles(newStyles: Partial<CanvasStyles>) {
		this.styles = { ...this.styles, ...newStyles };
	}
	getRoughStyles(): RoughOptions {
		return {
			roughness: 0.1,
			fillWeight: 3,
			bowing: 1.6,
			fill: this.styles.fillColor,
			stroke: this.styles.strokeColor,
			strokeWidth: this.styles.strokeWidth,
			hachureAngle: 60, // angle of hachure,
			hachureGap: this.styles.strokeWidth * 4,
			seed: this.seed,
		};
	}
	applyStyles(ctx: CanvasRenderingContext2D, isStrokeElement: boolean = false) {
		ctx.fillStyle = isStrokeElement
			? this.styles.strokeColor
			: this.styles.fillColor;
		ctx.strokeStyle = this.styles.strokeColor;
		ctx.lineWidth = this.styles.strokeWidth;
		ctx.globalAlpha = this.styles.opacity;
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
