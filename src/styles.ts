import { COLORS } from "./utils";

export interface CanvasStyles {
	fillColor: string;
	strokeColor: string;
	strokeWidth: number;
	opacity: number;
	lineDash: number[];
	roundness?: number;
}

const DefaultCanvasStyles: CanvasStyles = {
	fillColor: COLORS.WHITE,
	strokeColor: COLORS.WHITE,
	strokeWidth: 5,
	opacity: 1,
	roundness: 20,
	lineDash: [],
};

export { DefaultCanvasStyles };
