import CanvasElement from "./element";
import { StrokeElement } from "./stroke_element";
import { CanvasStyles } from "./styles";
import Vector from "./vector";

class Renderer {
	private ctx: CanvasRenderingContext2D;
	private _elements: CanvasElement[] = [];

	private _toDelete = new Set<CanvasElement>();

	constructor(ctx: CanvasRenderingContext2D) {
		this.ctx = ctx;
	}

	get elements() {
		return this._elements;
	}

	private lastElement() {
		return this._elements[this._elements.length - 1];
	}

	clear() {
		this._elements.splice(0, this._elements.length);
	}

	// For Stroke Elements
	onBeginStroke(startPos: Vector, styles?: Partial<CanvasStyles>) {
		const stroke = new StrokeElement(styles);
		stroke.addPoint(startPos);
		this._elements.push(stroke);
	}

	onStroke(point: Vector) {
		if (this._elements.length <= 0) return;

		const currentElement = this.lastElement();

		if (currentElement && currentElement instanceof StrokeElement) {
			currentElement.addPoint(point);
		}
	}

	onStrokeEnd() {
		if (this._elements.length <= 0) return;

		const currentElement = this.lastElement();

		if (currentElement && currentElement instanceof StrokeElement) {
			currentElement.setDone(true);
		}

		// Erase
	}

	Erase(point: [number, number]) {
		for (const element of this._elements) {
			if (this._toDelete.has(element)) continue;
			if (element.checkIntersection(point, this.ctx)) {
				element.setStyles({ strokeColor: "#636363", fillColor: "#636363" });
				this._toDelete.add(element);
			}
		}
	}

	onEraseEnd() {
		for (const element of this._elements) {
			if (this._toDelete.has(element)) element.delete();
		}

		this._toDelete.clear();
	}

	private drawElements() {
		for (const element of this.elements) {
			if (element.isDeleted) continue;
			element.draw(this.ctx);
		}
	}

	Render() {
		this.drawElements();
	}
}

export default Renderer;
