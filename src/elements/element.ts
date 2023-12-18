import { CanvasStyles, DefaultCanvasStyles } from "../styles";
import { nanoid } from "nanoid";
import Vector from "../vector";
import BoundingBox from "../boundingBox";
import { RoughCanvas } from "roughjs/bin/canvas";
import { randomInteger } from "../random";
import { Drawable, Options as RoughOptions } from "roughjs/bin/core";

export const ElementTypes = {
	Stroke: "stroke",
	Circle: "circle",
	Rect: "rect",
	Line: "line",
} as const;

type ElementType = (typeof ElementTypes)[keyof typeof ElementTypes];

class CanvasElement {
	protected _id: string;
	public type: ElementType;
	public _isDeleted: boolean = false; // for easy history purposes
	public isStagedForDelete: boolean = false;
	public isDone: boolean = false;

	protected shape: Drawable | null = null;
	protected seed: number;
	public styles: CanvasStyles = { ...DefaultCanvasStyles };

	protected _boundingBox = new BoundingBox(0, 0, 0, 0);
	constructor(type: ElementType) {
		this._id = nanoid();
		this._isDeleted = false;
		this.isStagedForDelete = false;
		this.isDone = false;
		this.type = type;
		this.seed = randomInteger();
	}

	public calculateBoundingBox(): void {}

	public draw(drawingCtx: CanvasRenderingContext2D, roughCanvas?: RoughCanvas) {
		if (!this.isDone) this.generateShape();

		this.onDraw(drawingCtx, roughCanvas);
	}

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
		if (this.isDeleted || this.isStagedForDelete) return;

		ctx.fillStyle = isStrokeElement
			? this.styles.strokeColor
			: this.styles.fillColor;
		ctx.strokeStyle = this.styles.strokeColor;
		ctx.lineWidth = this.styles.strokeWidth;
		ctx.globalAlpha = this.styles.opacity;
	}
	// Common method to render elements
	/**
	 *
	 * @param ctx
	 * @param roughCanvas
	 * @description Function called on each draw
	 */
	protected onDraw(
		ctx: CanvasRenderingContext2D,
		roughCanvas?: RoughCanvas
	): void {
		console.warn(
			`The Draw method for ElementType: ${this.type} should be implemented separately\n CTX:`,
			ctx,
			roughCanvas
		);
	}

	checkIntersection(point: Vector, _ctx: CanvasRenderingContext2D): boolean {
		return this._boundingBox.isIntersecting(point);
	}

	/**
	 * Shapes or paths should be generated inside this function. This will only be called if the shape is completely created. `isDone = true`
	 */
	protected generateShape() {}

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
