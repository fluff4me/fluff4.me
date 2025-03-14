import quilt from 'lang/en-nz'
import Component from 'ui/Component'
import type { InputExtensions, InvalidMessageText } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import StringApplicator from 'ui/utility/StringApplicator'
import State from 'utility/State'

export type FilterFunction = (before: string, selected: string, after: string) => readonly [string, string, string]
export interface FilterFunctionFull {
	(before: string, selected: string, after: string): readonly [string, string, string]
	(text: string): string
}
export function FilterFunction (fn: FilterFunction): FilterFunctionFull {
	return (
		(before, selected, after) => selected === undefined
			? fn('', before, '').join('')
			: fn(before, selected, after)
	) as FilterFunctionFull
}

export interface TextInputExtensions {
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
	filter (filterFn?: FilterFunction): this
}

interface TextInput extends Component, TextInputExtensions, InputExtensions { }

const TextInput = Component.Builder('input', (component): TextInput => {
	let shouldIgnoreInputEvent = false
	let filterFunction: FilterFunction | undefined

	const state = State('')

	const input: TextInput = component
		.and(Input)
		.style('text-input')
		.attributes.set('type', 'text')
		.extend<TextInputExtensions>(input => ({
			value: '',
			state,
			default: StringApplicator(input, value => {
				if (input.value === '') {
					input.value = value ?? ''
					state.value = value ?? ''
					input.length.asMutable?.setValue(value?.length ?? 0)
					updateValidity()
				}
			}),
			placeholder: StringApplicator(input, value => {
				input.attributes.set('placeholder', value)
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
		.extendMagic('value', input => ({
			get: () => (input.element as HTMLInputElement).value || '',
			set: (value: string) => {
				const element = input.element as HTMLInputElement
				element.value = value
				applyFilter('change')
				state.value = element.value
				input.length.asMutable?.setValue(element.value.length)
				updateValidity()
			},
		}))

	input.length.asMutable?.setValue(0)

	updateValidity()
	input.event.subscribe(['input', 'change'], event => {
		applyFilter(event.type as 'input' | 'change')

		if (shouldIgnoreInputEvent) return
		state.value = input.value
		input.length.asMutable?.setValue(input.value.length)
		updateValidity()
	})

	return input

	function updateValidity () {
		let invalid: InvalidMessageText
		if ((input.length.value ?? 0) > (input.maxLength.value ?? Infinity))
			invalid = quilt['shared/form/invalid/too-long']()

		input.setCustomInvalidMessage(invalid)
	}

	function applyFilter (type: 'input' | 'change') {
		const element = input.element.asType('input')
		if (filterFunction && element) {
			if (type === 'change') {
				element.value = filterFunction('', input.value, '').join('')
			}
			else {
				let { selectionStart, selectionEnd, value } = element
				const hasSelection = selectionStart !== null || selectionEnd !== null

				selectionStart ??= value.length
				selectionEnd ??= value.length

				const [beforeSelection, selection, afterSelection]
					= filterFunction(value.slice(0, selectionStart), value.slice(selectionStart, selectionEnd), value.slice(selectionEnd))

				element.value = beforeSelection + selection + afterSelection

				if (hasSelection)
					element.setSelectionRange(beforeSelection.length, beforeSelection.length + selection.length)
			}
		}
	}
})

export default TextInput
