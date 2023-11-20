type EventHandlers = {
	[K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void;
};
type Component = { element: Element; handlers: EventHandlers };

class UI {
	private components: { element: Element; handlers: EventHandlers }[] = [];
	private isRegistered = false;

	constructor() {}

	addComponent<T extends Element>(element: T, handlers: EventHandlers) {
		if (this.isRegistered)
			throw new Error("The components are already registered..");
		const component = this.registerComponent({ element, handlers });
		this.components.push(component);
	}

	destroy() {
		for (const component of this.components) {
			for (const type in component.handlers) {
				const eventType = type as keyof HTMLElementEventMap;
				const eventHandler = component.handlers[eventType];

				component.element.removeEventListener(
					type,
					eventHandler as EventListener
				);
			}
		}
	}

	private registerComponent(component: Component): Component {
		for (const type in component.handlers) {
			const eventType = type as keyof HTMLElementEventMap;
			const eventHandler = component.handlers[eventType];
			component.element.addEventListener(type, eventHandler as EventListener);
		}
		return component;
	}
}

export default UI;
