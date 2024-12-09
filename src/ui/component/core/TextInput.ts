import Component from "ui/Component"
import type { InputExtensions } from "ui/component/core/ext/Input"
import Input from "ui/component/core/ext/Input"
import StringApplicator from "ui/utility/StringApplicator"
import State from "utility/State"

/** 
 * @param text The text to filter
 * @param textBefore The text that appears before this text
 */
type FilterFunction = (text: string, textBefore: string, isFullText: boolean) => string

interface TextInputExtensions {
	readonly state: State<string>
	value: string
	readonly default: StringApplicator.Optional<TextInput>
	readonly placeholder: StringApplicator.Optional<TextInput>
	/**
	 * Makes this `TextInput` not update its state when the internal `<input>` emits the `"input"` event.  
	 * Useful if you want to handle the `"input"` event yourself to set the state to something else.
	 */
	ignoreInputEvent (ignore?: boolean): this
	/**
	 * Prevent the user from entering invalid characters in this input via a filter function.
	 */
	filter (filter?: FilterFunction): this
}

interface TextInput extends Component, TextInputExtensions, InputExtensions { }

const TextInput = Component.Builder("input", (component): TextInput => {

	let shouldIgnoreInputEvent = false
	let filterFunction: FilterFunction | undefined

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
					input.length.value = value?.length ?? 0
				}
			}),
			placeholder: StringApplicator(input, value => {
				input.attributes.set("placeholder", value)
			}),
			ignoreInputEvent: (ignore = true) => {
				shouldIgnoreInputEvent = ignore
				return input
			},
			filter: filter => {
				filterFunction = filter
				return input
			},
		}))
		.extendMagic("value", input => ({
			get: () => (input.element as HTMLInputElement).value || "",
			set: (value: string) => {
				(input.element as HTMLInputElement).value = value
				input.state.value = value
				input.length.value = value.length
			},
		}))

	input.length.value = 0

	input.event.subscribe(["input", "change"], event => {
		const element = input.element.asType("input")
		if (filterFunction && element) {
			if (event.type === "change") {
				input.value = filterFunction(input.value, "", true)
			} else {
				let { selectionStart, selectionEnd, value } = element
				const hasSelection = selectionStart !== null || selectionEnd !== null

				selectionStart ??= value.length
				selectionEnd ??= value.length

				const beforeSelection = filterFunction(value.slice(0, selectionStart), "", false)
				const selection = filterFunction(value.slice(selectionStart, selectionEnd), beforeSelection, false)
				const afterSelection = filterFunction(value.slice(selectionEnd), selection || beforeSelection, false)

				input.value = beforeSelection + selection + afterSelection

				if (hasSelection)
					element.setSelectionRange(beforeSelection.length, beforeSelection.length + selection.length)
			}
		}

		if (shouldIgnoreInputEvent) return
		input.state.value = input.value
		input.length.value = input.value.length
	})

	return input
})

export default TextInput
