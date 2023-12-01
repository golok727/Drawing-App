import CanvasElement from "./element";
import { Tool } from "./toolbar";

interface AddElement {
	type: "add_element";

	element: CanvasElement;
}

interface ClearAll {
	type: "clear_all";

	elements: CanvasElement[];
}

interface Erase {
	type: "erase";

	elements: CanvasElement[];
}

interface ToolChange {
	type: "tool_change";

	tool: Tool;
}

export type HistoryAction = AddElement | ClearAll | Erase | ToolChange;

class AppHistory {
	private maxHistory;
	private history: HistoryAction[] = [];
	private redoStack: HistoryAction[] = [];

	constructor(max: number = 40) {
		this.maxHistory = max;
	}

	private _add(action: HistoryAction) {
		if (this.history.length > this.maxHistory) {
			this.history.shift();
		}
		this.history.push(action);
	}

	add(action: HistoryAction) {
		this._add(action);
		this.redoStack = [];
	}

	undo() {
		const lastAction = this.history.pop();
		if (lastAction) this.redoStack.push(lastAction);

		return lastAction;
	}

	redo() {
		const lastAction = this.redoStack.pop();

		if (lastAction) this.history.push(lastAction);
		return lastAction;
	}
	clear(): void {
		this.history = [];
	}
}

export default AppHistory;
