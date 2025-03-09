import Component from 'ui/Component'
import { HandlesMouseEvents } from 'ui/InputBus'
import BrowserListener from 'ui/utility/BrowserListener'
import FontsListener from 'ui/utility/FontsListener'
import type { ComponentNameType } from 'ui/utility/StyleManipulator'
import type TextManipulator from 'ui/utility/TextManipulator'
import TypeManipulator from 'ui/utility/TypeManipulator'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Type from 'utility/Type'

export type ButtonType = ComponentNameType<'button-type'>
export type ButtonIcon = ComponentNameType<'button-icon'>

export interface ButtonExtensions {
	readonly textWrapper: Component
	readonly subTextWrapper: Component
	readonly type: TypeManipulator<this, ButtonType>
	readonly disabled: State.Generator<boolean>
	readonly subText: TextManipulator<this>
	icon?: Component
	setDisabled (disabled: boolean, reason: string): this
	bindDisabled (state: State<string>): this
	bindDisabled (state: State<boolean>, reason: string): this
	unbindDisabled (state: State<string>): this
	unbindDisabled (state: State<boolean>, reason: string): this
	setIcon (icon?: ButtonIcon): this
	bindIcon (state: State<ButtonIcon | undefined>): this
}

interface Button extends Component, ButtonExtensions { }

const Button = Component.Builder('button', (component): Button => {
	const disabledReasons = new Set<string>()
	const disabled = State.Generator(() => !!disabledReasons.size)

	const hasSubtext = State(false)

	let icon: ButtonIcon | undefined
	const unuseDisabledStateMap = new WeakMap<State<boolean | string>, UnsubscribeState>()
	let unuseIconState: UnsubscribeState | undefined
	const button = component
		.and(HandlesMouseEvents)
		.attributes.set('type', 'button')
		.style('button')
		.style.bind(BrowserListener.isWebkit, 'button--webkit')
		.style.bind(disabled, 'button--disabled')
		.style.bind(hasSubtext, 'button--has-subtext')
		.attributes.bind(disabled, 'disabled')
		.extend<ButtonExtensions>(button => ({
			textWrapper: undefined!,
			subTextWrapper: undefined!,
			subText: undefined!,
			disabled,
			type: TypeManipulator.Style(button, type => `button-type-${type}`),
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
			bindDisabled (state, reason?: string) {
				unuseDisabledStateMap.get(state)?.()
				unuseDisabledStateMap.set(state, state.use(button, (newState, oldState) => {
					if (typeof newState === 'string')
						button.setDisabled(!!newState, newState || oldState as string)
					else
						button.setDisabled(!!newState, reason ?? '')
				}))
				return button
			},
			unbindDisabled (state, reason?: string) {
				unuseDisabledStateMap.get(state)?.()
				unuseDisabledStateMap.delete(state)
				button.setDisabled(false, reason ?? Type.as('string', state.value) ?? '')
				return button
			},
			setIcon (newIcon) {
				unuseIconState?.()
				setIcon(newIcon)
				return button
			},
			bindIcon (state) {
				unuseIconState?.()
				unuseIconState = state.use(button, setIcon)
				return button
			},
		}))
		.extendJIT('textWrapper', button => Component()
			.style('button-text')
			.appendTo(button))
		.extendJIT('text', button => button.textWrapper.text.rehost(button))
		.extendJIT('subTextWrapper', button => {
			hasSubtext.value = true
			return Component()
				.style('button-subtext')
				.appendTo(button)
		})
		.extendJIT('subText', button => button.subTextWrapper.text.rehost(button))

	return button

	function setIcon (newIcon?: ButtonIcon) {
		if (!newIcon) {
			button.icon?.remove()
			delete button.icon
			return
		}

		button.icon ??= Component()
			.style('button-icon')
			.style.bind(hasSubtext, 'button-icon--has-subtext')
			.style.bind(FontsListener.loaded.not, 'button-icon--no-icon')
			.prependTo(button)

		button.icon.style.bind(button.type.state.map(button.icon, types => types.has('icon')), 'button-icon--type-icon')

		if (icon)
			button.icon.style.remove(`button-icon-${icon}`)

		icon = newIcon
		if (icon)
			button.icon.style(`button-icon-${icon}`)
	}
})

export default Button
