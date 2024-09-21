import type Component from "ui/Component"
import Arrays from "utility/Arrays"

type EventParameters<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: infer PARAMS) => any ? PARAMS[0] extends Event ? PARAMS : [Event, ...PARAMS] : never
type EventResult<EVENTS, EVENT extends keyof EVENTS> = EVENTS[EVENT] extends (...params: any[]) => infer RESULT ? RESULT : never

type EventHandler<EVENTS, EVENT extends keyof EVENTS> = (...params: EventParameters<EVENTS, EVENT>) => EventResult<EVENTS, EVENT>

type ResolveEvent<EVENT extends Arrays.Or<PropertyKey>> = EVENT extends PropertyKey[] ? EVENT[number] : EVENT

interface EventManipulator<HOST, EVENTS> {
	emit<EVENT extends keyof EVENTS> (event: EVENT, ...params: EventParameters<EVENTS, EVENT> extends (event: Event, ...params: infer PARAMS) => any ? PARAMS : never): EventResult<EVENTS, EVENT>[]
	subscribe<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
	unsubscribe<EVENT extends Arrays.Or<keyof EVENTS>> (event: EVENT, handler: EventHandler<EVENTS, ResolveEvent<EVENT> & keyof EVENTS>): HOST
}

export type NativeEvents = { [KEY in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[KEY]) => any }

interface EventDetail {
	result: any[]
	params: any[]
}

function EventManipulator (component: Component.SettingUp): EventManipulator<Component, NativeEvents> {
	const done = component as Component
	return {
		emit (event, ...params) {
			const detail: EventDetail = { result: [], params }
			const eventObject = new CustomEvent(event, { detail })
			component.element.dispatchEvent(eventObject)
			return detail.result
		},
		subscribe (events, handler) {
			for (const event of Arrays.resolve(events)) {
				component.element.addEventListener(event, event => {
					const customEvent = event instanceof CustomEvent ? event : undefined
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
					const result = (handler as any)(event, ...customEvent?.detail ?? [])
					const eventDetail = customEvent?.detail as EventDetail | undefined
					eventDetail?.result.push(result)
				})
			}
			return done
		},
		unsubscribe (event, handler) {

			return done
		},
	}
}

export default EventManipulator
