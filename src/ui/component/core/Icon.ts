import Component from 'ui/Component'
import type { ButtonIcon } from 'ui/component/core/Button'

interface IconExtensions {
	setIcon (icon: ButtonIcon): this
}

interface Icon extends Component, IconExtensions { }

const Icon = Component.Builder((component, icon: ButtonIcon): Icon => {
	return component
		.style('button-icon', `button-icon-${icon}`, 'button-icon--inline')
		.extend<IconExtensions>(component => ({
			setIcon (newIcon) {
				component.style.remove(`button-icon-${icon}`)
				component.style(`button-icon-${newIcon}`)
				return component
			},
		}))
})

export default Icon
