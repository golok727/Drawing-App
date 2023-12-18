type EventMapForTarget<T extends EventTarget> = T extends Window
	? WindowEventMap
	: T extends Document
	? DocumentEventMap
	: T extends Element
	? HTMLElementEventMap
	: any;

class EventHandle<E extends EventTarget, T extends keyof EventMapForTarget<E>> {
	type: T;
	handler: (evt: EventMapForTarget<E>[T]) => any;
	options?: boolean | AddEventListenerOptions;

	constructor(
		type: T,
		handler: (evt: EventMapForTarget<E>[T]) => any,
		options?: boolean | AddEventListenerOptions
	) {
		this.type = type;
		this.handler = handler;
		this.options = options;
	}
}

class EventHandlerX {
	static registeredElements: Map<
		EventTarget,
		Map<string, Set<EventHandle<any, any>>>
	> = new Map();

	public static on<E extends EventTarget, T extends keyof EventMapForTarget<E>>(
		target: E,
		type: T,
		handler: (evt: EventMapForTarget<E>[T]) => any,
		options?: boolean | AddEventListenerOptions
	) {
		if (!this.registeredElements.has(target)) {
			this.registeredElements.set(target, new Map());
		}
		const targetEvents = this.registeredElements.get(target)!;

		const event = new EventHandle<E, T>(type, handler, options);

		target.addEventListener(
			event.type as any,
			event.handler as any,
			event.options
		);

		const handlers = targetEvents.get(type as any);
		if (handlers) {
			handlers.add(event);
		} else {
			const newSet = new Set<EventHandle<EventTarget, any>>();
			newSet.add(event);
			targetEvents.set(type as any, newSet);
		}
	}

	public static remove(
		element: EventTarget,
		...types: (keyof HTMLElementEventMap)[]
	) {
		this._remove(element, types);
	}

	private static removeEventListener<
		E extends EventTarget,
		K extends keyof EventMapForTarget<E>
	>(element: E, map: EventHandle<E, K>) {
		element.removeEventListener(
			map.type as string,
			map.handler as any,
			map.options
		);
	}

	private static getAllEventsForTarget(target: EventTarget) {
		return this.registeredElements.get(target);
	}

	private static removeAllEventsForTarget(element: EventTarget) {
		const eventsRegisteredForElement = this.getAllEventsForTarget(element);
		if (!eventsRegisteredForElement) return;

		for (const [_, eventHandler] of eventsRegisteredForElement) {
			// Loop through the set of handlers
			eventHandler.forEach((handler) => {
				this.removeEventListener(element, handler);
			});
			// clear the handler set
			eventHandler.clear();
		}

		this.registeredElements.delete(element);
	}

	private static removeAllForTargetByType(
		target: EventTarget,
		types: (keyof HTMLElementEventMap)[]
	) {
		types.forEach((type) => {
			const eventsRegisteredForElement = this.getAllEventsForTarget(target);
			if (!eventsRegisteredForElement) return;

			const eventHandlers = eventsRegisteredForElement.get(type as any);
			if (!eventHandlers) return;

			eventHandlers.forEach((handler) => {
				this.removeEventListener(target, handler);
			});

			eventHandlers.clear();

			eventsRegisteredForElement.delete(type as any);
		});
	}

	private static _remove(
		element: EventTarget,
		types: (keyof HTMLElementEventMap)[]
	) {
		if (!types.length) {
			this.removeAllEventsForTarget(element);
		} else {
			this.removeAllForTargetByType(element, types);
		}
	}

	public static destroy() {
		for (const [element, eventHandlerForElement] of this.registeredElements) {
			for (const [_, handlers] of eventHandlerForElement) {
				// Loop through the set of handlers
				handlers.forEach((handler) => {
					this.removeEventListener(element, handler);
				});
				handlers.clear();
			}
		}
		this.registeredElements = new Map();
	}
}
export default EventHandlerX;
