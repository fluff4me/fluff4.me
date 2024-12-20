import Component from "ui/Component"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

export type SlotCleanup = () => any

interface SlotExtensions {
	use<T> (state: State<T>, initialiser: (slot: Slot, value: T) => SlotCleanup | Component | void): this
	if (state: State<boolean>, initialiser: (slot: Slot) => SlotCleanup | Component | void): this
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

						const result = initialiser(slot, value) ?? undefined
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

						const result = initialiser(slot) ?? undefined
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
		using: <T> (value: T | State<T>, initialiser: (slot: Slot, value: T) => SlotCleanup | Component | void) =>
			Slot().use(State.get(value), initialiser),
	}
)

export default Slot
