import CanvasElement, { StrokeElement } from "./element";
import Vector from "./vector";

class Renderer {
	private ctx: CanvasRenderingContext2D;
	private m_Elements: CanvasElement[] = [];

	constructor(ctx: CanvasRenderingContext2D) {
		this.ctx = ctx;
	}

	get elements() {
		return this.m_Elements;
	}

	clear() {
		this.m_Elements = [];
	}

	// For Stroke Elements
	beginStroke(startPos: Vector) {
		const stroke = new StrokeElement();
		stroke.addPoint(startPos);
		this.m_Elements.push(stroke);
	}
	makeStroke(point: Vector) {
		if (this.m_Elements.length <= 0) return;

		const currentElement = this.m_Elements[this.m_Elements.length - 1];

		if (currentElement && currentElement instanceof StrokeElement) {
			currentElement.addPoint(point);
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
