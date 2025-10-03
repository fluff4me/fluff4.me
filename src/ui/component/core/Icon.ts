import Component from 'ui/Component'
import type { ButtonIcon } from 'ui/component/core/Button'
import State from 'utility/State'

interface IconExtensions {
	setIcon (icon: State.Or<ButtonIcon>): this
}

interface Icon extends Component, IconExtensions { }

const Icon = Component.Builder((component, icon: State.Or<ButtonIcon>): Icon => {
	const iconState = State<ButtonIcon>(State.value(icon))
	setIcon(icon)
	return component
		.style('button-icon', 'button-icon--inline')
		.style.bindFrom(iconState.map(component, icon => [`button-icon-${icon}`]))
		.extend<IconExtensions>(component => ({
			setIcon (newIcon) {
				setIcon(newIcon)
				return component
			},
		}))

	function setIcon (newIcon: State.Or<ButtonIcon>) {
		if (State.is(newIcon))
			iconState.bind(component, newIcon)
		else
			iconState.value = newIcon
	}
})

export default Icon
