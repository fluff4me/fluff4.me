import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type { PopoverComponentRegisteredExtensions, PopoverInitialiser } from 'ui/component/core/Popover'

export interface CanHasActionsMenuExtensions {
	setActionsMenu (initialiser: PopoverInitialiser<this>): this
	setActionsMenuButton (inserter?: (button: Button) => unknown): this
}

interface CanHasActionsMenu extends Component, CanHasActionsMenuExtensions { }

const CanHasActionsMenu = Component.Extension((component, initialiser?: PopoverInitialiser<Component>): CanHasActionsMenu => {
	const baseInitialiser = initialiser
	let hasActionsMenu = false
	let actionsMenuButtonInserter: true | ((button: Button) => unknown) | undefined
	return (component as Component & PopoverComponentRegisteredExtensions)
		.extend<CanHasActionsMenuExtensions>(component => ({
			setActionsMenu (initialiser) {
				hasActionsMenu = true

				if (actionsMenuButtonInserter)
					addActionsMenuButton(component)

				component.clearPopover().setPopover('hover', (popover, button) => popover
					.type('flush')
					.style('actions-menu-popover')
					.anchor.add('off right', 'centre')
					.anchor.orElseHide()
					.append(Component().style('actions-menu-popover-arrow'))
					.tweak(baseInitialiser, button)
					.tweak(initialiser, button)
				)

				return component
			},
			setActionsMenuButton (inserter) {
				actionsMenuButtonInserter = inserter ?? true
				if (hasActionsMenu)
					addActionsMenuButton(component)

				return component
			},
		}))

	function addActionsMenuButton (component: Component & PopoverComponentRegisteredExtensions) {
		const button = Button()
			.setIcon('ellipsis-vertical')
			.type('icon')
			.event.subscribe('click', event => {
				event.preventDefault()
				event.stopImmediatePropagation()
				component.showPopover()
			})
		if (typeof actionsMenuButtonInserter === 'function')
			actionsMenuButtonInserter(button)
		else
			button.appendTo(component)
	}
})

export default CanHasActionsMenu
