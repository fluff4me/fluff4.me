import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Input from 'ui/component/core/ext/Input'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

export interface CheckbuttonExtensions {
	readonly input: Component
	readonly checked: State<boolean>
	isChecked (): boolean
	setChecked (checked: boolean): this
	use (state: State<boolean>): this
	unuse (): this
}

const SYMBOL_CHECK_BUTTON_BRAND = Symbol('CheckButton')
interface CheckbuttonFullExtensions extends CheckbuttonExtensions {
	readonly [SYMBOL_CHECK_BUTTON_BRAND]: true
}

interface Checkbutton extends Button, Input, CheckbuttonFullExtensions {
	readonly event: EventManipulator<this, Events<Button, {
		SetChecked (checked: boolean): any
		TrySetChecked (checked: boolean): any
	}>>
}

const Checkbutton = Component.Builder('label', (component): Checkbutton => {
	const input = Component('input')
		.style('checkbutton-input')
		.attributes.set('type', 'checkbox')
		.setRandomId()

	const inputElement = input.element

	const state = State<boolean>(false)

	let unuse: UnsubscribeState | undefined
	const checkbutton: Checkbutton = component
		.and(Button)
		.and(Input)
		.style('checkbutton')
		.tabIndex('auto')
		.ariaChecked(state)
		.ariaRole('checkbox')
		.setIcon('check')
		.attributes.bind('for', input.id)
		.tweak(button => button.icon
			?.style('checkbutton-icon')
			.style.bind(state, 'checkbutton-icon--checked'))
		.append(input)
		.extend<CheckbuttonFullExtensions>(() => ({
			[SYMBOL_CHECK_BUTTON_BRAND]: true,
			input,
			checked: state,
			isChecked: () => inputElement.checked,
			setChecked: (checked: boolean) => {
				if (checked === inputElement.checked)
					return checkbutton

				if (unuse) {
					checkbutton.event.emit('TrySetChecked', checked)
					return checkbutton
				}

				inputElement.checked = checked
				onChange()
				return checkbutton
			},
			use: sourceState => {
				unuse?.()
				unuse = sourceState.use(checkbutton, checked => {
					if (inputElement.checked === checked)
						return

					inputElement.checked = checked
					onChange()
				})
				return checkbutton
			},
			unuse: () => {
				unuse?.()
				unuse = undefined
				return checkbutton
			},
		}))

	checkbutton.pipeValidity(input)

	input.event.subscribe('change', () => {
		if (unuse) {
			const checked = inputElement.checked
			inputElement.checked = !checked // undo because it's managed by a State.Mutable<boolean>
			checkbutton.event.emit('TrySetChecked', checked)
			return
		}

		onChange()
	})

	function onChange () {
		state.value = inputElement.checked
		checkbutton.style.toggle(inputElement.checked, 'checkbutton--checked')
		checkbutton.event.emit('SetChecked', inputElement.checked)
	}

	return checkbutton
})

export default Checkbutton
