import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type { PopoverComponentRegisteredExtensions, PopoverInitialiser } from 'ui/component/core/Popover'

export interface CanHasActionsMenuButtonExtensions {
	readonly actionsMenuButton: Button & PopoverComponentRegisteredExtensions
	setActionsMenu (initialiser: PopoverInitialiser<Button>): this
}

interface CanHasActionsMenuButton extends Component, CanHasActionsMenuButtonExtensions { }

const CanHasActionsMenuButton = Component.Extension((component, inserter?: (button: Button) => unknown): CanHasActionsMenuButton => {
	let actionsMenuPopoverInitialiser: PopoverInitialiser<Button> = () => { }

	return component
		.extend<CanHasActionsMenuButtonExtensions>(component => ({
			actionsMenuButton: undefined!,
			setActionsMenu (initialiser) {
				actionsMenuPopoverInitialiser = initialiser
				component.actionsMenuButton.setPopover('click', (popover, button) => {
					popover.anchor.add('off right', 'aligned top')
					popover.anchor.add('off right', 'aligned bottom')
					initialiser(popover, button)
				})
				return component
			},
		}))
		.extendJIT('actionsMenuButton', component => {
			const button = Button()
				.style('block-actions-menu-button')
				.setIcon('ellipsis-vertical')
				.type('icon')
				.setPopover('click', actionsMenuPopoverInitialiser)
			if (inserter)
				inserter(button)
			else
				button.appendTo(component)
			return button
		})
})

export default CanHasActionsMenuButton
