import type Component from 'ui/Component'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import type Arrays from 'utility/Arrays'
import { NonNullish as FilterNonNullish } from 'utility/Arrays'
import Define from 'utility/Define'
import Functions from 'utility/Functions'
import type { Mutable as MakeMutable } from 'utility/Type'

export type Owner =
	| Component
	| ComponentInsertionTransaction

namespace Owner {
	export function getOwnershipState (ownerIn: Owner) {
		const owner = ownerIn as Partial<Component> & Partial<ComponentInsertionTransaction>
		return owner.removed ?? owner.closed
	}
}

export type StateOr<T> = State<T> | T
export type MutableStateOr<T> = MutableState<T> | T

export type UnsubscribeState = () => void

interface State<T, E = T> {
	readonly isState: true
	readonly value: T

	readonly equals: <V extends T>(value: V) => boolean

	/** Subscribe to state change events. Receive the initial state as an event. */
	use (owner: Owner, subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	useManual (subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	/** Subscribe to state change events. The initial state is not sent as an event. */
	subscribe (owner: Owner, subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	subscribeManual (subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	unsubscribe (subscriber: (value: E, oldValue?: E) => unknown): void
	emit (oldValue?: E): void
	await<R extends Arrays.Or<T>> (owner: Owner, value: R, then: (value: R extends (infer R)[] ? R : R) => unknown): this
	awaitManual<R extends Arrays.Or<T>> (value: Arrays.Or<T>, then: (value: R extends (infer R)[] ? R : R) => unknown): this

	map<R> (owner: Owner, mapper: (value: T) => StateOr<R>): State.Generator<R>
	mapManual<R> (mapper: (value: T) => StateOr<R>): State.Generator<R>
	nonNullish: State.Generator<boolean>
	truthy: State.Generator<boolean>
	falsy: State.Generator<boolean>
	not: State.Generator<boolean>

	asMutable?: MutableState<T>
}

interface MutableState<T> extends State<T> {
	value: T
	setValue (value: T): this
	bind (owner: Owner, state: State<T>): UnsubscribeState
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

function State<T> (defaultValue: T, equals?: (a: T, b: T) => boolean): MutableState<T> {
	let unuseBoundState: UnsubscribeState | undefined
	const result: MakeMutable<MutableState<T>> & InternalState<T> = {
		isState: true,
		[SYMBOL_VALUE]: defaultValue,
		[SYMBOL_SUBSCRIBERS]: [],
		get value () {
			return result[SYMBOL_VALUE]
		},
		set value (value: T) {
			unuseBoundState?.()
			setValue(value)
		},
		setValue (value) {
			unuseBoundState?.()
			setValue(value)
			return result
		},
		equals: value => result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value) || false,
		emit: oldValue => {
			for (const subscriber of result[SYMBOL_SUBSCRIBERS].slice())
				subscriber(result[SYMBOL_VALUE], oldValue)
			return result
		},
		bind (owner, state) {
			unuseBoundState?.()
			unuseBoundState = state.use(owner, setValue)
			return unuseBoundState
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
			const ownerClosedState = Owner.getOwnershipState(owner)
			if (!ownerClosedState || ownerClosedState.value)
				return Functions.NO_OP

			function cleanup () {
				ownerClosedState!.unsubscribe(cleanup)
				result.unsubscribe(subscriber)
				fn[SYMBOL_UNSUBSCRIBE]?.delete(cleanup)
			}

			State.OwnerMetadata.setHasSubscriptions(owner)
			const fn = subscriber as SubscriberFunction<T>
			fn[SYMBOL_UNSUBSCRIBE] ??= new Set()
			fn[SYMBOL_UNSUBSCRIBE].add(cleanup)
			ownerClosedState.subscribeManual(cleanup)
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
	result.asMutable = result
	return result

	function setValue (value: T) {
		if (result[SYMBOL_VALUE] === value || equals?.(result[SYMBOL_VALUE], value))
			return

		const oldValue = result[SYMBOL_VALUE]
		result[SYMBOL_VALUE] = value
		result.emit(oldValue)
	}

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

	export type Mutable<T> = MutableState<T>

	export function is<T> (value: unknown): value is State<T> {
		return typeof value === 'object' && (value as State<T>)?.isState === true
	}

	export function get<T> (value: T | State<T>): State<T> {
		return is<T>(value) ? value : State(value)
	}

	const SYMBOL_HAS_SUBSCRIPTIONS = Symbol('HAS_SUBSCRIPTIONS')
	export interface OwnerMetadata {
		[SYMBOL_HAS_SUBSCRIPTIONS]?: boolean
	}
	export namespace OwnerMetadata {
		export function setHasSubscriptions (owner: Owner) {
			(owner as any as OwnerMetadata)[SYMBOL_HAS_SUBSCRIPTIONS] = true
		}

		export function hasSubscriptions (owner: Owner) {
			return (owner as any as OwnerMetadata)[SYMBOL_HAS_SUBSCRIPTIONS] === true
		}
	}

	export interface Generator<T> extends State<T> {
		refresh (): this
		observe (owner: Owner, ...states: (State<any> | undefined)[]): this
		observeManual (...states: (State<any> | undefined)[]): this
		unobserve (...states: (State<any> | undefined)[]): this
	}

	export function Generator<T> (generate: () => StateOr<T>): Generator<T> {
		const result = State(generate()) as State<T> as MakeMutable<Generator<T>> & InternalState<T>
		delete result.asMutable

		Define.magic(result, 'value', {
			get: () => result[SYMBOL_VALUE],
		})

		let unuseInternalState: UnsubscribeState | undefined
		result.refresh = () => {
			unuseInternalState?.(); unuseInternalState = undefined

			const value = generate()
			if (State.is(value)) {
				unuseInternalState = value.useManual(value => {
					if (result.equals(value))
						return result

					const oldValue = result[SYMBOL_VALUE]
					result[SYMBOL_VALUE] = value
					result.emit(oldValue)
				})
				return result
			}

			if (result.equals(value))
				return result

			const oldValue = result[SYMBOL_VALUE]
			result[SYMBOL_VALUE] = value
			result.emit(oldValue)
			return result
		}

		result.observe = (owner, ...states) => {
			const ownerClosedState = Owner.getOwnershipState(owner)
			if (!ownerClosedState || ownerClosedState.value)
				return result

			OwnerMetadata.setHasSubscriptions(owner)

			for (const state of states)
				state?.subscribeManual(result.refresh)

			let unuseOwnerRemove: UnsubscribeState | undefined = ownerClosedState.subscribeManual(removed => removed && onRemove())
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

	export interface JIT<T> extends State<T, undefined> {
		markDirty (): this
		observe (...states: State<any>[]): this
		unobserve (...states: State<any>[]): this
	}

	export function JIT<T> (generate: () => StateOr<T>): JIT<T> {
		const result = State(undefined) as State<T | undefined> as MakeMutable<JIT<T>> & InternalState<T>
		delete result.asMutable

		let isCached = false
		let cached: T | undefined
		let unuseInternalState: UnsubscribeState | undefined
		Define.magic(result, 'value', {
			get: () => {
				if (!isCached) {
					unuseInternalState?.(); unuseInternalState = undefined

					isCached = true

					const result = generate()
					if (State.is(result))
						unuseInternalState = result.useManual(value => cached = value)
					else
						cached = result
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
			unuseInternalState?.(); unuseInternalState = undefined
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

	export function Truthy (owner: Owner, state: State<any>): Generator<boolean> {
		return Generator(() => !!state.value)
			.observe(owner, state)
	}

	export function NonNullish (owner: Owner, state: State<any>): Generator<boolean> {
		return Generator(() => state.value !== undefined && state.value !== null)
			.observe(owner, state)
	}

	export function Falsy (owner: Owner, state: State<any>): Generator<boolean> {
		return Generator(() => !!state.value)
			.observe(owner, state)
	}

	export function Some (owner: Owner, ...anyOfStates: State<unknown>[]): Generator<boolean> {
		return Generator(() => anyOfStates.some(state => state.value))
			.observe(owner, ...anyOfStates)
	}

	export function Every (owner: Owner, ...anyOfStates: State<unknown>[]): Generator<boolean> {
		return Generator(() => anyOfStates.every(state => state.value))
			.observe(owner, ...anyOfStates)
	}

	export function Map<const INPUT extends (State<unknown> | undefined)[], OUTPUT> (owner: Owner, inputs: INPUT, outputGenerator: (...inputs: NoInfer<{ [I in keyof INPUT]: INPUT[I] extends State<infer INPUT> ? INPUT : undefined }>) => StateOr<OUTPUT>): Generator<OUTPUT> {
		return Generator(() => outputGenerator(...inputs.map(input => input?.value) as never))
			.observe(owner, ...inputs.filter(FilterNonNullish))
	}

	export function MapManual<const INPUT extends (State<unknown> | undefined)[], OUTPUT> (inputs: INPUT, outputGenerator: (...inputs: NoInfer<{ [I in keyof INPUT]: Exclude<INPUT[I], undefined> extends State<infer INPUT> ? INPUT : undefined }>) => StateOr<OUTPUT>): Generator<OUTPUT> {
		return Generator(() => outputGenerator(...inputs.map(input => input?.value) as never))
			.observeManual(...inputs.filter(FilterNonNullish))
	}

	export function Use<const INPUT extends Record<string, (State<unknown> | undefined)>> (owner: Owner, input: INPUT): Generator<{ [KEY in keyof INPUT]: INPUT[KEY] extends State<infer INPUT> ? INPUT : undefined }> {
		return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]) as never)
			.observe(owner, ...Object.values(input).filter(FilterNonNullish))
	}

	export function UseManual<const INPUT extends Record<string, (State<unknown> | undefined)>> (input: INPUT): Generator<{ [KEY in keyof INPUT]: INPUT[KEY] extends State<infer INPUT> ? INPUT : undefined }> {
		return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]) as never)
			.observeManual(...Object.values(input).filter(FilterNonNullish))
	}
}

export default State
