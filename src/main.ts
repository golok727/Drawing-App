import "./styles/style.css";
import Application from "./app";

const app = new Application(
	document.getElementById("canvas-container") as HTMLElement
);
// app.dispose();

const tick = () => {
	app.render();
	requestAnimationFrame(tick);
};

requestAnimationFrame(tick);
