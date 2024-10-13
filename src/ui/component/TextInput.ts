import Component from "ui/Component"
import type { InputExtensions } from "ui/component/extension/Input"
import Input from "ui/component/extension/Input"
import StringApplicator from "ui/utility/StringApplicator"
import State from "utility/State"

interface TextInputExtensions {
	state: State<string>
	value: string
	default: StringApplicator.Optional<TextInput>
	placeholder: StringApplicator.Optional<TextInput>
	ignoreInputEvent (ignore?: boolean): this
}

interface TextInput extends Component, TextInputExtensions, InputExtensions { }

const TextInput = Component.Builder("input", (component): TextInput => {
	let shouldIgnoreInputEvent = false

	const input: TextInput = component
		.and(Input)
		.style("text-input")
		.attributes.set("type", "text")
		.extend<TextInputExtensions>(input => ({
			value: "",
			state: State(""),
			default: StringApplicator(input, value => {
				if (input.value === "") {
					input.value = value ?? ""
					input.state.value = value ?? ""
				}
			}),
			placeholder: StringApplicator(input, value => {
				input.attributes.set("placeholder", value)
			}),
			ignoreInputEvent: (ignore = true) => {
				shouldIgnoreInputEvent = ignore
				return input
			},
		}))
		.extendMagic("value", input => ({
			get: () => (input.element as HTMLInputElement).value || "",
			set: (value: string) => {
				(input.element as HTMLInputElement).value = value
				input.state.value = value
			},
		}))

	input.event.subscribe("input", () => {
		if (shouldIgnoreInputEvent) return
		input.state.value = input.value
	})

	return input
})

export default TextInput
