import quilt from 'lang/en-nz'
import Component from 'ui/Component'
import type { InputExtensions, InvalidMessageText } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import StringApplicator from 'ui/utility/StringApplicator'
import State from 'utility/State'

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

	const contenteditable = Component()
		.style('text-input', 'text-area')
		.attributes.set('contenteditable', 'plaintext-only')
		.ariaRole('textbox')
		.attributes.set('aria-multiline', 'true')

	const hiddenInput = Component('input')
		.style('text-area-validity-pipe-input')
		.tabIndex('programmatic')
		.attributes.set('type', 'text')
		.setName(`text-area-validity-pipe-input-${Math.random().toString(36).slice(2)}`)

	const state = State('')

	const input: Textarea = component
		.and(Input)
		.style('text-area-wrapper')
		.pipeValidity(hiddenInput)
		.append(contenteditable, hiddenInput)
		.extend<TextareaExtensions & Partial<InputExtensions>>(input => ({
			value: '',
			state,
			default: StringApplicator(input, value => {
				if (input.value === '') {
					input.value = value ?? ''
					state.value = value ?? ''
					input.length.asMutable?.setValue(value?.length ?? 0)
				}
			}),
			placeholder: StringApplicator(input, value => {
				contenteditable.attributes.set('placeholder', value)
			}),
			ignoreInputEvent: (ignore = true) => {
				shouldIgnoreInputEvent = ignore
				return input
			},
			setLabel (label) {
				contenteditable.setName(label?.for)
				contenteditable.setId(label?.for)
				label?.setInput(input)
				contenteditable.ariaLabelledBy(label)
				return input
			},
		}))
		.extendMagic('value', input => ({
			get: () => contenteditable.element.textContent || '',
			set: (value: string) => {
				contenteditable.element.textContent = value
				state.value = value
				input.length.asMutable?.setValue(value.length)
			},
		}))

	input.length.asMutable?.setValue(0)

	input.onRooted(input => {
		contenteditable.event.subscribe(['input', 'change'], event => {
			if (shouldIgnoreInputEvent) return
			state.value = input.value
			input.length.asMutable?.setValue(input.value.length)

			let invalid: InvalidMessageText
			if ((input.length.value ?? 0) > (input.maxLength.value ?? Infinity))
				invalid = quilt['shared/form/invalid/too-long']()

			if (!input.length.value && input.required.value)
				invalid = quilt['shared/form/invalid/required']()

			input.setCustomInvalidMessage(invalid)
		})
	})

	return input
})

export default Textarea
