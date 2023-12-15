import Vector from "./vector";

class Drag {
	private start = new Vector(0);
	private end = new Vector(0);
	public offset = new Vector(0);
	private active = false;
	private paused = false;

	constructor() {}

	public get state() {
		return {
			start: this.start,
			end: this.end,
			offset: this.offset,
			active: this.active,
		};
	}
	public dragStart(start: Vector) {
		this.start = start;
		this.active = true;
	}
	public pause() {
		this.paused = true;
	}
	public unpause() {
		this.paused = false;
	}

	public dragTo(end: Vector) {
		if (this.active && !this.paused) {
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
