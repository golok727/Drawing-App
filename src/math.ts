import { DEFAULT_PROPORTIONAL_RADIUS, DEFAULT_RADIUS } from "./constants";
import CanvasElement from "./elements/element";

// https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/math.ts#L281
export const getCornerRadius = (x: number, element: CanvasElement) => {
	const r = element.styles.roundness ?? DEFAULT_RADIUS;

	const cutoff = r / DEFAULT_PROPORTIONAL_RADIUS;

	if (x <= cutoff) return x * DEFAULT_PROPORTIONAL_RADIUS;

	return r;
};
