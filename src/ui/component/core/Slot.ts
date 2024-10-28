import Component from "ui/Component"
import type State from "utility/State"

export type SlotCleanup = () => any

interface SlotExtensions {
	use<T> (state: State<T>, initialiser: (slot: Slot, value: T) => SlotCleanup | void): this
}

interface Slot extends Component, SlotExtensions { }

const Slot = Component.Builder((slot): Slot => {
	slot.style("slot")

	let cleanup: SlotCleanup | undefined
	return slot
		.extend<SlotExtensions>(slot => ({
			use: (state, initialiser) => {
				state.use(slot, value => {
					cleanup?.()
					slot.removeContents()
					cleanup = initialiser(slot, value) ?? undefined
				})

				return slot
			},
		}))
		.event.subscribe("remove", () => cleanup?.())
})

export default Slot
