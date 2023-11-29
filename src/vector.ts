class Vector {
	x: number;
	y: number;
	z: number;

	constructor(...args: number[]) {
		const [x = 0, y = 0, z = 0] = args.slice(0, 3);
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static from(
		val: number | number[] | Vector | { x?: number; y?: number; z?: number }
	): Vector {
		if (Array.isArray(val)) return new Vector(...val);

		if (val instanceof Vector) return new Vector(val.x, val.y, val.z);

		if (typeof val === "object")
			return new Vector(val.x ?? 0, val.y ?? 0, val.z ?? 0);

		return new Vector(val, val, val);
	}
	static clone(other: Vector) {
		return Vector.from(other);
	}
	static equals(v1: Vector, v2: Vector) {
		return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
	}
	get2dArr() {
		return [this.x, this.y];
	}
	add(other: Vector): Vector {
		return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
	}

	subtract(other: Vector): Vector {
		return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
	}

	multiplyScalar(scalar: number): Vector {
		return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
	}

	dotProduct(other: Vector): number {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}

	crossProduct(other: Vector): Vector {
		const x = this.y * other.z - this.z * other.y;
		const y = this.z * other.x - this.x * other.z;
		const z = this.x * other.y - this.y * other.x;
		return new Vector(x, y, z);
	}

	magnitude(): number {
		return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
	}

	normalize(): Vector {
		const mag = this.magnitude();
		if (mag === 0) return new Vector(0, 0, 0);
		return new Vector(this.x / mag, this.y / mag, this.z / mag);
	}

	toArray(): number[] {
		return [this.x, this.y, this.z];
	}
}

export default Vector;
