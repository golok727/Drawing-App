import Renderer from "./renderer";
import Viewport from "./viewport";

class StaticCanvas {
	renderer: Renderer;
	viewport: Viewport;

	constructor(renderer: Renderer, viewport: Viewport) {
		this.renderer = renderer;
		this.viewport = viewport;
	}
	get cWidth() {
		return this.renderer.drawingCtx.canvas.offsetWidth;
	}
	get cHeight() {
		return this.renderer.drawingCtx.canvas.offsetHeight;
	}

	render() {
		const { drawingCtx } = this.renderer;

		drawingCtx.fillStyle = "black";
		drawingCtx.save();
		drawingCtx.clearRect(0, 0, this.cWidth, this.cHeight);

		drawingCtx.fillRect(0, 0, this.cWidth, this.cHeight);

		drawingCtx.translate(this.viewport.center.x, this.viewport.center.y);
		drawingCtx.scale(1 / this.viewport.zoom, 1 / this.viewport.zoom);
		drawingCtx.translate(this.viewport.offset.x, this.viewport.offset.y);

		this.renderer.Render();
		drawingCtx.restore();
	}
}

export default StaticCanvas;
