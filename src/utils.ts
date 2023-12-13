export const COLORS = {
	BLACK: "#000",
	WHITE: "#e3e3e3",
	RED: "#ff0000",
	GREEN: "#00ff00",
	BLUE: "#0000ff",
	CYAN: "#00ffff",
	YELLOW: "#ffff00",
	HOT_PINK: "#ff69b4",
	ORANGE: "#ff6224",
	NONE: "",
} as const;

export const BG_COLORS = {
	WHITE: "#999999",
	RED: "#400000",
	GREEN: "#003300",
	BLUE: "#000066",
	CYAN: "#004d4d",
	YELLOW: "#666600",
	ORANGE: "#803300",
	NONE: "",
} as const;

export const filters = {
	blur(amount: number, unit: "px" | "rem" = "px") {
		return `blur(${amount}${unit})`;
	},
};

export const average = (a: number, b: number) => (a + b) / 2;
export function getSvgPathFromStroke(points: number[][], closed = true) {
	const len = points.length;

	if (len < 4) {
		return ``;
	}

	let a = points[0];
	let b = points[1];
	const c = points[2];

	let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
		2
	)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
		b[1],
		c[1]
	).toFixed(2)} T`;

	for (let i = 2, max = len - 1; i < max; i++) {
		a = points[i];
		b = points[i + 1];
		result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
			2
		)} `;
	}

	if (closed) {
		result += "Z";
	}

	return result;
}

export type Keys =
	| "backspace"
	| "tab"
	| "enter"
	| "shift"
	| "control"
	| "alt"
	| "capslock"
	| "escape"
	| "space"
	| "pageup"
	| "pagedown"
	| "end"
	| "home"
	| "arrowleft"
	| "arrowup"
	| "arrowright"
	| "arrowdown"
	| "insert"
	| "delete"
	| "0"
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	| "a"
	| "b"
	| "c"
	| "d"
	| "e"
	| "f"
	| "g"
	| "h"
	| "i"
	| "j"
	| "k"
	| "l"
	| "m"
	| "n"
	| "o"
	| "p"
	| "q"
	| "r"
	| "s"
	| "t"
	| "u"
	| "v"
	| "w"
	| "x"
	| "y"
	| "z"
	| "f1"
	| "f2"
	| "f3"
	| "f4"
	| "f5"
	| "f6"
	| "f7"
	| "f8"
	| "f9"
	| "f10"
	| "f11"
	| "f12";
