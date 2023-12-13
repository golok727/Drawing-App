abstract class DestroyableEvent {
	private destroyEventListenersFn?: () => void;

	protected listen() {
		this.destroyEventListenersFn = this.addEventListeners();
	}

	public destroy() {
		this.destroyEventListenersFn && this.destroyEventListenersFn();
	}

	protected addEventListeners(): () => void {
		return () => {};
	}
}

export default DestroyableEvent;
