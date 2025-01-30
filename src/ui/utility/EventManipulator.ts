import type Component from 'ui/Component'
import Arrays from 'utility/Arrays'
import type { AnyFunction } from 'utility/Type'

type EventParameters<HOST, EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: infer PARAMS) => unknown ? PARAMS extends [infer EVENT extends Event, ...infer PARAMS] ? [EVENT & { component: HOST }, ...PARAMS] : [Event & { component: HOST }, ...PARAMS] : never
type EventParametersEmit<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: infer PARAMS) => unknown ? PARAMS extends [Event, ...infer PARAMS] ? PARAMS : PARAMS : never
type EventResult<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: any[]) => infer RESULT ? RESULT : never

export type EventHandler<HOST, EVENTS, EVENT extends keyof EVENTS> = (...params: EventParameters<HOST, EVENTS, EVENT>) => EventResult<EVENTS, EVENT>

type ResolveEvent<EVENT extends Arrays.Or<PropertyKey>> = EVENT extends PropertyKey[] ? EVENT[number] : EVENT

interface EventManipulator<HOST, EVENTS extends Record<string, any>> {
	emit<EVENT extends keyof EVENTS> (event: EVENT, ...params: EventParametersEmit<EVENTS, EVENT>): EventResult<EVENTS, EVENT>[] & { defaultPrevented: boolean, stoppedPropagation: boolean | 'immediate' }
	bubble<EVENT extends keyof EVENTS> (event: EVENT, ...params: EventParametersEmit<EVENTS, EVENT>): EventResult<EVENTS, EVENT>[] & { defaultPrevented: boolean, stoppedPropagation: boolean | 'immediate' }
	subscribe<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<HOST, EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
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

function EventManipulator (component: Component): EventManipulator<Component, NativeEvents> {
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
			component.element.dispatchEvent(eventObject)
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
			component.element.dispatchEvent(eventObject)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Object.assign(detail.result, { defaultPrevented: eventObject.defaultPrevented || preventedDefault, stoppedPropagation }) as any
		},
		subscribe (events, handler) {
			return subscribe(handler, events)
		},
		subscribePassive (events, handler) {
			return subscribe(handler, events, { passive: true })
		},
		unsubscribe (events, handler) {
			const realHandler = (handler as EventHandlerRegistered)[SYMBOL_REGISTERED_FUNCTION]
			if (!realHandler)
				return component

			delete (handler as EventHandlerRegistered)[SYMBOL_REGISTERED_FUNCTION]

			for (const event of Arrays.resolve(events))
				component.element.removeEventListener(event, realHandler)

			return component
		},
	}

	function subscribe (handler: EventHandlerRegistered, events: Arrays.Or<keyof NativeEvents>, options?: AddEventListenerOptions) {
		if (handler[SYMBOL_REGISTERED_FUNCTION]) {
			console.error(`Can't register handler for event(s) ${Arrays.resolve(events).join(', ')}, already used for other events`, handler)
			return component
		}

		const realHandler = (event: Event) => {
			const customEvent = event instanceof CustomEvent ? event : undefined
			const eventDetail = customEvent?.detail as EventDetail | undefined
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
			const result = (handler as any)(Object.assign(event, { component }), ...eventDetail?.params ?? [])
			eventDetail?.result.push(result)
		}

		Object.assign(handler, { [SYMBOL_REGISTERED_FUNCTION]: realHandler })

		for (const event of Arrays.resolve(events))
			component.element.addEventListener(event, realHandler, options)

		return component
	}
}

export default EventManipulator
