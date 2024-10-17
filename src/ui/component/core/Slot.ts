import Component from "ui/Component"
import type State from "utility/State"

interface SlotExtensions {
	use<T> (state: State<T>, initialiser: (slot: Slot, value: T) => any): this
}

interface Slot extends Component, SlotExtensions { }

const Slot = Component.Builder((slot): Slot => {
	slot.style("slot")

	return slot.extend<SlotExtensions>(slot => ({
		use: (state, initialiser) => {
			state.use(slot, value => {
				slot.removeContents()
				initialiser(slot, value)
			})

			return slot
		},
	}))
})

export default Slot
