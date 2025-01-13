import type Component from 'ui/Component'
import Arrays from 'utility/Arrays'
import Define from 'utility/Define'
import Functions from 'utility/Functions'
import type { Mutable } from 'utility/Type'

export type StateOr<T> = State<T> | T

export type UnsubscribeState = () => void

interface ReadableState<T, E = T> {
	readonly isState: true
	readonly value: T

	readonly equals: <V extends T>(value: V) => boolean

	/** Subscribe to state change events. Receive the initial state as an event. */
	use (owner: Component, subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	useManual (subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	/** Subscribe to state change events. The initial state is not sent as an event. */
	subscribe (owner: Component, subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	subscribeManual (subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	unsubscribe (subscriber: (value: E, oldValue?: E) => unknown): void
	emit (oldValue?: E): void
	await<R extends Arrays.Or<T>> (owner: Component, value: R, then: (value: R extends (infer R)[] ? R : R) => unknown): State<T>
	awaitManual<R extends Arrays.Or<T>> (value: Arrays.Or<T>, then: (value: R extends (infer R)[] ? R : R) => unknown): State<T>

	map<R> (owner: Component, mapper: (value: T) => R): State.Generator<R>
	mapManual<R> (mapper: (value: T) => R): State.Generator<R>
	nonNullish: State<boolean>
	truthy: State<boolean>
	falsy: State<boolean>
	not: State<boolean>
}

interface State<T> extends ReadableState<T> {
	value: T
}

const SYMBOL_UNSUBSCRIBE = Symbol('UNSUBSCRIBE')
interface SubscriberFunction<T> {
	(value: T, oldValue: T): unknown
	[SYMBOL_UNSUBSCRIBE]?: Set<() => void>
}

const SYMBOL_VALUE = Symbol('VALUE')
const SYMBOL_SUBSCRIBERS = Symbol('SUBSCRIBERS')
interface InternalState<T> {
	[SYMBOL_VALUE]: T
	[SYMBOL_SUBSCRIBERS]: ((value: unknown, oldValue: unknown) => unknown)[]
}

function State<T> (defaultValue: T, equals?: (a: T, b: T) => boolean): State<T> {
	const result: Mutable<State<T>> & InternalState<T> = {
		isState: true,
		[SYMBOL_VALUE]: defaultValue,
		[SYMBOL_SUBSCRIBERS]: [],
		get value () {
			return result[SYMBOL_VALUE]
		},
		set value (value: T) {
			if (result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value))
				return

			const oldValue = result[SYMBOL_VALUE]
			result[SYMBOL_VALUE] = value
			result.emit(oldValue)
		},
		equals: value => result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value) || false,
		emit: oldValue => {
			for (const subscriber of result[SYMBOL_SUBSCRIBERS].slice())
				subscriber(result[SYMBOL_VALUE], oldValue)
			return result
		},
		use: (owner, subscriber) => {
			result.subscribe(owner, subscriber)
			subscriber(result[SYMBOL_VALUE], undefined)
			return () => result.unsubscribe(subscriber)
		},
		useManual: subscriber => {
			result.subscribeManual(subscriber)
			subscriber(result[SYMBOL_VALUE], undefined)
			return () => result.unsubscribe(subscriber)
		},
		subscribe: (owner, subscriber) => {
			if (owner.removed.value)
				return Functions.NO_OP

			function cleanup () {
				owner.removed.unsubscribe(cleanup)
				result.unsubscribe(subscriber)
				fn[SYMBOL_UNSUBSCRIBE]?.delete(cleanup)
			}

			const fn = subscriber as SubscriberFunction<T>
			fn[SYMBOL_UNSUBSCRIBE] ??= new Set()
			fn[SYMBOL_UNSUBSCRIBE].add(cleanup)
			owner.removed.subscribeManual(cleanup)
			result.subscribeManual(subscriber)
			return cleanup
		},
		subscribeManual: subscriber => {
			result[SYMBOL_SUBSCRIBERS].push(subscriber as never)
			return () => result.unsubscribe(subscriber)
		},
		unsubscribe: subscriber => {
			result[SYMBOL_SUBSCRIBERS].filterInPlace(s => s !== subscriber)
			return result
		},
		await (owner, values, then) {
			result.subscribe(owner, function awaitValue (newValue) {
				if (newValue !== values && (!Array.isArray(values) || !values.includes(newValue)))
					return

				result.unsubscribe(awaitValue)
				then(newValue as never)
			})
			return result
		},
		awaitManual (values, then) {
			result.subscribeManual(function awaitValue (newValue) {
				if (newValue !== values && (!Array.isArray(values) || !values.includes(newValue)))
					return

				result.unsubscribe(awaitValue)
				then(newValue as never)
			})
			return result
		},

		map: (owner, mapper) => State.Map(owner, [result], mapper),
		mapManual: mapper => State.MapManual([result], mapper),
		get nonNullish () {
			return Define.set(result, 'nonNullish', State
				.Generator(() => result.value !== undefined && result.value !== null)
				.observeManual(result))
		},
		get truthy () {
			return Define.set(result, 'truthy', State
				.Generator(() => !!result.value)
				.observeManual(result))
		},
		get not () {
			return getNot()
		},
		get falsy () {
			return getNot()
		},
	}
	return result

	function getNot () {
		const not = State
			.Generator(() => !result.value)
			.observeManual(result)
		Define.set(result, 'not', not)
		Define.set(result, 'falsy', not)
		return not
	}
}

namespace State {

	export function is<T> (value: unknown): value is ReadableState<T> {
		return typeof value === 'object' && (value as ReadableState<T>)?.isState === true
	}

	export function get<T> (value: T | State<T>): ReadableState<T> {
		return is<T>(value) ? value : State(value)
	}

	export interface Generator<T> extends ReadableState<T> {
		refresh (): this
		observe (owner: Component, ...states: (ReadableState<any> | undefined)[]): this
		observeManual (...states: (ReadableState<any> | undefined)[]): this
		unobserve (...states: (ReadableState<any> | undefined)[]): this
	}

	export function Generator<T> (generate: () => T): Generator<T> {
		const result = State(generate()) as Mutable<Generator<T>> & InternalState<T>

		Define.magic(result, 'value', {
			get: () => result[SYMBOL_VALUE],
		})

		result.refresh = () => {
			const value = generate()
			if (result.equals(value))
				return result

			const oldValue = result[SYMBOL_VALUE]
			result[SYMBOL_VALUE] = value
			result.emit(oldValue)
			return result
		}

		result.observe = (owner, ...states) => {
			if (owner.removed.value)
				return result

			for (const state of states)
				state?.subscribeManual(result.refresh)

			let unuseOwnerRemove: UnsubscribeState | undefined = owner.removed.subscribeManual(removed => removed && onRemove())
			return result

			function onRemove () {
				unuseOwnerRemove?.()
				unuseOwnerRemove = undefined
				for (const state of states)
					state?.unsubscribe(result.refresh)
			}
		}

		result.observeManual = (...states) => {
			for (const state of states)
				state?.subscribeManual(result.refresh)
			return result
		}

		result.unobserve = (...states) => {
			for (const state of states)
				state?.unsubscribe(result.refresh)
			return result
		}

		return result
	}

	export interface JIT<T> extends ReadableState<T, undefined> {
		markDirty (): this
		observe (...states: ReadableState<any>[]): this
		unobserve (...states: ReadableState<any>[]): this
	}

	export function JIT<T> (generate: () => T): JIT<T> {
		const result = State(undefined) as Mutable<JIT<T>> & InternalState<T>

		let isCached = false
		let cached: T | undefined
		Define.magic(result, 'value', {
			get: () => {
				if (!isCached) {
					isCached = true
					cached = generate()
				}

				return cached as T
			},
		})

		result.emit = () => {
			for (const subscriber of result[SYMBOL_SUBSCRIBERS].slice())
				subscriber(undefined, cached)
			return result
		}

		result.markDirty = () => {
			const oldValue = cached
			isCached = false
			cached = undefined
			result.emit(oldValue as undefined)
			return result
		}

		result.observe = (...states) => {
			for (const state of states)
				state.subscribeManual(result.markDirty)
			return result
		}

		result.unobserve = (...states) => {
			for (const state of states)
				state.unsubscribe(result.markDirty)
			return result
		}

		return result
	}

	export function Truthy (owner: Component, state: ReadableState<any>): Generator<boolean> {
		return Generator(() => !!state.value)
			.observe(owner, state)
	}

	export function NonNullish (owner: Component, state: ReadableState<any>): Generator<boolean> {
		return Generator(() => state.value !== undefined && state.value !== null)
			.observe(owner, state)
	}

	export function Falsy (owner: Component, state: ReadableState<any>): Generator<boolean> {
		return Generator(() => !!state.value)
			.observe(owner, state)
	}

	export function Some (owner: Component, ...anyOfStates: ReadableState<unknown>[]): Generator<boolean> {
		return Generator(() => anyOfStates.some(state => state.value))
			.observe(owner, ...anyOfStates)
	}

	export function Every (owner: Component, ...anyOfStates: ReadableState<unknown>[]): Generator<boolean> {
		return Generator(() => anyOfStates.every(state => state.value))
			.observe(owner, ...anyOfStates)
	}

	export function Map<const INPUT extends (ReadableState<unknown> | undefined)[], OUTPUT> (owner: Component, inputs: INPUT, outputGenerator: (...inputs: NoInfer<{ [I in keyof INPUT]: INPUT[I] extends ReadableState<infer INPUT> ? INPUT : undefined }>) => OUTPUT): Generator<OUTPUT> {
		return Generator(() => outputGenerator(...inputs.map(input => input?.value) as never))
			.observe(owner, ...inputs.filter(Arrays.filterNullish))
	}

	export function MapManual<const INPUT extends (ReadableState<unknown> | undefined)[], OUTPUT> (inputs: INPUT, outputGenerator: (...inputs: NoInfer<{ [I in keyof INPUT]: Exclude<INPUT[I], undefined> extends ReadableState<infer INPUT> ? INPUT : undefined }>) => OUTPUT): Generator<OUTPUT> {
		return Generator(() => outputGenerator(...inputs.map(input => input?.value) as never))
			.observeManual(...inputs.filter(Arrays.filterNullish))
	}

	export function Use<const INPUT extends Record<string, (ReadableState<unknown> | undefined)>> (owner: Component, input: INPUT): Generator<{ [KEY in keyof INPUT]: INPUT[KEY] extends ReadableState<infer INPUT> ? INPUT : undefined }> {
		return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]) as never)
			.observe(owner, ...Object.values(input).filter(Arrays.filterNullish))
	}

	export function UseManual<const INPUT extends Record<string, (ReadableState<unknown> | undefined)>> (input: INPUT): Generator<{ [KEY in keyof INPUT]: INPUT[KEY] extends ReadableState<infer INPUT> ? INPUT : undefined }> {
		return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]) as never)
			.observeManual(...Object.values(input).filter(Arrays.filterNullish))
	}
}

export default State
