import Component from "ui/Component"
import InputBus from "ui/InputBus"
import HoverListener from "ui/utility/HoverListener"
import Mouse from "ui/utility/Mouse"
import type { UnsubscribeState } from "utility/State"
import State from "utility/State"
import Task from "utility/Task"

const FOCUS_TRAP = Component()
	.tabIndex("auto")
	.ariaHidden()
	.style.setProperty("display", "none")
	.prependTo(document.body)

interface PopoverComponentRegisteredExtensions {
	popover: Popover
	tweakPopover (initialiser: (popover: Popover, button: this) => any): this
}

interface PopoverComponentExtensions {
	/** Disallow any popovers to continue showing if this component is hovered */
	clearPopover (): this
	setPopover (event: "hover" | "click", initialiser: (popover: Popover, host: this) => any): this & PopoverComponentRegisteredExtensions
}

Component.extend(component => {
	component.extend<PopoverComponentExtensions>(component => ({
		clearPopover: () => component
			.attributes.set("data-clear-popover", "true"),
		setPopover: (event, initialiser) => {
			let isShown = false

			const popover = Popover()
				.anchor.from(component)
				.setOwner(component)
				.tweak(initialiser, component)
				.event.subscribe("toggle", e => {
					const event = e as ToggleEvent & { component: Popover }
					if (event.newState === "closed") {
						isShown = false
						clickState = false
						Mouse.offMove(updatePopoverState)
					}
				})
				.appendTo(document.body)

			if (event === "hover")
				component.hoveredOrFocused.subscribe(component, updatePopoverState)

			const ariaLabel = component.attributes.getUsing("aria-label") ?? popover.attributes.get("aria-label")
			const ariaRole = popover.attributes.getUsing("role") ?? popover.attributes.get("role")
			component.ariaLabel.use((quilt, { arg }) => quilt["component/popover/button"](arg(ariaLabel), arg(ariaRole)))
			popover.ariaLabel.use((quilt, { arg }) => quilt["component/popover"](arg(ariaLabel)))

			let clickState = false
			component.event.subscribe("click", () => {
				// always subscribe click because we need to handle it for keyboard navigation
				if (!component.focused.value && event !== "click")
					return

				clickState = true
				popover.show()
				popover.focus()
			})

			popover.hasFocused.subscribe(component, hasFocused => {
				if (hasFocused)
					return

				clickState = false
				popover.hide()
				component.focus()
			})

			return component.extend<PopoverComponentRegisteredExtensions>(component => ({
				popover,
				tweakPopover: (initialiser) => {
					initialiser(popover, component)
					return component
				},
			}))

			async function updatePopoverState () {
				const shouldShow = false
					|| component.hoveredOrFocused.value
					|| (true
						&& isShown
						&& (false
							|| popover.rect.value.expand(+popover.attributes.get("data-popover-mouse-padding")! || 100).intersects(Mouse.state.value)
							|| InputBus.isDown("F4")
						)
						&& (popover.element.contains(HoverListener.hovered() ?? null) || !HoverListener.hovered()?.closest("[data-clear-popover]"))
					)
					|| clickState

				if (isShown === shouldShow)
					return

				if (component.hoveredOrFocused.value && !isShown)
					Mouse.onMove(updatePopoverState)

				if (!shouldShow)
					Mouse.offMove(updatePopoverState)

				if (!shouldShow)
					FOCUS_TRAP.style.setProperty("display", "none")

				isShown = shouldShow
				popover.toggle(shouldShow)
				if (!shouldShow)
					return

				FOCUS_TRAP.style.setProperty("display", "inline")
				popover.style.removeProperties("left", "top")
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
	visible: State<boolean>
	show (): this
	hide (): this
	toggle (shown?: boolean): this
	bind (state: State<boolean>): this
	unbind (): this
	/** Sets the distance the mouse can be from the popover before it hides, if it's shown due to hover */
	setMousePadding (padding?: number): this
}

interface Popover extends Component, PopoverExtensions { }

const Popover = Component.Builder((component): Popover => {
	let unbind: UnsubscribeState | undefined
	const popover = component
		.style("popover")
		.tabIndex("programmatic")
		.attributes.add("popover")
		.extend<PopoverExtensions>(popover => ({
			visible: State(false),
			setMousePadding: (padding) =>
				popover.attributes.set("data-popover-mouse-padding", padding === undefined ? undefined : `${padding}`),
			show: () => {
				unbind?.()
				popover.element.togglePopover(true)
				popover.visible.value = true
				return popover
			},
			hide: () => {
				unbind?.()
				popover.element.togglePopover(false)
				popover.visible.value = false
				return popover
			},
			toggle: shown => {
				unbind?.()
				popover.element.togglePopover(shown)
				popover.visible.value = shown ?? !popover.visible.value
				return popover
			},
			bind: state => {
				unbind?.()
				unbind = state.use(popover, shown => {
					popover.element.togglePopover(shown)
					popover.visible.value = shown
				})
				return popover
			},
			unbind: () => {
				unbind?.()
				return popover
			},
		}))

	popover.event.subscribe("toggle", event => {
		popover.visible.value = event.newState === "open"
	})

	return popover
})

export default Popover
