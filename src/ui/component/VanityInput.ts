import Component from "ui/Component"
import type { InputExtensions } from "ui/component/core/ext/Input"
import Input from "ui/component/core/ext/Input"
import type { PopoverInitialiser } from "ui/component/core/Popover"
import type { TextInputExtensions } from "ui/component/core/TextInput"
import TextInput from "ui/component/core/TextInput"

interface VanityInputExtensions {
	readonly input: TextInput
}

interface VanityInput extends TextInput, VanityInputExtensions { }

const VanityInput = Object.assign(
	Component.Builder((component): VanityInput => {
		const input = TextInput()
			.style("vanity-input-input")
			.filter(filterVanity)
			.appendTo(component)

		return component.and(Input)
			.style("vanity-input")
			.append(Component()
				.style("vanity-input-prefix")
				.text.set("@"))
			.extend<VanityInputExtensions & TextInputExtensions & InputExtensions>(component => ({
				// vanity input
				input,

				// input
				required: input.required,
				hint: input.hint.rehost(component),
				maxLength: input.maxLength,
				length: input.length,
				setMaxLength (maxLength?: number) {
					input.setMaxLength(maxLength)
					return component
				},
				setRequired (required?: boolean) {
					input.setRequired(required)
					return component
				},
				setLabel (label) {
					input.setLabel(label)
					return component
				},
				tweakPopover (initialiser: PopoverInitialiser<typeof component>) {
					input.tweakPopover(initialiser as never)
					return component
				},

				// text input
				state: input.state,
				get value () { return input.value },
				set value (value: string) { input.value = value },
				default: input.default.rehost(component),
				placeholder: input.placeholder.rehost(component),
				ignoreInputEvent (ignore = true) {
					input.ignoreInputEvent(ignore)
					return component
				},
				filter (filter) {
					input.filter(filter)
					return component
				},
			}))
	}),
	{
		filter: filterVanity,
	}
)

export default VanityInput

function filterVanity (vanity: string, textBefore = "", isFullText = true) {
	vanity = vanity.replace(/[\W_]+/g, "-")
	if (isFullText)
		vanity = vanity.replace(/^-|-$/g, "")

	if (textBefore.endsWith("-") && vanity.startsWith("-"))
		return vanity.slice(1)

	return vanity
}
