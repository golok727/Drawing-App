import CanvasElement from "./element";
import { StrokeElement } from "./stroke_element";

class Renderer {
	private ctx: CanvasRenderingContext2D;
	private m_Elements: CanvasElement[] = [];

	constructor(ctx: CanvasRenderingContext2D) {
		this.ctx = ctx;
	}

	get elements() {
		return this.m_Elements;
	}

	private lastElement() {
		return this.m_Elements[this.m_Elements.length - 1];
	}

	clear() {
		this.m_Elements = [];
	}

	// For Stroke Elements
	beginStroke(startPos: number[]) {
		const stroke = new StrokeElement();
		stroke.addPoint(startPos);
		this.m_Elements.push(stroke);
	}

	stroke(point: number[]) {
		if (this.m_Elements.length <= 0) return;

		const currentElement = this.lastElement();

		if (currentElement && currentElement instanceof StrokeElement) {
			currentElement.addPoint(point);
		}
	}
	endStroke() {
		if (this.m_Elements.length <= 0) return;

		const currentElement = this.lastElement();

		if (currentElement && currentElement instanceof StrokeElement) {
			currentElement.setDone(true);
		}
	}

	private drawElements() {
		for (const element of this.elements) {
			element.draw(this.ctx);
		}
	}

	Render() {
		this.drawElements();
	}
}

export default Renderer;
