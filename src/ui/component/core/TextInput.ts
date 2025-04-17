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

export namespace FilterFunction {
	export const DEFAULT = FilterFunction((...segments) => segments)
}

export type TextInputValidityHandler = (input: TextInput) => InvalidMessageText | undefined

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
	setValidityHandler (handler: TextInputValidityHandler): this
	setReadonly (): this
}

interface TextInput extends Component, TextInputExtensions, InputExtensions { }

const TextInput = Component.Builder('input', (component): TextInput => {
	let shouldIgnoreInputEvent = false
	let filterFunction: FilterFunction | undefined
	let validityHandler: TextInputValidityHandler | undefined

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
					value = (value ?? '').trim()
					input.value = value
					state.value = value
					input.length.asMutable?.setValue(value.length)
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
			setReadonly () {
				input.attributes.append('readonly')
				return input
			},
			setValidityHandler (handler) {
				validityHandler = handler
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
		state.value = input.value.trim()
		input.length.asMutable?.setValue(input.value.trim().length)
		updateValidity()
	})

	return input

	function updateValidity () {
		let invalid: InvalidMessageText
		if ((input.length.value ?? 0) > (input.maxLength.value ?? Infinity))
			invalid = quilt['shared/form/invalid/too-long']()

		invalid ??= validityHandler?.(input)

		input.setCustomInvalidMessage(invalid)
	}

	function applyFilter (type: 'input' | 'change') {
		const element = input.element.asType('input')
		if (!element)
			return

		const filter = filterFunction ?? FilterFunction.DEFAULT

		if (type === 'change') {
			element.value = filter(input.value.trim(), '', '').join('').trim()
			return
		}

		let { selectionStart, selectionEnd, value } = element
		const hasSelection = selectionStart !== null || selectionEnd !== null

		selectionStart ??= value.length
		selectionEnd ??= value.length

		const beforeSelectionRaw = value.slice(0, selectionStart).trimStart()
		let afterSelectionRaw = value.slice(selectionEnd).trimEnd()
		let inSelectionRaw = value.slice(selectionStart, selectionEnd)
		if (!beforeSelectionRaw.length)
			inSelectionRaw = inSelectionRaw.trimStart()
		if (!afterSelectionRaw.length)
			inSelectionRaw = inSelectionRaw.trimEnd()
		if (!inSelectionRaw.length && !beforeSelectionRaw.length)
			afterSelectionRaw = afterSelectionRaw.trimStart()

		const [beforeSelection, inSelection, afterSelection] = filter(beforeSelectionRaw, inSelectionRaw, afterSelectionRaw)

		element.value = beforeSelection + inSelection + afterSelection

		if (hasSelection)
			element.setSelectionRange(beforeSelection.length, beforeSelection.length + inSelection.length)
	}
})

export default TextInput
