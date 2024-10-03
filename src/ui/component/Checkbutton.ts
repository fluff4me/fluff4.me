import type { EventsOf } from "ui/Component"
import Component from "ui/Component"
import Button from "ui/component/Button"
import type EventManipulator from "ui/utility/EventManipulator"

interface CheckbuttonEvents extends EventsOf<Button> {
	setChecked (checked: boolean): any
}

interface CheckbuttonExtensions {
	isChecked (): boolean
	setChecked (checked: boolean): this
}

interface Checkbutton extends Button, CheckbuttonExtensions {
	readonly event: EventManipulator<this, CheckbuttonEvents>
}

const Checkbutton = Component.Builder("label", (component): Checkbutton => {

	const input = Component("input")
		.style("checkbutton-input")
		.attributes.set("type", "checkbox")

	const inputElement = input.element as HTMLInputElement

	const checkbutton: Checkbutton = component
		.and(Button)
		.style("checkbutton")
		.attributes.set("tabindex", "0")
		.append(input)
		.extend<CheckbuttonExtensions>({
			isChecked (this: Checkbutton) {
				return inputElement.checked
			},
			setChecked (this: Checkbutton, checked: boolean) {
				inputElement.checked = checked
				return this
			},
		})
		.event.subscribe("click", event => {
			event.preventDefault()
		})

	input.event.subscribe("change", () => {
		checkbutton.style.toggle(inputElement.checked, "checkbutton--checked")
		checkbutton.event.emit("setChecked", inputElement.checked)
	})

	return checkbutton
})

export default Checkbutton
