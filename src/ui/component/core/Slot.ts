import Component from "ui/Component"
import type { AbortPromiseOr } from "utility/AbortPromise"
import AbortPromise from "utility/AbortPromise"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

export type SlotCleanup = () => any
export type SlotInitialiserReturn = AbortPromiseOr<SlotCleanup | Component | undefined | null | false | 0 | "" | void>

interface SlotExtensions {
	use<T> (state: State<T>, initialiser: (slot: Slot, value: T) => SlotInitialiserReturn): this
	if (state: State<boolean>, initialiser: (slot: Slot) => SlotInitialiserReturn): this
}

interface Slot extends Component, SlotExtensions { }

const Slot = Object.assign(
	Component.Builder((slot): Slot => {
		slot.style("slot")

		let unuse: UnsubscribeState | undefined
		let cleanup: SlotCleanup | undefined
		let abort: (() => any) | undefined
		return slot
			.extend<SlotExtensions>(slot => ({
				use: (state, initialiser) => {
					unuse?.(); unuse = undefined
					abort?.(); abort = undefined

					unuse = state.use(slot, value => {
						abort?.(); abort = undefined
						cleanup?.(); cleanup = undefined

						slot.removeContents()

						handleSlotInitialiserReturn(initialiser(slot, value))
					})

					return slot
				},
				if: (state, initialiser) => {
					unuse?.(); unuse = undefined
					abort?.(); abort = undefined

					state.use(slot, value => {
						abort?.(); abort = undefined
						cleanup?.(); cleanup = undefined

						slot.removeContents()

						if (!value)
							return

						handleSlotInitialiserReturn(initialiser(slot))
					})

					return slot
				},
			}))
			.event.subscribe("remove", () => cleanup?.())

		function handleSlotInitialiserReturn (result: SlotInitialiserReturn) {
			if (!(result instanceof AbortPromise))
				return handleSlotInitialiserReturnNonPromise(result || undefined)

			abort = result.abort
			result.then(result => handleSlotInitialiserReturnNonPromise(result || undefined))
				.catch(err => console.error("Slot initialiser promise rejection:", err))
		}

		function handleSlotInitialiserReturnNonPromise (result: Exclude<SlotInitialiserReturn, Promise<any> | void> | undefined) {
			result ||= undefined

			if (result === slot)
				result = undefined

			if (Component.is(result)) {
				result.appendTo(slot)
				cleanup = undefined
				return
			}

			cleanup = result
		}
	}),
	{
		using: <T> (value: T | State<T>, initialiser: (slot: Slot, value: T) => SlotInitialiserReturn) =>
			Slot().use(State.get(value), initialiser),
	}
)

export default Slot
