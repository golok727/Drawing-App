export const COLORS = {
	BLACK: 0,
	WHITE: 1,
	RED: 2,
	GREEN: 3,
	BLUE: 4,
	CYAN: 5,
	YELLOW: 6,
	HOT_PINK: 7,
	NONE: -1,
} as const;

export const getColor = (color: (typeof COLORS)[keyof typeof COLORS]) => {
	switch (color) {
		case COLORS.BLACK:
			return "#000";
		case COLORS.WHITE:
			return "#ffffff";

		case COLORS.RED:
			return "#ff0000";

		case COLORS.GREEN:
			return "#00ff00";

		case COLORS.BLUE:
			return "#0000ff";

		case COLORS.YELLOW:
			return "#ffff00";

		case COLORS.CYAN:
			return "#00ffff";

		case COLORS.HOT_PINK:
			return "#FF69B4";

		case COLORS.NONE:
			return "";

		default:
			return "#000";
	}
};
