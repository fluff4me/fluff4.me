import State from 'utility/State'
import type { AnyFunction } from 'utility/Type'

export interface IEventSubscriptionManager<EVENTS = object, TARGET extends EventTarget = EventTarget> {
	subscribe<TYPE extends keyof EVENTS> (type: TYPE | TYPE[], listener: (this: TARGET, event: Event & EVENTS[TYPE]) => unknown): this
	subscribe (type: string | string[], listener: (this: TARGET, event: Event) => unknown): this
	subscribeOnce<TYPE extends keyof EVENTS> (type: TYPE | TYPE[], listener: (this: TARGET, event: Event & EVENTS[TYPE]) => unknown): this
	subscribeOnce (type: string | string[], listener: (this: TARGET, event: Event) => unknown): this
}

export class EventManager<HOST extends object, EVENTS = object, TARGET extends EventTarget = EventTarget> {

	public static readonly global = EventManager.make<GlobalEventHandlersEventMap>()

	public static make<EVENTS> () {
		return new EventManager<object, EVENTS>({})
	}

	public static emit (target: EventTarget | undefined, event: Event | string, init?: ((event: Event) => unknown) | object) {
		if (init instanceof Event)
			event = init

		if (typeof event === 'string')
			event = new Event(event, { cancelable: true })

		if (typeof init === 'function')
			init?.(event)
		else if (init && event !== init)
			Object.assign(event, init)

		target?.dispatchEvent(event)
		return event
	}

	private readonly host: WeakRef<HOST>
	private readonly _target: TARGET | WeakRef<TARGET>

	private get target () {
		return this._target instanceof WeakRef ? this._target.deref() : this._target
	}

	public constructor (host: HOST, target: TARGET | WeakRef<TARGET> = new EventTarget() as TARGET) {
		this.host = new WeakRef(host)
		this._target = target
	}

	public subscribe<TYPE extends keyof EVENTS> (type: TYPE | TYPE[], listener: (this: TARGET, event: Event & EVENTS[TYPE]) => unknown): HOST
	public subscribe (type: string | string[], listener: (this: TARGET, event: Event) => unknown): HOST
	public subscribe (type: string | string[], listener: (this: TARGET, event: any) => unknown) {
		if (!Array.isArray(type))
			type = [type]

		for (const t of type)
			this.target?.addEventListener(t, listener)

		return this.host.deref() as HOST
	}

	private readonly subscriptions: Record<string, WeakMap<AnyFunction, AnyFunction>> = {}
	public subscribeOnce<TYPE extends keyof EVENTS> (type: TYPE | TYPE[], listener: (this: TARGET, event: Event & EVENTS[TYPE]) => unknown): HOST
	public subscribeOnce (type: string | string[], listener: (this: TARGET, event: Event) => unknown): HOST
	public subscribeOnce (types: string | string[], listener: (this: TARGET, event: any) => unknown) {
		if (!Array.isArray(types))
			types = [types]

		if (this.target) {
			const target = this.target
			const subscriptions = this.subscriptions

			function realListener (this: TARGET, event: Event) {
				listener.call(this, event)
				for (const type of types) {
					subscriptions[type]?.delete(listener)
					target?.removeEventListener(type, realListener)
				}
			}

			for (const type of types) {
				subscriptions[type] ??= new WeakMap()
				subscriptions[type].set(listener, realListener)
				this.target?.addEventListener(type, realListener)
			}
		}

		return this.host.deref() as HOST
	}

	public unsubscribe<TYPE extends keyof EVENTS> (type: TYPE | TYPE[], listener: (this: TARGET, event: Event & EVENTS[TYPE]) => unknown): HOST
	public unsubscribe (type: string | string[], listener: (this: TARGET, event: Event) => unknown): HOST
	public unsubscribe (types: string | string[], listener: (this: TARGET, event: any) => unknown) {
		if (!Array.isArray(types))
			types = [types]

		for (const type of types) {
			this.target?.removeEventListener(type, listener)
			const realListener = this.subscriptions[type]?.get(listener)
			if (realListener) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				this.target?.removeEventListener(type, realListener as any)
				this.subscriptions[type].delete(listener)
			}
		}

		return this.host.deref() as HOST
	}

	public async waitFor<TYPE extends keyof EVENTS> (type: TYPE | TYPE[]): Promise<Event & EVENTS[TYPE]>
	public async waitFor (type: string | string[]): Promise<Event>
	public async waitFor (types: string | string[]) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return new Promise<any>(resolve =>
			this.subscribeOnce(types, resolve))
	}

	public until (promise: Promise<any> | State.Owner | keyof EVENTS, initialiser?: (manager: IEventSubscriptionManager<EVENTS, TARGET>) => unknown): HOST {
		if (typeof promise !== 'object')
			promise = this.waitFor(promise)

		const manager: IEventSubscriptionManager<EVENTS, TARGET> = {
			subscribe: (type: never, listener: (this: TARGET, event: any) => unknown) => {
				this.subscribe(type, listener)
				const unsubscribe = () => this.unsubscribe(type, listener)
				if (!(promise instanceof Promise))
					State.Owner.getOwnershipState(promise)?.matchManual(true, unsubscribe)
				else
					void (promise).then(unsubscribe)
				return manager
			},
			subscribeOnce: (type: never, listener: (this: TARGET, event: any) => unknown) => {
				this.subscribeOnce(type, listener)
				const unsubscribe = () => this.unsubscribe(type, listener)
				if (!(promise instanceof Promise))
					State.Owner.getOwnershipState(promise)?.matchManual(true, unsubscribe)
				else
					void (promise).then(() => this.unsubscribe(type, listener))
				return manager
			},
		}
		initialiser?.(manager)
		return this.host.deref() as HOST
	}

	// private pipeTargets = new Map<string, WeakRef<EventTarget>[]>()

	public emit<TYPE extends keyof { [TYPE in keyof EVENTS as Event extends EVENTS[TYPE] ? TYPE : never]: true }> (type: TYPE): void
	public emit<TYPE extends keyof EVENTS> (type: TYPE, init: Pick<EVENTS[TYPE], Exclude<keyof EVENTS[TYPE], Event>>): void
	public emit<TYPE extends keyof EVENTS> (type: TYPE, initializer: (event: Event) => EVENTS[TYPE]): void
	public emit<EVENT extends Event> (event: EVENT, init: Omit<EVENTS[keyof EVENTS], keyof EVENT>): void
	public emit<EVENT extends EVENTS[keyof EVENTS]> (event: EVENT, initializer?: (event: EVENT) => unknown): void
	public emit<EVENT extends Event> (event: EVENT, initializer: (event: EVENT) => EVENTS[keyof EVENTS]): void
	public emit (event: Event | string, init?: ((event: any) => unknown) | object) {
		event = EventManager.emit(this.target, event, init)

		// const pipeTargets = this.pipeTargets.get(event.type)
		// if (pipeTargets) {
		// 	for (let i = 0; i < pipeTargets.length; i++) {
		// 		const pipeTarget = pipeTargets[i].deref()
		// 		if (pipeTarget)
		// 			pipeTarget.dispatchEvent(event)
		// 		else
		// 			pipeTargets.splice(i--, 1)
		// 	}

		// 	if (!pipeTargets.length)
		// 		this.pipeTargets.delete(event.type)
		// }

		return this.host.deref() as HOST
	}

	// private pipes = new Map<string, WeakRef<EventManager<any, any>>[]>();

	// public pipe<TYPE extends keyof EVENTS> (type: TYPE, on: EventManager<any, { [key in TYPE]: EVENTS[TYPE] }, any>) {
	// 	const typeName = type as string;

	// 	on.insertPipe(typeName, this._target instanceof WeakRef ? this._target : new WeakRef(this._target));

	// 	let pipes = this.pipes.get(typeName);
	// 	if (!pipes) {
	// 		pipes = [];
	// 		this.pipes.set(typeName, pipes);
	// 	}

	// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	// 	pipes.push(new WeakRef(on));
	// 	return this;
	// }

	// private insertPipe (type: string, target: WeakRef<EventTarget>) {
	// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	// 	let pipeTargets = this.pipeTargets.get(type);
	// 	if (!pipeTargets) {
	// 		pipeTargets = [];
	// 		this.pipeTargets.set(type, pipeTargets);
	// 	}

	// 	pipeTargets.push(target);

	// 	const pipes = this.pipes.get(type);
	// 	if (pipes) {
	// 		for (let i = 0; i < pipes.length; i++) {
	// 			const pipe = pipes[i].deref();
	// 			if (pipe)
	// 				pipe.insertPipe(type, target);
	// 			else
	// 				pipes.splice(i--, 1);
	// 		}

	// 		if (!pipes.length)
	// 			this.pipes.delete(type);
	// 	}
	// }

}
