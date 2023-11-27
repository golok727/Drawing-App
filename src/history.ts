import CanvasElement from "./element";

export class HistoryState {
	private staged: CanvasElement | CanvasElement[];
	constructor(toSave: CanvasElement | CanvasElement[]) {
		this.staged = toSave;
	}
	get data() {
		return this.staged;
	}
}

class AppHistory {
	private history: HistoryState[] = [];

	constructor() {}

	clear(): void {
		this.history = []; // Clear forward history when clearing all history
	}
}

export default AppHistory;
