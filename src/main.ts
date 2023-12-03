import "./styles/style.css";
import Application from "./app";

const app = new Application(
	document.getElementById("canvasContainer") as HTMLElement
);

const tick = () => {
	app.render();
	requestAnimationFrame(tick);
};

requestAnimationFrame(tick);
