import { isPressedFn } from "./keyboard";
import { RoughCanvas } from "roughjs/bin/canvas";
import CanvasElement from "./elements/element";
import AppHistory, {
	HistoryAction,
	HistoryActions,
	UndoOrRedo,
} from "./history";
import { StrokeElement } from "./elements/stroke_element";
import { CanvasStyles } from "./styles";
import Vector from "./vector";
import Drag from "./drag";
import RectangleElement from "./elements/rect_element";
import CircleElement from "./elements/circle_element";
import Viewport from "./viewport";
import BoundingBox from "./boundingBox";

const rectangle = new RectangleElement(500, 400, 200, 300);
rectangle.setStyles({
	fillColor: "",
	strokeColor: "red",
	roundness: 2,
});
rectangle.calculateBoundingBox();

class Renderer {
	public drawingCtx: CanvasRenderingContext2D;
	public interactiveCtx: CanvasRenderingContext2D;
	private roughCanvas: RoughCanvas;
	private viewport: Viewport;
	private _elements: CanvasElement[] = [rectangle];
	private history: AppHistory;
	private _toDelete = new Set<CanvasElement>();
	public selectedElements = new Set<CanvasElement>();

	constructor(
		drawingCtx: CanvasRenderingContext2D,
		interactiveCtx: CanvasRenderingContext2D,
		roughCanvas: RoughCanvas,
		viewport: Viewport,
		history: AppHistory
	) {
		this.drawingCtx = drawingCtx;
		this.interactiveCtx = interactiveCtx;
		this.history = history;
		this.roughCanvas = roughCanvas;
		this.viewport = viewport;
		this.history.onOldestRemove = this.historyOnRemoveOldestChange.bind(this);
		this.history.onRedoClear = this.historyOnRedoClear.bind(this);
	}
	public get elements() {
		return this._elements;
	}

	public Render() {
		this.drawElements();
	}

	public applyUndo(action: HistoryAction) {
		this.historyHandler("undo", action);
	}

	public applyRedo(action: HistoryAction) {
		this.historyHandler("redo", action);
	}

	public clear() {
		// Add the clear to history
		this.history.add({ type: "clear_all", elements: [...this.elements] });
		this._elements.splice(0, this._elements.length);
	}

	// For Stroke Elements
	public onBeginStroke(startPos: Vector, styles?: Partial<CanvasStyles>) {
		const stroke = new StrokeElement(styles);
		stroke.addPoint(startPos);
		this._elements.push(stroke);
	}

	public onStroke(point: Vector) {
		if (this._elements.length <= 0) return;

		const strokeElem = this.getLastElement();

		if (strokeElem && strokeElem instanceof StrokeElement) {
			strokeElem.addPoint(point);
		}
	}

	public onStrokeEnd() {
		if (this._elements.length <= 0) return;

		const strokeElem = this.getLastElement();

		if (strokeElem && strokeElem instanceof StrokeElement) {
			strokeElem.setDone(true);
			strokeElem.calculateBoundingBox();
			// Add stroke to the history
			this.history.addCanvasElement(strokeElem);
		}
	}
	// Rectangle

	/**
	 * Call Within the mouse down
	 */
	public BeginRect(
		startPos: Vector,
		styles?: Partial<CanvasStyles>,
		borderRadius = 0.3
	) {
		const rect = new RectangleElement(
			startPos.x,
			startPos.y,
			0,
			0,
			borderRadius
		);
		if (styles) rect.setStyles(styles);

		this._elements.push(rect);
	}

	/**
	 * Call Within the mouse move
	 */
	public DrawRect(
		mouse: Vector,
		drag: Drag,
		proportional = false,
		isPressed: isPressedFn
	) {
		if (this._elements.length <= 0) return;
		const rectangleElem = this.getLastElement();

		if (rectangleElem && rectangleElem instanceof RectangleElement) {
			const { x: dx, y: dy } = drag.offset;

			if (isPressed("space")) {
				drag.pause();
				rectangleElem.x = mouse.x - rectangleElem.width;
				rectangleElem.y = mouse.y - rectangleElem.height;
				return;
			}

			let width = Math.abs(dx);
			let height = proportional ? Math.abs(dx) : Math.abs(dy);

			if (dx < 0 && dy < 0) {
				// Upper-left quadrant
				rectangleElem.x = mouse.x;
				rectangleElem.y = mouse.y;
				if (proportional) {
					height = Math.abs(dx);
					const x = drag.state.start.x - height;
					const y = drag.state.start.y - height;
					rectangleElem.x = x;
					rectangleElem.y = y;
				}
			} else if (dx < 0) {
				rectangleElem.x = mouse.x;
			} else if (dy < 0) {
				rectangleElem.y = mouse.y;
				if (proportional) {
					height = Math.abs(dx);
				}
			}

			rectangleElem.width = width;
			rectangleElem.height = height;
		}
	}

	public RectEnd() {
		if (this._elements.length <= 0) return;

		const rectangleElem = this.getLastElement();

		if (rectangleElem && rectangleElem instanceof RectangleElement) {
			rectangleElem.setDone(true);

			this.history.addCanvasElement(rectangleElem);
		}
	}
	// Circle
	public BeginCircle(point: Vector, styles?: Partial<CanvasStyles>) {
		const circle = new CircleElement(point);
		if (styles) circle.setStyles(styles);

		this._elements.push(circle);
	}

	public DrawCircle(drag: Drag, proportional = false) {
		if (this._elements.length <= 0) return;

		const circleElem = this.getLastElement();

		if (circleElem && circleElem instanceof CircleElement) {
			const { x: dx, y: dy } = drag.offset;
			circleElem.width = Math.abs(dx);
			circleElem.height = Math.abs(proportional ? dx : dy);
		}
	}

	public EndCircle() {
		if (this._elements.length <= 0) return;

		const circleElem = this.getLastElement();

		if (circleElem && circleElem instanceof CircleElement) {
			circleElem.setDone(true);
			this.history.addCanvasElement(circleElem);
		}
	}

	public cancelEraser() {
		for (const elem of this._toDelete) {
			elem.unStageFromDelete();
		}
		this._toDelete.clear();
	}

	// Erase
	public Erase(point: Vector) {
		const elementsNearCurrentPoint = this.getNearestBoundingElements(point);

		for (const element of elementsNearCurrentPoint) {
			if (this._toDelete.has(element)) continue;

			if (element.checkIntersection(point, this.drawingCtx)) {
				element.stageForDelete();
				this._toDelete.add(element);
			}
		}
	}

	public onEraseEnd() {
		for (const element of this._toDelete) {
			element.delete();
		}

		// History
		if (this._toDelete.size)
			this.history.add({ type: "erase", elements: [...this._toDelete] });

		this._toDelete.clear();
	}
	public getIntersectingElementOnPoint(point: Vector, all = false) {
		const elements = all ? this._elements : this.getElementsInView();

		for (const element of elements) {
			if (element.checkIntersection(point, this.drawingCtx)) {
				return element;
			}
		}
		return null;
	}

	// Select
	public Select(element: CanvasElement) {
		this.selectedElements.add(element);
	}

	public SelectInsideBoundingBox(boundingBox: BoundingBox) {
		const nonDeletedElementsInViewport = this.getElementsInView();

		for (const element of nonDeletedElementsInViewport) {
			if (boundingBox.isInside(element.boundingBox))
				this.selectedElements.add(element);
		}
	}

	public Deselect(element: CanvasElement) {
		this.selectedElements.delete(element);
	}

	public DeselectAll() {
		this.selectedElements.clear();
	}

	public DeleteSelected() {
		for (const selected of this.selectedElements) {
			selected.delete();
		}

		this.history.add({ type: "delete", elements: [...this.selectedElements] });

		this.selectedElements.clear();
	}

	private getNearestBoundingElements(point: Vector) {
		return this.getElementsInView().filter((elem) =>
			elem.boundingBox.isIntersecting(point)
		);
	}

	private getElementsInView() {
		// TODO Cache this
		return this._elements.filter(
			(elem) => this.viewport.isInViewport(elem) && !elem.isDeleted
		);
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

	private deleteAction(
		type: UndoOrRedo,
		action: HistoryActions.Erase | HistoryActions.Delete
	) {
		// Action handler for eraser | delete

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
			case "delete": {
				this.deleteAction(type, action);
				return;
			}

			case "clear_all":
				this.clearAllAction(type, action);
				return;

			default:
				console.warn("Unspecified History action type");
				break;
		}
	}

	private drawElements() {
		for (const element of this.getElementsInView()) {
			if (element.isStagedForDelete) {
				this.drawingCtx.save();
				this.drawingCtx.globalAlpha = 0.5;
				element.draw(this.drawingCtx, this.roughCanvas);
				this.drawingCtx.restore();
			} else {
				element.draw(this.drawingCtx, this.roughCanvas);
			}
		}
	}
}

export default Renderer;
