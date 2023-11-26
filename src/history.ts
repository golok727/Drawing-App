import { Vec2 } from "./canvas";

class AppHistory {
	private history: Vec2[][] = [];
	private state: Vec2[][];

	constructor(state: Vec2[][]) {
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
