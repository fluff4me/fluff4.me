import Component from "ui/Component"

interface SlotExtensions {
}

interface Slot extends Component, SlotExtensions { }

const Slot = Component.Builder(slot => {
	slot.style("slot")
	return slot
})

export default Slot
