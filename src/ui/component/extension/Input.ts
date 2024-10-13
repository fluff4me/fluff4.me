import Component from "ui/Component"
import type Label from "ui/component/Label"
import State from "utility/State"

export interface InputExtensions {
	readonly required: State<boolean>
	setRequired (required?: boolean): this
	/**
	 * - Sets the `[name]` of this component to `label.for`
	 * - Allows the label to use this component for information like whether it's required, etc
	 */
	setLabel (label?: Label): this
}

interface Input extends Component, InputExtensions { }

const Input = Component.Extension((component): Input => {
	return component.extend<InputExtensions>(component => ({
		required: State(false),
		setRequired: (required = true) => {
			component.attributes.toggle(required, "required")
			component.required.value = required
			return component
		},
		setLabel: label => {
			component.setName(label?.for)
			label?.setInput(component)
			return component
		},
	}))
})

export default Input
