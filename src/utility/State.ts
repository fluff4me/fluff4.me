import type Component from "ui/Component"
import Define from "utility/Define"
import type { Mutable } from "utility/Type"

interface ReadableState<T> {
	readonly value: T
	readonly listening: boolean
	/** Subscribe to state change events. Receive the initial state as an event. */
	use (owner: Component, subscriber: (value: T, initial?: true) => any): this
	/** Subscribe to state change events. The initial state is not sent as an event. */
	subscribe (owner: Component, subscriber: (value: T) => any): this
	subscribeManual (subscriber: (value: T) => any): this
	unsubscribe (subscriber: (value: T) => any): this
	emit (): this
}

interface State<T> extends ReadableState<T> {
	value: T
}

const SYMBOL_UNSUBSCRIBE = Symbol("UNSUBSCRIBE")
interface SubscriberFunction<T> {
	(value: T): any
	[SYMBOL_UNSUBSCRIBE]?: Set<() => void>
}

const SYMBOL_VALUE = Symbol("VALUE")
interface InternalState<T> {
	[SYMBOL_VALUE]: T
}

function State<T> (defaultValue: T): State<T> {
	let subscribers: ((value: T) => any)[] = []
	const result: Mutable<State<T>> & InternalState<T> = {
		[SYMBOL_VALUE]: defaultValue,
		listening: false,
		get value () {
			return result[SYMBOL_VALUE]
		},
		set value (value: T) {
			if (result[SYMBOL_VALUE] === value)
				return

			result[SYMBOL_VALUE] = value
			result.emit()
		},
		emit: () => {
			for (const subscriber of subscribers)
				subscriber(result[SYMBOL_VALUE])
			return result
		},
		use: (owner, subscriber) => {
			result.subscribe(owner, subscriber)
			subscriber(result[SYMBOL_VALUE], true)
			return result
		},
		subscribe: (owner, subscriber) => {
			function onRemoved () {
				owner.removed.unsubscribe(onRemoved)
				result.unsubscribe(subscriber)
				fn[SYMBOL_UNSUBSCRIBE]?.delete(onRemoved)
			}

			const fn = subscriber as SubscriberFunction<T>
			fn[SYMBOL_UNSUBSCRIBE] ??= new Set()
			fn[SYMBOL_UNSUBSCRIBE].add(onRemoved)
			owner.removed.subscribeManual(onRemoved)
			result.subscribeManual(subscriber)
			return result
		},
		subscribeManual: subscriber => {
			subscribers.push(subscriber)
			result.listening = true
			return result
		},
		unsubscribe: subscriber => {
			subscribers = subscribers.filter(s => s !== subscriber)
			result.listening = !subscribers.length
			return result
		},
	}
	return result
}

namespace State {

	export interface Generator<T> extends ReadableState<T> {
		observe (...states: State<any>[]): this
		// unobserve (...states: State<any>[]): this
	}

	export function Generator<T> (generate: () => T): Generator<T> {
		const result = State(generate()) as Mutable<Generator<T>> & InternalState<T>

		Define.magic(result, "value", {
			get: () => result[SYMBOL_VALUE],
		})
		result.observe = (...states) => {
			for (const state of states)
				state.subscribeManual(() => {
					const value = generate()
					if (result[SYMBOL_VALUE] === value)
						return

					result[SYMBOL_VALUE] = value
					result.emit()
				})
			return result
		}

		return result
	}

	export function Truthy (state: State<any>): State<boolean> {
		return Generator(() => !!state.value)
			.observe(state)
	}

	export function Falsy (state: State<any>): State<boolean> {
		return Generator(() => !!state.value)
			.observe(state)
	}

	export function Some (...anyOfStates: State<any>[]): State<boolean> {
		return Generator(() => anyOfStates.some(state => state.value))
			.observe(...anyOfStates)
	}

	export function Every (...anyOfStates: State<any>[]): State<boolean> {
		return Generator(() => anyOfStates.every(state => state.value))
			.observe(...anyOfStates)
	}

	export function Map<INPUT, OUTPUT> (input: State<INPUT>, outputGenerator: (input: INPUT) => OUTPUT): State<OUTPUT> {
		return Generator(() => outputGenerator(input.value))
			.observe(input)
	}
}

export default State
