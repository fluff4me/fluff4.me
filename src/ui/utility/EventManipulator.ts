import type Component from "ui/Component"
import Arrays from "utility/Arrays"
import type { AnyFunction } from "utility/Type"

type EventParameters<HOST, EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: infer PARAMS) => any ? PARAMS extends [infer EVENT extends Event, ...infer PARAMS] ? [EVENT & { component: HOST }, ...PARAMS] : [Event & { component: HOST }, ...PARAMS] : never
type EventParametersEmit<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: infer PARAMS) => any ? PARAMS extends [Event, ...infer PARAMS] ? PARAMS : PARAMS : never
type EventResult<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: any[]) => infer RESULT ? RESULT : never

type EventHandler<HOST, EVENTS, EVENT extends keyof EVENTS> = (...params: EventParameters<HOST, EVENTS, EVENT>) => EventResult<EVENTS, EVENT>

type ResolveEvent<EVENT extends Arrays.Or<PropertyKey>> = EVENT extends PropertyKey[] ? EVENT[number] : EVENT

interface EventManipulator<HOST, EVENTS> {
	emit<EVENT extends keyof EVENTS> (event: EVENT, ...params: EventParametersEmit<EVENTS, EVENT>): EventResult<EVENTS, EVENT>[]
	subscribe<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<HOST, EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
	unsubscribe<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<HOST, EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
}

export type NativeEvents = { [KEY in keyof HTMLElementEventMap]: (event: KEY extends "toggle" ? ToggleEvent : HTMLElementEventMap[KEY]) => any }

interface EventDetail {
	result: any[]
	params: any[]
}

const SYMBOL_REGISTERED_FUNCTION = Symbol("REGISTERED_FUNCTION")
interface EventHandlerRegistered extends AnyFunction {
	[SYMBOL_REGISTERED_FUNCTION]?: AnyFunction
}

function EventManipulator (component: Component): EventManipulator<Component, NativeEvents> {
	return {
		emit (event, ...params) {
			const detail: EventDetail = { result: [], params }
			const eventObject = new CustomEvent(event, { detail })
			component.element.dispatchEvent(eventObject)
			return detail.result
		},
		subscribe (events, handler) {
			if ((handler as EventHandlerRegistered)[SYMBOL_REGISTERED_FUNCTION]) {
				console.error(`Can't register handler for event(s) ${Arrays.resolve(events).join(", ")}, already used for other events`, handler)
				return component
			}

			const realHandler = (event: Event) => {
				const customEvent = event instanceof CustomEvent ? event : undefined
				const eventDetail = customEvent?.detail as EventDetail | undefined
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				const result = (handler as any)(Object.assign(event, { component }), ...eventDetail?.params ?? [])
				eventDetail?.result.push(result)
			}

			Object.assign(handler, { [SYMBOL_REGISTERED_FUNCTION]: realHandler })

			for (const event of Arrays.resolve(events))
				component.element.addEventListener(event, realHandler)

			return component
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
}

export default EventManipulator
