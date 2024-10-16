import Component from "ui/Component"
import Mouse from "ui/utility/Mouse"
import type State from "utility/State"
import type { UnsubscribeState } from "utility/State"
import Task from "utility/Task"

interface PopoverComponentExtensions {
	popover (event: "hover" | "click", initialiser: (popover: Popover) => any): this
}

Component.extend(component => {
	component.extend<PopoverComponentExtensions>(component => ({
		popover: (event, initialiser) => {
			let isShown = false

			const popover = Popover()
				.anchor.from(component)
				.setOwner(component)
				.tweak(initialiser)
				.event.subscribe("toggle", e => {
					const event = e as ToggleEvent & { component: Popover }
					if (event.newState === "closed") {
						isShown = false
						clickState = false
						Mouse.offMove(updatePopoverState)
					}
				})
				.appendTo(document.body)

			switch (event) {
				case "hover":
					component.hoveredOrFocused.subscribe(component, updatePopoverState)
					break
			}

			let clickState = false
			component.event.subscribe("click", () => {
				clickState = !clickState
				void updatePopoverState()
			})

			return component

			async function updatePopoverState () {
				const shouldShow = false
					|| component.hoveredOrFocused.value
					|| (isShown && popover.rect.value.expand(100).intersects(Mouse.state.value))
					|| clickState

				if (component.hoveredOrFocused.value && !isShown)
					Mouse.onMove(updatePopoverState)

				if (!shouldShow)
					Mouse.offMove(updatePopoverState)

				isShown = shouldShow
				popover.toggle(shouldShow)
				if (!shouldShow)
					return

				await Task.yield()
				popover.anchor.apply()
			}
		},
	}))
})

declare module "ui/Component" {
	interface ComponentExtensions extends PopoverComponentExtensions { }
}

interface PopoverExtensions {
	show (): this
	hide (): this
	toggle (shown?: boolean): this
	bind (state: State<boolean>): this
	unbind (): this
}

interface Popover extends Component, PopoverExtensions { }

const Popover = Component.Builder((popover): Popover => {
	let unbind: UnsubscribeState | undefined
	return popover
		.style("popover")
		.attributes.add("popover")
		.extend<PopoverExtensions>(popover => ({
			show: () => {
				unbind?.()
				popover.element.togglePopover(true)
				return popover
			},
			hide: () => {
				unbind?.()
				popover.element.togglePopover(false)
				return popover
			},
			toggle: shown => {
				unbind?.()
				popover.element.togglePopover(shown)
				return popover
			},
			bind: state => {
				unbind?.()
				unbind = state.use(popover, shown => popover.element.togglePopover(shown))
				return popover
			},
			unbind: () => {
				unbind?.()
				return popover
			},
		}))
})

export default Popover
