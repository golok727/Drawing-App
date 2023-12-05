import Vector from "./vector";

class Drag {
	private start = new Vector(0);
	private end = new Vector(0);
	public offset = new Vector(0);
	private active = false;

	constructor() {}

	public dragStart(start: Vector) {
		this.start = start;
		this.active = true;
	}

	public dragTo(end: Vector) {
		if (this.active) {
			this.end = end;
			this.offset = this.end.subtract(this.start);
		}
	}
	public isDragging() {
		return this.active;
	}

	public stop() {
		this.start = new Vector(0);
		this.end = new Vector(0);
		this.offset = new Vector(0);
		this.active = false;
	}
}

export default Drag;
