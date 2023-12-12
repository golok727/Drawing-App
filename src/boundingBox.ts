import Vector from "./vector";

class BoundingBox {
	public x: number;
	public y: number;
	public w: number;
	public h: number;
	constructor(x: number, y: number, w: number, h: number) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	public get tl() {
		return new Vector(this.x, this.y);
	}
	public get tr() {
		return new Vector(this.x + this.w, this.y);
	}
	public get bl() {
		return new Vector(this.x, this.y + this.h);
	}
	public get br() {
		return new Vector(this.x + this.w, this.y + this.h);
	}

	public get top() {
		return this.y;
	}
	public get bottom() {
		return this.y + this.h;
	}
	public get left() {
		return this.x;
	}
	public get right() {
		return this.x + this.w;
	}

	public isIntersecting(point: Vector) {
		if (
			point.x >= this.x &&
			point.x <= this.x + this.w &&
			point.y >= this.y &&
			point.y <= this.y + this.h
		) {
			return true;
		}
		return false;
	}

	public isInside(other: BoundingBox) {
		return (
			this.x <= other.x + other.w &&
			this.x + this.w >= other.x &&
			this.y <= other.y + other.h &&
			this.y + this.h >= other.y
		);
	}
}

export default BoundingBox;
