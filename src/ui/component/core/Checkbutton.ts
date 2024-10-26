import type { EventsOf } from "ui/Component"
import Component from "ui/Component"
import Button from "ui/component/core/Button"
import type EventManipulator from "ui/utility/EventManipulator"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"

interface CheckbuttonEvents extends EventsOf<Button> {
	setChecked (checked: boolean): any
	trySetChecked (checked: boolean): any
}

interface CheckbuttonExtensions {
	readonly input: Component
	readonly checked: State<boolean>
	isChecked (): boolean
	setChecked (checked: boolean): this
	use (state: State<boolean>): this
	unuse (): this
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

	let unuse: UnsubscribeState | undefined
	const checkbutton: Checkbutton = component
		.and(Button)
		.style("checkbutton")
		.tabIndex("auto")
		.ariaChecked(state)
		.ariaRole("checkbox")
		.append(input)
		.extend<CheckbuttonExtensions>(() => ({
			input,
			checked: state,
			isChecked: () => inputElement.checked,
			setChecked: (checked: boolean) => {
				if (checked === inputElement.checked)
					return checkbutton

				if (unuse) {
					checkbutton.event.emit("trySetChecked", checked)
					return checkbutton
				}

				inputElement.checked = checked
				onChange()
				return checkbutton
			},
			use: (sourceState) => {
				unuse = sourceState.use(checkbutton, checked => {
					if (inputElement.checked === checked)
						return

					inputElement.checked = checked
					onChange()
				})
				return checkbutton
			},
			unuse: () => {
				unuse?.()
				unuse = undefined
				return checkbutton
			},
		}))

	input.event.subscribe("change", () => {
		if (unuse) {
			const checked = inputElement.checked
			inputElement.checked = !checked // undo because it's managed by a State<boolean>
			checkbutton.event.emit("trySetChecked", checked)
			return
		}

		onChange()
	})

	function onChange () {
		state.value = inputElement.checked
		checkbutton.style.toggle(inputElement.checked, "checkbutton--checked")
		checkbutton.event.emit("setChecked", inputElement.checked)
	}

	return checkbutton
})

export default Checkbutton
