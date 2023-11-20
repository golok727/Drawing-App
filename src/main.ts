import "./styles/style.css";
import Canvas from "./canvas";

const canvas = new Canvas(
	document.getElementById("canvasContainer") as HTMLElement
);

const tick = () => {
	canvas.render();
	requestAnimationFrame(tick);
};

requestAnimationFrame(tick);
