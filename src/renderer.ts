import CanvasElement from "./element";
import AppHistory, {
	HistoryAction,
	HistoryActions,
	UndoOrRedo,
} from "./history";
import { StrokeElement } from "./stroke_element";
import { CanvasStyles } from "./styles";
import Vector from "./vector";

class Renderer {
	private ctx: CanvasRenderingContext2D;
	private _elements: CanvasElement[] = [];
	private _history: AppHistory;
	private _toDelete = new Set<CanvasElement>();

	constructor(ctx: CanvasRenderingContext2D, history: AppHistory) {
		this.ctx = ctx;
		this._history = history;

		this._history.onOldestRemove = this.historyOnRemoveOldestChange.bind(this);
		this._history.onRedoClear = this.historyOnRedoClear.bind(this);
	}
	get elements() {
		return this._elements;
	}
	Render() {
		this.drawElements();
	}

	applyUndo(action: HistoryAction) {
		this.historyHandler("undo", action);
	}

	applyRedo(action: HistoryAction) {
		this.historyHandler("redo", action);
	}

	clear() {
		// Add the clear to history
		this._history.add({ type: "clear_all", elements: [...this.elements] });
		this._elements.splice(0, this._elements.length);
	}

	// For Stroke Elements
	onBeginStroke(startPos: Vector, styles?: Partial<CanvasStyles>) {
		const stroke = new StrokeElement(styles);
		stroke.addPoint(startPos);
		this._elements.push(stroke);
	}

	onStroke(point: Vector) {
		if (this._elements.length <= 0) return;

		const currentElement = this.getLastElement();

		if (currentElement && currentElement instanceof StrokeElement) {
			currentElement.addPoint(point);
		}
	}

	onStrokeEnd() {
		if (this._elements.length <= 0) return;

		const currentElement = this.getLastElement();

		if (currentElement && currentElement instanceof StrokeElement) {
			currentElement.setDone(true);

			// Add stroke to the history
			this._history.add({
				type: "add_element",
				element: currentElement,
			});
		}

		// Erase
	}

	Erase(point: [number, number]) {
		for (const element of this._elements) {
			if (this._toDelete.has(element)) continue;
			if (element.checkIntersection(point, this.ctx)) {
				element.setStyles({ strokeColor: "#636363", fillColor: "#636363" });
				this._toDelete.add(element);
			}
		}
	}

	cancelEraser() {
		for (const elem of this._toDelete) {
			elem.revertToPreviousStyles();
		}
		this._toDelete.clear();
	}

	onEraseEnd() {
		for (const element of this._toDelete) {
			element.delete();
		}

		// History
		if (this._toDelete.size)
			this._history.add({ type: "erase", elements: [...this._toDelete] });

		this._toDelete.clear();
	}

	private getLastElement() {
		return this._elements[this._elements.length - 1];
	}
	private addElementAction(
		type: UndoOrRedo,
		action: HistoryActions.AddElement
	) {
		// Action handler for brush
		switch (type) {
			case "undo":
				this._elements.pop();
				break;
			case "redo":
				this._elements.push(action.element);
				break;
		}
	}

	private removeElement(element: CanvasElement) {
		const index = this._elements.indexOf(element);
		if (index !== -1) this.elements.splice(index, 1);
	}

	// Remove the elements from the elements array if the capacity has reached and the element to pop out the the history is deleted or not

	private checkActionAndRemoveElements(action: HistoryAction) {
		switch (action.type) {
			case "erase":
				for (const element of action.elements) {
					if (element.isDeleted) this.removeElement(element);
				}
				break;
		}
	}

	private historyOnRemoveOldestChange(oldest: HistoryAction) {
		this.checkActionAndRemoveElements(oldest);
	}

	private historyOnRedoClear(redoActions: HistoryAction[]) {
		for (const action of redoActions) {
			this.checkActionAndRemoveElements(action);
		}
	}

	private eraseAction(type: UndoOrRedo, action: HistoryActions.Erase) {
		// Action handler for eraser
		switch (type) {
			case "undo": {
				for (const element of action.elements) element.recover();
				break;
			}

			case "redo": {
				for (const element of action.elements) element.delete();
				break;
			}
		}
	}

	private clearAllAction(type: UndoOrRedo, action: HistoryActions.ClearAll) {
		// Action handler for clear all
		switch (type) {
			case "undo": {
				this._elements = action.elements;
				break;
			}
			case "redo": {
				this.clear();
			}
		}
	}

	private historyHandler(type: "undo" | "redo", action: HistoryAction) {
		switch (action.type) {
			case "add_element":
				this.addElementAction(type, action);
				return;

			case "erase":
				this.eraseAction(type, action);
				return;

			case "clear_all":
				this.clearAllAction(type, action);
				return;

			default:
				console.warn("Unspecified History action type");
				break;
		}
	}

	private drawElements() {
		for (const element of this.elements) {
			if (element.isDeleted) continue;
			element.draw(this.ctx);
		}
	}
}

export default Renderer;
