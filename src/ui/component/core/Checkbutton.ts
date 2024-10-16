import type { EventsOf } from "ui/Component"
import Component from "ui/Component"
import Button from "ui/component/core/Button"
import type EventManipulator from "ui/utility/EventManipulator"
import State from "utility/State"

interface CheckbuttonEvents extends EventsOf<Button> {
	setChecked (checked: boolean): any
}

interface CheckbuttonExtensions {
	readonly checked: State<boolean>
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

	const state = State<boolean>(false)

	const checkbutton: Checkbutton = component
		.and(Button)
		.style("checkbutton")
		.tabIndex("auto")
		.ariaChecked(state)
		.ariaRole("checkbox")
		.append(input)
		.extend<CheckbuttonExtensions>(checkbutton => ({
			checked: state,
			isChecked: () => inputElement.checked,
			setChecked: (checked: boolean) => {
				inputElement.checked = checked
				onChange()
				return checkbutton
			},
		}))
		.event.subscribe("click", event => {
			event.preventDefault()
		})

	input.event.subscribe("change", onChange)

	function onChange () {
		state.value = inputElement.checked
		checkbutton.style.toggle(inputElement.checked, "checkbutton--checked")
		checkbutton.event.emit("setChecked", inputElement.checked)
	}

	return checkbutton
})

export default Checkbutton
