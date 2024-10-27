import Component from "ui/Component"
import type { IInputEvent } from "ui/InputBus"
import InputBus from "ui/InputBus"
import FocusListener from "ui/utility/FocusListener"
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

			popover.popoverHasFocus.subscribe(component, hasFocused => {
				if (hasFocused)
					return

				clickState = false
				popover.hide()
				component.focus()
			})

			component.receiveAncestorInsertEvents()
			component.event.subscribe(["insert", "ancestorInsert"], updatePopoverParent)

			return component.extend<PopoverComponentRegisteredExtensions>(component => ({
				popover,
				popoverDescendants: [],
				tweakPopover: (initialiser) => {
					initialiser(popover, component)
					return component
				},
			}))

			function updatePopoverParent () {
				const oldParent = popover.popoverParent.value
				popover.popoverParent.value = component.closest(Popover)
				if (oldParent && oldParent !== popover.popoverParent.value)
					oldParent.popoverChildren.value = oldParent.popoverChildren.value.filter(c => c !== popover)

				if (popover.popoverParent.value && popover.popoverParent.value !== oldParent)
					popover.popoverParent.value.popoverChildren.value = [...popover.popoverParent.value.popoverChildren.value, popover]
			}

			async function updatePopoverState () {
				const shouldShow = false
					|| component.hoveredOrFocused.value
					|| (true
						&& isShown
						&& (false
							|| (popover.isMouseWithin(true) && !shouldClearPopover())
							|| InputBus.isDown("F4"))
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

			function shouldClearPopover () {
				const hovered = HoverListener.hovered() ?? null
				if (component.element.contains(hovered) || popover.element.contains(hovered))
					return false

				const clearsPopover = hovered?.closest("[data-clear-popover]")
				if (!clearsPopover)
					return false

				const clearsPopoverWithinPopover = clearsPopover.component?.closest(Popover)
				if (popover.containsPopoverDescendant(clearsPopoverWithinPopover))
					return false

				return true
			}
		},
	}))
})

declare module "ui/Component" {
	interface ComponentExtensions extends PopoverComponentExtensions { }
}

interface PopoverExtensions {
	visible: State<boolean>
	popoverChildren: State<readonly Popover[]>
	popoverParent: State<Popover | undefined>
	popoverHasFocus: State<boolean>

	/** Sets the distance the mouse can be from the popover before it hides, if it's shown due to hover */
	setMousePadding (padding?: number): this

	isMouseWithin (checkDescendants?: true): boolean
	containsPopoverDescendant (node?: Node | Component): boolean

	show (): this
	hide (): this
	toggle (shown?: boolean): this
	bind (state: State<boolean>): this
	unbind (): this
}

interface Popover extends Component, PopoverExtensions { }

const Popover = Component.Builder((component): Popover => {
	let mousePadding: number | undefined
	let unbind: UnsubscribeState | undefined
	const popover = component
		.style("popover")
		.tabIndex("programmatic")
		.attributes.set("popover", "manual")
		.extend<PopoverExtensions>(popover => ({
			visible: State(false),
			popoverChildren: State([]),
			popoverParent: State(undefined),
			popoverHasFocus: FocusListener.focused.map(popover, containsPopoverDescendant),

			setMousePadding: (padding) => {
				mousePadding = padding
				return popover
			},

			isMouseWithin: (checkDescendants: boolean = false) => {
				if (popover.rect.value.expand(mousePadding ?? 100).intersects(Mouse.state.value))
					return true

				if (checkDescendants)
					for (const child of popover.popoverChildren.value)
						if (child.isMouseWithin(true))
							return true

				return false
			},
			containsPopoverDescendant,

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

	InputBus.subscribe("down", onInputDown)
	component.event.subscribe("remove", () => InputBus.unsubscribe("down", onInputDown))

	return popover

	function onInputDown (event: IInputEvent) {
		if (!popover.visible.value)
			return

		if (!event.key.startsWith("Mouse") || popover.containsPopoverDescendant(HoverListener.hovered()))
			return

		popover.element.togglePopover(false)
		popover.visible.value = false
	}

	function containsPopoverDescendant (descendant?: Node | Component) {
		if (!descendant)
			return false

		const node = Component.is(descendant) ? descendant.element : descendant
		if (popover.element.contains(node))
			return true

		for (const child of popover.popoverChildren.value)
			if (child === descendant)
				return true
			else if (child.containsPopoverDescendant(descendant))
				return true

		return false
	}
})

export default Popover
