import Component from 'ui/Component'
import type { PopoverComponentRegisteredExtensions } from 'ui/component/core/Popover'
import Popover from 'ui/component/core/Popover'

export type PopoverInitialiser<HOST> = (popover: Popover, host: HOST) => unknown

interface TooltipComponentExtensions {
	setTooltip (initialiser: PopoverInitialiser<this>): this & PopoverComponentRegisteredExtensions
}

declare module 'ui/Component' {
	interface ComponentExtensions extends TooltipComponentExtensions { }
}

const Tooltip = Object.assign(
	Component.Builder((component): Popover => {
		return component.and(Popover)
			.setDelay(300)
			.setMousePadding(0)
			.style('tooltip')
			.anchor.add('aligned left', 'off bottom')
			.anchor.add('aligned left', 'off top')
			.anchor.add('aligned right', 'off bottom')
			.anchor.add('aligned right', 'off top')
	}),
	{
		initExtension () {
			Component.extend(component => {
				component.extend<TooltipComponentExtensions>((component: Component & TooltipComponentExtensions & Partial<PopoverComponentRegisteredExtensions>) => ({
					setTooltip (initialiser) {
						return component.setPopover('hover/longpress', (popover, host) => initialiser(popover.and(Tooltip), host))
					},
				}))
			})
		},
	}
)

export default Tooltip
