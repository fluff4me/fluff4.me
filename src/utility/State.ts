import type { Paths } from 'api.fluff4.me'
import type Endpoint from 'endpoint/Endpoint'
import type { EndpointResponse, PreparedQueryOf, ResponseData } from 'endpoint/Endpoint'
import type Component from 'ui/Component'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import type { Quilt } from 'ui/utility/StringApplicator'
import type Arrays from 'utility/Arrays'
import { NonNullish as FilterNonNullish } from 'utility/Arrays'
import Define from 'utility/Define'
import Functions from 'utility/Functions'
import { mutable } from 'utility/Objects'
import type { Mutable as MakeMutable } from 'utility/Type'

export type StateOr<T> = State<T> | T
export type MutableStateOr<T> = MutableState<T> | T

export type UnsubscribeState = () => void
export type ComparatorFunction<T> = false | ((a: T, b: T) => boolean)

interface State<T, E = T> {
	readonly isState: true
	readonly value: T

	readonly comparator: <V extends T>(value: V) => boolean

	id?: string
	setId (id: string): this

	/** Subscribe to state change events. Receive the initial state as an event. */
	use (owner: State.Owner, subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	useManual (subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	/** Subscribe to state change events. The initial state is not sent as an event. */
	subscribe (owner: State.Owner, subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	subscribeManual (subscriber: (value: E, oldValue?: E) => unknown): UnsubscribeState
	unsubscribe (subscriber: (value: E, oldValue?: E) => unknown): void
	emit (oldValue?: E): void
	await<R extends Arrays.Or<T>> (owner: State.Owner, value: R, then: (value: R extends (infer R)[] ? R : R) => unknown): UnsubscribeState
	awaitManual<R extends Arrays.Or<T>> (value: R, then: (value: R extends (infer R)[] ? R : R) => unknown): UnsubscribeState

	map<R> (owner: State.Owner, mapper: (value: T) => StateOr<R>, equals?: ComparatorFunction<R>): State.Generator<R>
	mapManual<R> (mapper: (value: T) => StateOr<R>, equals?: ComparatorFunction<R>): State.Generator<R>
	nonNullish: State.Generator<boolean>
	truthy: State.Generator<boolean>
	falsy: State.Generator<boolean>
	not: State.Generator<boolean>
	equals (value: T): State.Generator<boolean>

	asMutable?: MutableState<T>
}

interface MutableStateSimple<T> extends State<T> {
	value: T
}

interface MutableState<T> extends MutableStateSimple<T> {
	setValue (value: T): this
	bind (owner: State.Owner, state: State<T>): UnsubscribeState
	bindManual (state: State<T>): UnsubscribeState
}

// const SYMBOL_UNSUBSCRIBE = Symbol('UNSUBSCRIBE')
// interface SubscriberFunction<T> {
// 	(value: T, oldValue: T): unknown
// 	[SYMBOL_UNSUBSCRIBE]?: Set<() => void>
// }

const SYMBOL_VALUE = Symbol('VALUE')
const SYMBOL_SUBSCRIBERS = Symbol('SUBSCRIBERS')
interface InternalState<T> {
	[SYMBOL_VALUE]: T
	[SYMBOL_SUBSCRIBERS]: ((value: unknown, oldValue: unknown) => unknown)[]
}

function State<T> (defaultValue: T, comparator?: ComparatorFunction<T>): MutableState<T> {
	let unuseBoundState: UnsubscribeState | undefined
	let equalsMap: Map<T, State.Generator<boolean>> | undefined
	const result: MakeMutable<MutableState<T>> & InternalState<T> = {
		isState: true,
		setId (id) {
			result.id = id
			return result
		},
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
		comparator: value => comparator === false ? false
			: result[SYMBOL_VALUE] === value || comparator?.(result[SYMBOL_VALUE], value) || false,
		emit: oldValue => {
			if (result.id !== undefined)
				console.log('emit', result.id)

			for (const subscriber of result[SYMBOL_SUBSCRIBERS].slice())
				subscriber(result[SYMBOL_VALUE], oldValue)

			return result
		},
		bind (owner, state) {
			if (state.id)
				console.log('bind', state.id)
			unuseBoundState?.()
			unuseBoundState = state.use(owner, setValue)
			return unuseBoundState
		},
		bindManual (state) {
			if (state.id)
				console.log('bind', state.id)
			unuseBoundState?.()
			unuseBoundState = state.useManual(setValue)
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
			const ownerClosedState = State.Owner.getOwnershipState(owner)
			if (!ownerClosedState || ownerClosedState.value)
				return Functions.NO_OP

			function cleanup () {
				ownerClosedState.unsubscribe(cleanup)
				result.unsubscribe(subscriber)
				// fn[SYMBOL_UNSUBSCRIBE]?.delete(cleanup)
			}

			State.OwnerMetadata.setHasSubscriptions(owner)
			// const fn = subscriber as SubscriberFunction<T>
			// fn[SYMBOL_UNSUBSCRIBE] ??= new Set()
			// fn[SYMBOL_UNSUBSCRIBE].add(cleanup)
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
			return result.use(owner, function awaitValue (newValue) {
				if (newValue !== values && (!Array.isArray(values) || !values.includes(newValue)))
					return

				result.unsubscribe(awaitValue)
				then(newValue as never)
			})
		},
		awaitManual (values, then) {
			return result.useManual(function awaitValue (newValue) {
				if (newValue !== values && (!Array.isArray(values) || !values.includes(newValue)))
					return

				result.unsubscribe(awaitValue)
				then(newValue as never)
			})
		},

		map: (owner, mapper, equals) => State.Map(owner, [result], mapper, equals),
		mapManual: (mapper, equals) => State.MapManual([result], mapper, equals),
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
		equals (value) {
			equalsMap ??= new Map()
			return equalsMap.compute(value, () => State.Generator(() => result.value === value)
				.observeManual(result))
		},
	}
	result.asMutable = result
	return result

	function setValue (value: T) {
		if (comparator !== false && (result[SYMBOL_VALUE] === value || comparator?.(result[SYMBOL_VALUE], value)))
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

	export type Owner =
		| ({ removed: State<boolean>, remove (): void } & Partial<Component>)
		| ComponentInsertionTransaction

	export namespace Owner {
		export function getOwnershipState (ownerIn: Owner): State<boolean>
		export function getOwnershipState (ownerIn?: unknown): State<boolean> | undefined
		export function getOwnershipState (ownerIn: unknown) {
			const owner = ownerIn as Partial<Component> & Partial<ComponentInsertionTransaction>
			return owner.removed ?? owner.closed
		}

		export type Removable = Extract<Owner, { remove (): void }>

		export function create (): Owner.Removable {
			const removed = State(false)
			return {
				removed,
				remove: () => removed.value = true,
			}
		}
	}

	export type Mutable<T> = MutableState<T>
	export type MutableSetOnly<T> = MutableStateSimple<T>

	export function is<T> (value: unknown): value is State<T> {
		return typeof value === 'object' && (value as State<T>)?.isState === true
	}

	export function get<T> (value: T | State.Mutable<T>): State.Mutable<T>
	export function get<T> (value: T | State<T>): State<T>
	export function get<T> (value: T | State<T>): State<T> {
		return is<T>(value) ? value : State(value)
	}

	export function value<T> (state: T | State<T>): T {
		return is<T>(state) ? state.value : state
	}

	export function getInternalValue<T> (state: T | State<T>): T {
		return is<T>(state) ? (state as State<T> & InternalState<T>)[SYMBOL_VALUE] : state
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
		refresh (): this // NEVER ACCEPT A BOOL PARAM HERE. It breaks everything and I don't know why
		regenerate (): this
		observe (owner: Owner, ...states: (State<any> | undefined)[]): this
		observeManual (...states: (State<any> | undefined)[]): this
		unobserve (...states: (State<any> | undefined)[]): this
	}

	export function Generator<T> (generate: () => StateOr<T>, equals?: ComparatorFunction<T>): Generator<T> {
		const result = State(undefined as T, equals) as State<T> as MakeMutable<Generator<T>> & InternalState<T>
		delete result.asMutable

		Define.magic(result, 'value', {
			get: () => result[SYMBOL_VALUE],
		})

		let initial = true
		let unuseInternalState: UnsubscribeState | undefined
		result.refresh = () => refreshInternal()
		result.regenerate = () => refreshInternal(true)

		result.refresh()

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

		function refreshInternal (forceOverwrite?: true) {
			unuseInternalState?.(); unuseInternalState = undefined

			const value = generate()
			if (State.is(value)) {
				unuseInternalState = value.useManual(value => {
					if (result.comparator(value))
						return result

					const oldValue = result[SYMBOL_VALUE]
					result[SYMBOL_VALUE] = value
					result.emit(oldValue)
				})
				return result
			}

			if (result.comparator(value) && !initial && !forceOverwrite)
				return result

			initial = false
			const oldValue = result[SYMBOL_VALUE]
			result[SYMBOL_VALUE] = value
			result.emit(oldValue)
			return result
		}
	}

	export interface JIT<T> extends State<T, () => T> {
		markDirty (): this
		observe (...states: State<any>[]): this
		unobserve (...states: State<any>[]): this
	}

	export function JIT<T> (generate: (owner: Owner) => StateOr<T>): JIT<T> {
		const result = State(undefined!) as State<T, () => T> as MakeMutable<JIT<T>> & InternalState<T>
		delete result.asMutable

		let isCached = false
		let cached: T | undefined
		let unuseInternalState: UnsubscribeState | undefined
		let owner: Owner.Removable | undefined
		Define.magic(result, 'value', {
			get: () => {
				if (!isCached) {
					unuseInternalState?.(); unuseInternalState = undefined
					owner?.remove(); owner = undefined

					isCached = true

					owner = Owner.create()
					const result = generate(owner)
					if (State.is(result))
						unuseInternalState = result.useManual(value => cached = value)
					else
						cached = result
				}

				return cached as T
			},
		})

		const get = () => result.value
		result.emit = () => {
			for (const subscriber of result[SYMBOL_SUBSCRIBERS].slice())
				subscriber(get, cached)
			return result
		}

		result.use = (owner, subscriber) => {
			result.subscribe(owner, subscriber)
			subscriber(get, undefined)
			return () => result.unsubscribe(subscriber)
		}
		result.useManual = subscriber => {
			result.subscribeManual(subscriber)
			subscriber(get, undefined)
			return () => result.unsubscribe(subscriber)
		}

		result.markDirty = () => {
			unuseInternalState?.(); unuseInternalState = undefined
			owner?.remove(); owner = undefined
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

	export interface AsyncStatePending<T> {
		readonly settled: false
		readonly value: undefined
		readonly lastValue: T | undefined
		readonly error: undefined
		readonly progress: AsyncProgress | undefined
	}

	export interface AsyncStateResolved<T> {
		readonly settled: true
		readonly value: T
		readonly lastValue: T | undefined
		readonly error: undefined
		readonly progress: undefined
	}

	export interface AsyncStateRejected<T> {
		readonly settled: true
		readonly value: undefined
		readonly lastValue: T | undefined
		readonly error: Error
		readonly progress: undefined
	}

	export type AsyncState<T> = AsyncStatePending<T> | AsyncStateResolved<T> | AsyncStateRejected<T>

	export interface AsyncProgress {
		readonly progress: number
		readonly message?: string | Quilt.Handler
	}

	export interface Async<T> extends State<T | undefined> {
		readonly settled: State<boolean>
		readonly lastValue: State<T | undefined>
		readonly error: State<Error | undefined>
		readonly state: State<AsyncState<T>>
		readonly progress: State<AsyncProgress | undefined>
	}

	export function Async<FROM, T> (owner: State.Owner, from: State<FROM>, generator: (value: FROM, signal: AbortSignal, setProgress: (progress: number, message?: string | Quilt.Handler) => void) => Promise<T>): Async<T> {
		const state = State<AsyncState<T>>({
			settled: false,
			value: undefined,
			lastValue: undefined,
			error: undefined,
			progress: undefined,
		})

		const settled = state.mapManual(state => state.settled)
		const error = state.mapManual(state => state.error)
		const value = state.mapManual(state => state.value)
		const lastValue = state.mapManual(state => state.lastValue)
		const progress = state.mapManual(state => state.progress)
		let abortController: AbortController | undefined

		from.use(owner, async from => {
			abortController?.abort()

			const lastValue = state.value.value
			state.value = {
				settled: false,
				value: undefined,
				lastValue,
				error: undefined,
				progress: undefined,
			}
			abortController = new AbortController()
			const { value, error } = await Promise
				.resolve(generator(from, abortController.signal, (progress, message) => {
					mutable(state.value).progress = { progress, message }
					state.emit()
				}))
				.then(
					value => ({ value, error: undefined }),
					error => ({ error: new Error('Async state rejection:', { cause: error }), value: undefined }),
				)

			if (abortController.signal.aborted)
				return

			state.value = {
				settled: true,
				value,
				lastValue,
				error,
				progress: undefined,
			} as AsyncState<T>
		})

		return Object.assign(
			value,
			{
				settled,
				lastValue,
				error,
				state,
				progress,
			}
		)
	}

	export interface EndpointResult<T> extends Async<T> {
		refresh (): void
	}

	export namespace Async {

		export function fromEndpoint<const QUERY extends PreparedQueryOf<Endpoint<keyof Paths>>> (owner: State.Owner, endpoint: QUERY): EndpointResult<ResponseData<EndpointResponse<QUERY>>> {
			const refresher = State(null)
			return Object.assign(
				Async(owner, refresher, async (_, signal) => {
					const response = await endpoint.query()
					if (response instanceof Error)
						throw response

					return response?.data as ResponseData<EndpointResponse<QUERY>>
				}),
				{
					refresh () {
						refresher.emit()
					},
				}
			)
		}
	}

	export interface ArrayItem<T> {
		value: T
		index: number
		removed: State<boolean>
	}

	export interface ArraySubscriber<T> {
		onItem (item: State<ArrayItem<T>>, state: Array<T>): unknown
		onMove (startIndex: number, endIndex: number, newStartIndex: number): unknown
		onMoveAt (indices: number[], newStartIndex: number): unknown
	}

	export interface Array<T> extends State<readonly T[]> {
		readonly length: State<number>

		set (index: number, value: T): this
		emitItem (index: number): this
		modify (index: number, modifier: (value: T, index: number, array: this) => T | void): this
		clear (): this
		push (...values: T[]): this
		unshift (...values: T[]): this
		pop (): this
		shift (): this
		splice (start: number, deleteCount: number, ...values: T[]): this
		filterInPlace (predicate: (value: T, index: number) => boolean): this
		move (startIndex: number, endIndex: number, newStartIndex: number): this
		moveAt (indices: number[], newStartIndex: number): this

		useEach (owner: State.Owner, subscriber: ArraySubscriber<T>): UnsubscribeState
	}

	export function Array<T> (...values: T[]): Array<T> {
		const itemStates: State<ArrayItem<T>>[] = []
		const subscribers: ArraySubscriber<T>[] = []

		const state: Array<T> = Object.assign(
			State(values),
			{
				length: undefined!,
				set (index: number, value: T) {
					values[index] = value
					const itemState = itemStates[index]
					itemState.value.value = value
					itemState.emit()
					state.emit()
					return state
				},
				emitItem (index: number) {
					itemStates[index]?.emit()
					return state
				},
				modify (index: number, modifier: (value: T, index: number, array: Array<T>) => T) {
					let value = values[index]
					value = modifier(value, index, state) ?? value
					state.set(index, value)
					return state
				},
				clear () {
					values.length = 0
					itemStates.length = 0
					state.emit()
					return state
				},
				push (...newValues: T[]) {
					const start = state.value.length
					values.push(...newValues)
					for (let i = 0; i < newValues.length; i++)
						itemStates.push(addState(newValues[i], start + i))

					state.emit()
					return state
				},
				unshift (...newValues: T[]) {
					values.unshift(...newValues)
					for (let i = 0; i < newValues.length; i++)
						itemStates.unshift(addState(newValues[i], i))

					for (let i = newValues.length; i < itemStates.length; i++)
						itemStates[i].value.index = i

					for (let i = newValues.length; i < itemStates.length; i++)
						itemStates[i].emit()

					state.emit()
					return state
				},
				pop () {
					values.pop()
					itemStates.pop()
					state.emit()
					return state
				},
				shift () {
					values.shift()
					itemStates.shift()
					for (let i = 0; i < itemStates.length; i++)
						itemStates[i].value.index = i

					for (const itemState of itemStates)
						itemState.emit()

					state.emit()
					return state
				},
				splice (start: number, deleteCount: number, ...newValues: T[]) {
					values.splice(start, deleteCount, ...newValues)

					itemStates.splice(start, deleteCount, ...newValues
						.map((value, i) => addState(value, start + i)))

					for (let i = start + newValues.length; i < itemStates.length; i++)
						itemStates[i].value.index = i

					for (let i = start + newValues.length; i < itemStates.length; i++)
						itemStates[i].emit()

					state.emit()
					return state
				},
				filterInPlace (predicate: (value: T, index: number) => boolean) {
					values.filterInPlace(predicate)
					let oldStatesI = 0
					NextValue: for (let i = 0; i < values.length; i++) {
						while (oldStatesI < itemStates.length) {
							if (itemStates[oldStatesI].value.value !== values[i]) {
								itemStates[oldStatesI].value.removed.asMutable?.setValue(true)
								oldStatesI++
								continue
							}

							itemStates[i] = itemStates[oldStatesI]
							itemStates[i].value.index = i
							oldStatesI++
							continue NextValue
						}
					}

					// clip off the states that were pulled back or not included
					for (let i = oldStatesI; i < itemStates.length; i++)
						itemStates[i].value.removed.asMutable?.setValue(true)
					itemStates.length = values.length

					for (const itemState of itemStates)
						itemState.emit()

					state.emit()
					return state
				},
				move (startIndex: number, endIndex: number, newStartIndex: number) {
					startIndex = Math.max(0, startIndex)
					endIndex = Math.min(endIndex, values.length)

					newStartIndex = Math.max(0, Math.min(newStartIndex, values.length))

					if (startIndex >= endIndex)
						return state

					if (newStartIndex >= startIndex && newStartIndex < endIndex)
						// if the slice is moved to a new position within itself, do nothing
						return state

					const valuesToMove = values.splice(startIndex, endIndex - startIndex)
					const statesToMove = itemStates.splice(startIndex, endIndex - startIndex)

					const actualInsertionIndex = startIndex < newStartIndex
						? newStartIndex - (endIndex - startIndex) + 1 // account for spliced out indices
						: newStartIndex

					values.splice(actualInsertionIndex, 0, ...valuesToMove)
					itemStates.splice(actualInsertionIndex, 0, ...statesToMove)

					const emitIndices: number[] = []
					for (let i = 0; i < itemStates.length; i++) {
						const savedIndex = itemStates[i].value.index
						if (savedIndex !== i) {
							itemStates[i].value.index = i
							emitIndices.push(i)
						}
					}

					for (const index of emitIndices)
						itemStates[index]?.emit()

					for (const subscriber of subscribers)
						subscriber.onMove(startIndex, endIndex, newStartIndex)

					state.emit()
					return state
				},
				moveAt (movingIndices: number[], newStartIndex: number) {
					if (!movingIndices.length)
						return state

					const length = values.length
					movingIndices = movingIndices
						.map(i => Math.max(0, Math.min(length - 1, i)))
						.distinctInPlace()
						.sort((a, b) => a - b)

					newStartIndex = Math.min(newStartIndex, length - movingIndices.length)

					let staticReadIndex = 0
					let movingReadIndex = 0
					let writeIndex = 0
					let movedCount = 0

					const sourceValues = values.slice()
					const sourceItems = itemStates.slice()

					let mode: 'moving' | 'static'

					while (writeIndex < length) {
						mode = writeIndex >= newStartIndex && movedCount < movingIndices.length ? 'moving' : 'static'

						if (mode === 'static') {
							for (let i = staticReadIndex; i < length; i++)
								if (!movingIndices.includes(i)) {
									staticReadIndex = i
									break
								}

							values[writeIndex] = sourceValues[staticReadIndex]
							itemStates[writeIndex] = sourceItems[staticReadIndex]
							staticReadIndex++
							writeIndex++
						}
						else {
							values[writeIndex] = sourceValues[movingIndices[movingReadIndex]]
							itemStates[writeIndex] = sourceItems[movingIndices[movingReadIndex]]
							movingReadIndex++
							movedCount++
							writeIndex++
						}
					}

					const emitIndices: number[] = []
					for (let i = 0; i < itemStates.length; i++) {
						const savedIndex = itemStates[i].value.index
						if (savedIndex !== i) {
							itemStates[i].value.index = i
							emitIndices.push(i)
						}
					}

					for (const index of emitIndices)
						itemStates[index]?.emit()

					for (const subscriber of subscribers)
						subscriber.onMoveAt(movingIndices, newStartIndex)

					state.emit()
					return state
				},

				useEach (owner: State.Owner, subscriber: ArraySubscriber<T>) {
					const ownerClosedState = State.Owner.getOwnershipState(owner)
					if (!ownerClosedState || ownerClosedState.value)
						return Functions.NO_OP

					for (const itemState of itemStates)
						subscriber.onItem(itemState, state)

					State.OwnerMetadata.setHasSubscriptions(owner)
					// const fn = subscriber as SubscriberFunction<T>
					// fn[SYMBOL_UNSUBSCRIBE] ??= new Set()
					// fn[SYMBOL_UNSUBSCRIBE].add(cleanup)
					ownerClosedState.subscribeManual(cleanup)

					subscribers.push(subscriber)
					return cleanup

					function cleanup () {
						ownerClosedState.unsubscribe(cleanup)
						subscribers.filterInPlace(s => s !== subscriber)
						// fn[SYMBOL_UNSUBSCRIBE]?.delete(cleanup)
					}
				},
			}
		)

		mutable(state).length = state.mapManual(state => state.length)
		return state

		function addState (value: T, index: number) {
			const itemState = State({ value, index, removed: State(false) })

			for (const subscriber of subscribers)
				subscriber.onItem(itemState, state)

			return itemState
		}
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

	export function Map<const INPUT extends (State<unknown> | undefined)[], OUTPUT> (owner: Owner, inputs: INPUT, outputGenerator: (...inputs: NoInfer<{ [I in keyof INPUT]: INPUT[I] extends State<infer INPUT> ? INPUT : undefined }>) => StateOr<OUTPUT>, equals?: ComparatorFunction<NoInfer<OUTPUT>>): Generator<OUTPUT> {
		return Generator(() => outputGenerator(...inputs.map(input => input?.value) as never), equals)
			.observe(owner, ...inputs.filter(FilterNonNullish))
	}

	export function MapManual<const INPUT extends (State<unknown> | undefined)[], OUTPUT> (inputs: INPUT, outputGenerator: (...inputs: NoInfer<{ [I in keyof INPUT]: Exclude<INPUT[I], undefined> extends State<infer INPUT> ? INPUT : undefined }>) => StateOr<OUTPUT>, equals?: ComparatorFunction<NoInfer<OUTPUT>>): Generator<OUTPUT> {
		return Generator(() => outputGenerator(...inputs.map(input => input?.value) as never), equals)
			.observeManual(...inputs.filter(FilterNonNullish))
	}

	export function Use<const INPUT extends Record<string, (State<unknown> | undefined)>> (owner: Owner, input: INPUT): Generator<{ [KEY in keyof INPUT]: INPUT[KEY] extends State<infer INPUT, infer OUTPUT> ? INPUT : INPUT[KEY] extends State<infer INPUT, infer OUTPUT> | undefined ? INPUT | undefined : undefined }> {
		return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]) as never)
			.observe(owner, ...Object.values(input).filter(FilterNonNullish))
	}

	export function UseManual<const INPUT extends Record<string, (State<unknown> | undefined)>> (input: INPUT): Generator<{ [KEY in keyof INPUT]: INPUT[KEY] extends State<infer INPUT, infer OUTPUT> ? INPUT : INPUT[KEY] extends State<infer INPUT, infer OUTPUT> | undefined ? INPUT | undefined : undefined }> {
		return Generator(() => Object.entries(input).toObject(([key, state]) => [key, state?.value]) as never)
			.observeManual(...Object.values(input).filter(FilterNonNullish))
	}
}

export default State
