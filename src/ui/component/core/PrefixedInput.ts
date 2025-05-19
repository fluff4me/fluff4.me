import Component from 'ui/Component'
import type { InputExtensions } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import type { TextInputExtensions } from 'ui/component/core/TextInput'
import TextInput from 'ui/component/core/TextInput'
import type { Quilt } from 'ui/utility/StringApplicator'

interface PrefixedInputExtensions {
	readonly input: TextInput
}

interface PrefixedInput extends TextInput, PrefixedInputExtensions { }

const PrefixedInput = Component.Builder((component, prefix: Quilt.SimpleKey): PrefixedInput => {
	const input = TextInput()
		.style('prefixed-input-input')
		.appendTo(component)

	return component.and(Input)
		.style('prefixed-input')
		.append(Component()
			.style('prefixed-input-prefix')
			.text.use(prefix))
		.extend<PrefixedInputExtensions & TextInputExtensions & InputExtensions>(component => ({
			// prefixed input
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

export default PrefixedInput
