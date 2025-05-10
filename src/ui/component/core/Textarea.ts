import Component from 'ui/Component'
import type { InputExtensions, InvalidMessageText } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import { FilterFunction } from 'ui/component/core/TextInput'
import StringApplicator from 'ui/utility/StringApplicator'
import State from 'utility/State'

interface TextareaExtensions {
	readonly state: State<string>
	readonly touched: State<boolean>
	value: string
	readonly default: StringApplicator.Optional<Textarea>
	readonly placeholder: StringApplicator.Optional<Textarea>
	/**
	 * Makes this `Textarea` not update its state when the internal `<input>` emits the `"input"` event.  
	 * Useful if you want to handle the `"input"` event yourself to set the state to something else.
	 */
	ignoreInputEvent (ignore?: boolean): this
	/**
	 * Prevent the user from entering invalid characters in this input via a filter function.
	 */
	filter (filterFn?: FilterFunction): this
}

interface Textarea extends Component, TextareaExtensions, InputExtensions { }

const Textarea = Component.Builder((component): Textarea => {
	let shouldIgnoreInputEvent = false
	let filterFunction: FilterFunction | undefined
	let hasChanged = false

	const contenteditable = Component()
		.style('text-input', 'text-area')
		.attributes.set('contenteditable', 'plaintext-only')
		.ariaRole('textbox')
		.attributes.set('aria-multiline', 'true')
		.event.subscribe('blur', () => {
			if (hasChanged)
				contenteditable.event.emit('change')
		})
		.event.subscribe('keydown', event => {
			if (event.key === 'Enter') {
				event.stopPropagation()
				const selection = window.getSelection()
				if (!selection)
					return

				if (!contenteditable.element.contains(selection.anchorNode) || !contenteditable.element.contains(selection.focusNode))
					return

				const secondNewlineNode = document.createTextNode('\n')
				selection.getRangeAt(0).replaceContents(document.createTextNode('\n'), secondNewlineNode)
				selection.empty()
				selection.collapse(secondNewlineNode)
				contenteditable.event.emit('input')
			}
		})

	const hiddenInput = Component('input')
		.style('text-area-validity-pipe-input')
		.tabIndex('programmatic')
		.attributes.set('type', 'text')
		.setName(`text-area-validity-pipe-input-${Math.random().toString(36).slice(2)}`)

	const state = State('')
	const touched = State(false)

	const input: Textarea = component
		.and(Input)
		.style('text-area-wrapper')
		.pipeValidity(hiddenInput)
		.append(contenteditable, hiddenInput)
		.extend<TextareaExtensions & Partial<InputExtensions>>(input => ({
			value: '',
			touched,
			state,
			default: StringApplicator(input, value => {
				if (input.value === '') {
					input.value = value ?? ''
					state.value = value ?? ''
					input.length.asMutable?.setValue(value?.length ?? 0)
					touched.value = true
					updateValidity()
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
			filter: filter => {
				filterFunction = filter
				return input
			},
		}))
		.extendMagic('value', input => ({
			get: () => contenteditable.element.textContent || '',
			set: (value: string) => {
				contenteditable.element.textContent = value
				applyFilter('change')
				state.value = value
				input.length.asMutable?.setValue(value.length)
				updateValidity()
			},
		}))

	input.length.asMutable?.setValue(0)

	input.onRooted(input => {
		updateValidity()
		contenteditable.event.subscribe(['input', 'change'], event => {
			applyFilter(event.type as 'input' | 'change')

			if (shouldIgnoreInputEvent) return

			state.value = input.value.trim()
			input.length.asMutable?.setValue(input.value.trim().length)
			touched.value = true
			updateValidity()
		})
	})

	return input

	function updateValidity () {
		let invalid: InvalidMessageText
		if ((input.length.value ?? 0) > (input.maxLength.value ?? Infinity))
			invalid = quilt => quilt['shared/form/invalid/too-long']()

		if (!input.length.value && input.required.value)
			invalid = quilt => quilt['shared/form/invalid/required']()

		input.setCustomInvalidMessage(invalid)
	}

	function getSelection () {
		const selection = window.getSelection()
		if (!selection?.anchorNode && !selection?.focusNode)
			return null

		const containsAnchor = contenteditable.element.contains(selection.anchorNode)
		const selectionStart = containsAnchor ? selection.anchorOffset + getLengthBefore(selection.anchorNode) : 0
		if (selection.isCollapsed && containsAnchor)
			return { selectionStart, selectionEnd: selectionStart }

		const containsFocus = contenteditable.element.contains(selection.focusNode)
		const selectionEnd = containsFocus ? selection.focusOffset + getLengthBefore(selection.focusNode) : contenteditable.element.textContent?.length ?? 0

		return { selectionStart, selectionEnd }
	}

	function getLengthBefore (node: Node | null) {
		if (!node)
			return 0

		let length = 0
		while ((node = node.previousSibling))
			length += node.textContent?.length ?? 0
		return length
	}

	function applyFilter (type: 'input' | 'change') {
		const element = contenteditable.element
		if (!element)
			return

		const filter = filterFunction ?? FilterFunction.DEFAULT

		const value = input.value
		if (type === 'change') {
			element.textContent = filter(value.trim(), '', '').join('').trim()
			return
		}

		hasChanged = true

		let { selectionStart = null, selectionEnd = null } = getSelection() ?? {}
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

		element.textContent = beforeSelection + inSelection + afterSelection + '\n'

		if (hasSelection) {
			const textNode = element.childNodes[0]
			if (textNode) {
				const selection = window.getSelection()
				selection?.empty()
				const range = document.createRange()
				range.setStart(textNode, beforeSelection.length)
				range.setEnd(textNode, beforeSelection.length + inSelection.length)
				selection?.addRange(range)
			}
		}
	}
})

export default Textarea
