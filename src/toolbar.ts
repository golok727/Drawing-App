export type Tool =
	| "brush"
	| "selector"
	| "eraser"
	| "rect"
	| "texture"
	| "circle"
	| "line"
	| "highlighter";

class Toolbar {
	private currentTool: Tool = "brush";
	private toolsElement: HTMLAnchorElement[] = [
		...document.querySelectorAll("[data-tool]"),
	] as HTMLAnchorElement[];

	private onToolChangeHandler?: (tool: Tool) => void;

	constructor(onToolChange?: (tool: Tool) => void) {
		this.onToolChangeHandler = onToolChange;
		this.setTool(this.currentTool);
		this.addEventListeners();
	}
	private setTool(tool: Tool) {
		const currentActiveTab = document.querySelector(
			"[data-tool].tab.tab-active"
		);
		if (currentActiveTab) currentActiveTab.classList.remove("tab-active");

		const newTab = document.querySelector(`[data-tool-name="${tool}"]`);
		if (!newTab) {
			console.error(`Tool : '${this.currentTool}' is not found`);
			return;
		}
		newTab.classList.add("tab-active");
		if (this.onToolChangeHandler) this.onToolChangeHandler(tool);
	}

	getCurrentTool() {
		return this.currentTool;
	}

	private handleClick = (evt: MouseEvent) => {
		const tool = evt.currentTarget as HTMLAnchorElement;
		const toolName = tool.dataset.toolName;
		if (!toolName) return;
		this.setTool(toolName as Tool);
	};
	private addEventListeners() {
		this.toolsElement.forEach((tool) => {
			tool.addEventListener("click", this.handleClick.bind(this));
		});
	}
}

export default Toolbar;
