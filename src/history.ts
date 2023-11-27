import CanvasElement from "./element";

class AppHistory {
	private history: CanvasElement[] = [];
	private state: CanvasElement[];

	constructor(state: CanvasElement[]) {
		this.state = state;
	}

	setState(state: CanvasElement[]) {
		this.state = state;
	}

	clear(): void {
		this.history = []; // Clear forward history when clearing all history
	}

	undo(): void {
		const lastAction = this.state.pop();
		if (lastAction) {
			this.history.push(lastAction);
		}
	}

	redo(): void {
		const lastUndo = this.history.pop();
		if (lastUndo) {
			this.state.push(lastUndo);
		}
	}
}

export default AppHistory;
