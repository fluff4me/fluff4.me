import Component from 'ui/Component'
import type { ComponentNameType } from 'ui/utility/StyleManipulator'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

type ButtonType = ComponentNameType<'button-type'>
type ButtonIcon = ComponentNameType<'button-icon'>

interface ButtonTypeManipulator<HOST> {
	(...buttonTypes: ButtonType[]): HOST
	remove (...buttonTypes: ButtonType[]): HOST
}

interface ButtonExtensions {
	readonly textWrapper: Component
	readonly type: ButtonTypeManipulator<this>
	readonly disabled: State.Generator<boolean>
	setDisabled (disabled: boolean, reason: string): this
	bindDisabled (state: State<boolean>, reason: string): this
	unbindDisabled (state: State<boolean>, reason: string): this
	setIcon (icon?: ButtonIcon): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder('button', (button): Button => {
	const disabledReasons = new Set<string>()
	const disabled = State.Generator(() => !!disabledReasons.size)

	let icon: ButtonIcon | undefined
	const unuseDisabledStateMap = new WeakMap<State<boolean>, UnsubscribeState>()
	return button
		.attributes.set('type', 'button')
		.style('button')
		.style.bind(disabled, 'button--disabled')
		.attributes.bind(disabled, 'disabled')
		.extend<ButtonExtensions>(button => ({
			textWrapper: undefined!,
			disabled,
			type: Object.assign(
				(...types: ButtonType[]) => {
					for (const type of types)
						button.style(`button-type-${type}`)
					return button
				},
				{
					remove (...types: ButtonType[]) {
						for (const type of types)
							button.style.remove(`button-type-${type}`)
						return button
					},
				},
			),
			setDisabled (newState, reason) {
				const size = disabledReasons.size
				if (newState)
					disabledReasons.add(reason)
				else
					disabledReasons.delete(reason)

				if (disabledReasons.size !== size)
					disabled.refresh()

				return button
			},
			bindDisabled (state, reason) {
				unuseDisabledStateMap.get(state)?.()
				unuseDisabledStateMap.set(state, state.use(button, newState => button.setDisabled(newState, reason)))
				return button
			},
			unbindDisabled (state, reason) {
				unuseDisabledStateMap.get(state)?.()
				unuseDisabledStateMap.delete(state)
				return button
			},
			setIcon (newIcon) {
				if (icon)
					button.style.remove(`button-icon-${icon}`)

				icon = newIcon
				if (icon)
					button.style(`button-icon-${icon}`)
						.type('icon')
				else
					button.type.remove('icon')

				return button
			},
		}))
		.extendJIT('textWrapper', button => Component()
			.style('button-text')
			.appendTo(button))
})

export default Button
