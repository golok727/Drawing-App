class EventHandle<T extends keyof HTMLElementEventMap> {
	type: keyof HTMLElementEventMap;
	handler: (evt: HTMLElementEventMap[T]) => any;
	options?: boolean | AddEventListenerOptions;

	constructor(
		type: T,
		handler: (evt: HTMLElementEventMap[T]) => any,
		options?: boolean | AddEventListenerOptions
	) {
		this.type = type;
		this.handler = handler;
		this.options = options;
	}
}

class EventHandlerX {
	static registeredElements: Map<
		Element,
		Map<keyof HTMLElementEventMap, EventHandle<any>>
	> = new Map();

	public static on<E extends Element, T extends keyof HTMLElementEventMap>(
		element: E,
		type: T,
		handler: (evt: HTMLElementEventMap[T]) => any,
		options?: boolean | AddEventListenerOptions
	) {
		if (!this.registeredElements.has(element)) {
			this.registeredElements.set(element, new Map());
		}
		const elementEvents = this.registeredElements.get(element)!;

		const event = new EventHandle(type, handler, options);

		element.addEventListener(
			event.type as any,
			event.handler as any,
			event.options
		);

		elementEvents.set(type, new EventHandle(type, handler, options));
	}

	private static removeEventListener<K extends keyof ElementEventMap>(
		element: Element,
		map: EventHandle<K>
	) {
		element.removeEventListener(map.type, map.handler, map.options);
	}

	public static remove(element: Element, type: keyof HTMLElementEventMap) {
		const eventsRegisteredForElement = this.registeredElements.get(element);
		if (eventsRegisteredForElement === undefined) return false;

		const event = eventsRegisteredForElement.get(type);
		if (!event) return false;

		this.removeEventListener(element, event);

		eventsRegisteredForElement.delete(type);
	}

	public static destroy() {
		for (const [element, eventHandlers] of this.registeredElements) {
			for (const [_, eventHandler] of eventHandlers) {
				this.removeEventListener(element, eventHandler);
			}
		}
	}
}
export default EventHandlerX;
