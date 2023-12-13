import { Options as RoughStyles } from "roughjs/bin/core";
import { generator } from "./shape";

class ShapeGenerator {
	public static rectangle(
		x: number,
		y: number,
		w: number,
		h: number,
		roughStyles: RoughStyles,
		r: number
	) {
		x = parseFloat(x.toFixed(2));
		y = parseFloat(y.toFixed(2));
		if (!r) {
			return generator.rectangle(x, y, w, h, roughStyles);
		} else {
			const p = new PathGen();
			p.moveTo(x + r, y);
			p.lineTo(x + w - r, y);
			p.quadraticCurveTo(x + w, y, x + w, y + r);
			p.lineTo(x + w, y + h - r);
			p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
			p.lineTo(x + r, y + h);
			p.quadraticCurveTo(x, y + h, x, y + h - r);
			p.lineTo(x, y + r);
			p.quadraticCurveTo(x, y, x + r, y);
			const path = p.path();

			return generator.path(path, roughStyles);
		}
	}

	public static ellipse(
		x: number,
		y: number,
		w: number,
		h: number,
		styles: RoughStyles
	) {
		return generator.ellipse(x, y, w, h, styles);
	}
}

class PathGen {
	private _path: string[] = [];
	constructor() {}

	public clear() {}

	public moveTo(x: number, y: number) {
		this._path.push(`M ${x} ${y}`);
	}

	public lineTo(x: number, y: number) {
		this._path.push(`L ${x} ${y}`);
	}

	public quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
		this._path.push(`Q ${cx} ${cy}, ${x} ${y}`);
	}

	public closePath() {
		this._path.push("Z");
	}

	public path() {
		return this._path.join(" ");
	}
}

export default ShapeGenerator;
