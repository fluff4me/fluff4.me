import Component from "ui/Component"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

export type SlotCleanup = () => any
export type SlotInitialiserReturn = SlotCleanup | Component | undefined | null | false | 0 | "" | void

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
		return slot
			.extend<SlotExtensions>(slot => ({
				use: (state, initialiser) => {
					unuse?.()
					unuse = state.use(slot, value => {
						cleanup?.()
						slot.removeContents()

						let result = initialiser(slot, value) || undefined
						if (result === slot)
							result = undefined

						if (Component.is(result)) {
							result.appendTo(slot)
							cleanup = undefined
							return
						}

						cleanup = result
					})

					return slot
				},
				if: (state, initialiser) => {
					unuse?.()
					state.use(slot, value => {
						if (!value) {
							cleanup?.()
							cleanup = undefined
							slot.removeContents()
							return
						}

						let result = initialiser(slot) || undefined
						if (result === slot)
							result = undefined

						if (Component.is(result)) {
							result.appendTo(slot)
							cleanup = undefined
							return
						}

						cleanup = result
					})

					return slot
				},
			}))
			.event.subscribe("remove", () => cleanup?.())
	}),
	{
		using: <T> (value: T | State<T>, initialiser: (slot: Slot, value: T) => SlotInitialiserReturn) =>
			Slot().use(State.get(value), initialiser),
	}
)

export default Slot
