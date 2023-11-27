export type ElementType = "stroke" | "circle" | "rect" | "line";

class CanvasElement {
	type: ElementType;
	constructor(type: ElementType) {
		this.type = type;
	}
}

export class LineElement extends CanvasElement {
	constructor() {
		super("line");
	}
}

export class RectangleElement extends CanvasElement {
	constructor() {
		super("rect");
	}
}

export class StrokeElement extends CanvasElement {
	constructor() {
		super("stroke");
	}
}

export class CircleElement extends CanvasElement {
	constructor() {
		super("circle");
	}
}

export default CanvasElement;
