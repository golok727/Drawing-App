import Vector from "./vector";

class Drag {
	public start = new Vector(0);
	public end = new Vector(0);
	public offset = new Vector(0);
	public active = false;

	constructor() {}
	// get offset() {
	// 	return this.end.subtract(this.start);
	// }
	public setStart(start: Vector) {
		this.start = start;
	}

	public setActive(active: boolean) {
		this.active = active;
	}

	public setEnd(end: Vector) {
		this.end = end;
	}

	public reset() {
		this.start = new Vector(0);
		this.end = new Vector(0);
		this.offset = new Vector(0);
		this.active = false;
	}
}

export default Drag;
