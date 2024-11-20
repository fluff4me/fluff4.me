import Component from "ui/Component"
import type { InputExtensions } from "ui/component/core/ext/Input"
import Input from "ui/component/core/ext/Input"
import StringApplicator from "ui/utility/StringApplicator"
import State from "utility/State"

interface TextareaExtensions {
	readonly state: State<string>
	value: string
	readonly default: StringApplicator.Optional<Textarea>
	readonly placeholder: StringApplicator.Optional<Textarea>
	/**
	 * Makes this `Textarea` not update its state when the internal `<input>` emits the `"input"` event.  
	 * Useful if you want to handle the `"input"` event yourself to set the state to something else.
	 */
	ignoreInputEvent (ignore?: boolean): this
}

interface Textarea extends Component, TextareaExtensions, InputExtensions { }

const Textarea = Component.Builder((component): Textarea => {

	let shouldIgnoreInputEvent = false

	const input: Textarea = component
		.and(Input)
		.style("text-input", "text-area")
		.attributes.set("contenteditable", "plaintext-only")
		.extend<TextareaExtensions>(input => ({
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
			get: () => input.element.textContent || "",
			set: (value: string) => {
				input.element.textContent = value
				input.state.value = value
			},
		}))

	input.event.subscribe(["input", "change"], event => {
		if (shouldIgnoreInputEvent) return
		input.state.value = input.value
	})

	return input
})

export default Textarea
