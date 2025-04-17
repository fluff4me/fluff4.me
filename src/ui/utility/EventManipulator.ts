import type Component from 'ui/Component'
import Arrays from 'utility/Arrays'
import type { AnyFunction } from 'utility/Type'

interface EventExtensions<HOST> {
	host: HOST
	targetComponent: Component | undefined
}

type EventParameters<HOST, EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: infer PARAMS) => unknown ? PARAMS extends [infer EVENT extends Event, ...infer PARAMS] ? [EVENT & EventExtensions<HOST>, ...PARAMS] : [Event & EventExtensions<HOST>, ...PARAMS] : never
type EventParametersEmit<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: infer PARAMS) => unknown ? PARAMS extends [Event, ...infer PARAMS] ? PARAMS : PARAMS : never
type EventResult<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: any[]) => infer RESULT ? RESULT : never

export type EventHandler<HOST, EVENTS, EVENT extends keyof EVENTS> = (...params: EventParameters<HOST, EVENTS, EVENT>) => EventResult<EVENTS, EVENT>

type ResolveEvent<EVENT extends Arrays.Or<PropertyKey>> = EVENT extends PropertyKey[] ? EVENT[number] : EVENT

interface EventManipulator<HOST, EVENTS extends Record<string, any>> {
	emit<EVENT extends keyof EVENTS> (event: EVENT, ...params: EventParametersEmit<EVENTS, EVENT>): EventResult<EVENTS, EVENT>[] & { defaultPrevented: boolean, stoppedPropagation: boolean | 'immediate' }
	bubble<EVENT extends keyof EVENTS> (event: EVENT, ...params: EventParametersEmit<EVENTS, EVENT>): EventResult<EVENTS, EVENT>[] & { defaultPrevented: boolean, stoppedPropagation: boolean | 'immediate' }
	subscribe<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<HOST, EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
	subscribeCapture<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<HOST, EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
	subscribePassive<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<HOST, EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
	unsubscribe<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<HOST, EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
}

export type NativeEvents = { [KEY in keyof HTMLElementEventMap]: (event: KEY extends 'toggle' ? ToggleEvent : HTMLElementEventMap[KEY]) => unknown }

export type Events<HOST, EXTENSIONS extends Record<string, any>> =
	HOST extends { event: EventManipulator<any, infer EVENTS> }
	? (
		keyof EXTENSIONS extends never
		? EVENTS
		: (
			Lowercase<keyof EXTENSIONS & string> extends keyof EXTENSIONS
			? 'Custom events contain at least one uppercase letter'
			: {
				[KEY in keyof EVENTS | keyof EXTENSIONS]:
				| KEY extends keyof EVENTS ?
				| KEY extends keyof EXTENSIONS ? EVENTS[KEY] & EXTENSIONS[KEY]
				: EVENTS[KEY]
				: KEY extends keyof EXTENSIONS ? EXTENSIONS[KEY]
				: never
			}
		)
	)
	: never

interface EventDetail {
	result: any[]
	params: any[]
}

const SYMBOL_REGISTERED_FUNCTION = Symbol('REGISTERED_FUNCTION')
interface EventHandlerRegistered extends AnyFunction {
	[SYMBOL_REGISTERED_FUNCTION]?: AnyFunction
}

function isComponent (host: unknown): host is Component {
	return typeof host === 'object' && host !== null && 'isComponent' in host
}

function EventManipulator<T extends object> (host: T): EventManipulator<T, NativeEvents> {
	const elementHost = isComponent(host)
		? host
		: { element: document.createElement('span') }

	return {
		emit (event, ...params) {
			const detail: EventDetail = { result: [], params }
			let stoppedPropagation: boolean | 'immediate' = false
			let preventedDefault = false
			const eventObject = Object.assign(
				new CustomEvent(event, { detail }),
				{
					preventDefault () {
						Event.prototype.preventDefault.call(this)
						preventedDefault ||= true
					},
					stopPropagation () {
						stoppedPropagation ||= true
					},
					stopImmediatePropagation () {
						stoppedPropagation = 'immediate'
					},
				}
			)
			elementHost.element.dispatchEvent(eventObject)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Object.assign(detail.result, { defaultPrevented: eventObject.defaultPrevented || preventedDefault, stoppedPropagation }) as any
		},
		bubble (event, ...params) {
			const detail: EventDetail = { result: [], params }
			let stoppedPropagation: boolean | 'immediate' = false
			let preventedDefault = false
			const eventObject = Object.assign(
				new CustomEvent(event, { detail, bubbles: true }),
				{
					preventDefault () {
						Event.prototype.preventDefault.call(this)
						preventedDefault ||= true
					},
					stopPropagation () {
						stoppedPropagation ||= true
					},
					stopImmediatePropagation () {
						stoppedPropagation = 'immediate'
					},
				}
			)
			elementHost.element.dispatchEvent(eventObject)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Object.assign(detail.result, { defaultPrevented: eventObject.defaultPrevented || preventedDefault, stoppedPropagation }) as any
		},
		subscribe (events, handler) {
			return subscribe(handler, events)
		},
		subscribePassive (events, handler) {
			return subscribe(handler, events, { passive: true })
		},
		subscribeCapture (events, handler) {
			return subscribe(handler, events, { capture: true })
		},
		unsubscribe (events, handler) {
			const realHandler = (handler as EventHandlerRegistered)[SYMBOL_REGISTERED_FUNCTION]
			if (!realHandler)
				return host

			delete (handler as EventHandlerRegistered)[SYMBOL_REGISTERED_FUNCTION]

			for (const event of Arrays.resolve(events))
				elementHost.element.removeEventListener(event, realHandler)

			return host
		},
	}

	function subscribe (handler: EventHandlerRegistered, events: Arrays.Or<keyof NativeEvents>, options?: AddEventListenerOptions) {
		if (handler[SYMBOL_REGISTERED_FUNCTION]) {
			console.error(`Can't register handler for event(s) ${Arrays.resolve(events).join(', ')}, already used for other events`, handler)
			return host
		}

		const realHandler = (event: Event) => {
			const customEvent = event instanceof CustomEvent ? event : undefined
			const eventDetail = customEvent?.detail as EventDetail | undefined
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
			const result = (handler as any)(Object.assign(event, {
				host,
				targetComponent: getNearestComponent(event.target),
			} satisfies EventExtensions<any>), ...eventDetail?.params ?? [])
			eventDetail?.result.push(result)
		}

		Object.assign(handler, { [SYMBOL_REGISTERED_FUNCTION]: realHandler })

		for (const event of Arrays.resolve(events))
			elementHost.element.addEventListener(event, realHandler, options)

		return host
	}
}

function getNearestComponent (target: EventTarget | null): Component | undefined {
	if (!target || !(target instanceof Node))
		return undefined

	let node: Node | null = target
	do {
		const component = node.component
		if (component)
			return component
	}
	while ((node = node.parentNode))
}

export default EventManipulator
