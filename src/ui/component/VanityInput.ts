import Component from 'ui/Component'
import type { InputExtensions } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import type { TextInputExtensions } from 'ui/component/core/TextInput'
import TextInput, { FilterFunction } from 'ui/component/core/TextInput'

interface VanityInputExtensions {
	readonly input: TextInput
}

interface VanityInput extends TextInput, VanityInputExtensions { }

const VanityInput = Component.Builder((component): VanityInput => {
	const input = TextInput()
		.style('vanity-input-input')
		.filter(FilterVanity)
		.appendTo(component)

	return component.and(Input)
		.style('vanity-input')
		.append(Component()
			.style('vanity-input-prefix')
			.text.set('@'))
		.extend<VanityInputExtensions & TextInputExtensions & InputExtensions>(component => ({
			// vanity input
			input,

			// input
			required: input.required,
			hint: input.hint.rehost(component),
			maxLength: input.maxLength,
			length: input.length,
			invalid: input.invalid,
			hasPopover: input.hasPopover,
			getPopover () {
				return input.getPopover()
			},
			disableDefaultHintPopoverVisibilityHandling () {
				input.disableDefaultHintPopoverVisibilityHandling()
				return component
			},
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
			tweakPopover (initialiser) {
				input.tweakPopover(initialiser as never)
				return component
			},
			setCustomHintPopover (initialiser) {
				input.setCustomHintPopover(initialiser as never)
				return component
			},
			pipeValidity (to) {
				input.pipeValidity(to)
				return component
			},
			setCustomInvalidMessage (message) {
				input.setCustomInvalidMessage(message)
				return component
			},
			refreshValidity () {
				input.refreshValidity()
				return component
			},

			// text input
			state: input.state,
			value: undefined!,
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
			setReadonly () {
				input.setReadonly()
				return component
			},
			setValidityHandler (handler) {
				input.setValidityHandler(handler)
				return component
			},
			wrap () {
				return input.wrap()
			},
		}))
		.extendMagic('value', component => ({
			get () { return input.value },
			set (value: string) { input.value = value },
		}))
})

export default VanityInput

export const FilterVanity = FilterFunction((before: string, selection: string, after: string) => {
	before = filterVanitySegment(before)
	selection = filterVanitySegment(selection)
	after = filterVanitySegment(after)

	if (!before && !after)
		selection = selection.replace(/^-|-$/g, '')
	else {
		if (before.startsWith('-'))
			before = before.slice(1)

		if (before.endsWith('-') && selection.startsWith('-'))
			selection = selection.slice(1)

		if (after.endsWith('-'))
			after = after.slice(0, -1)

		if (selection.endsWith('-') && after.startsWith('-'))
			after = after.slice(1)
	}

	return [before, selection, after] as const
})

function filterVanitySegment (segment: string) {
	return segment.replace(/[\W_-]+/g, '-')
}
