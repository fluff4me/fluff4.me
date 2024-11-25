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

export interface PopoverComponentRegisteredExtensions {
	popover: Popover
	tweakPopover (initialiser: PopoverInitialiser<this>): this
}

interface InternalPopoverExtensions {
	clickState: boolean
}

export type PopoverInitialiser<HOST> = (popover: Popover, host: HOST) => any

interface PopoverComponentExtensions {
	/** Disallow any popovers to continue showing if this component is hovered */
	clearPopover (): this
	setPopover (event: "hover" | "click", initialiser: PopoverInitialiser<this>): this & PopoverComponentRegisteredExtensions
}

Component.extend(component => {
	component.extend<PopoverComponentExtensions>((component: Component & PopoverComponentExtensions & Partial<PopoverComponentRegisteredExtensions> & Partial<InternalPopoverExtensions>) => ({
		clearPopover: () => component
			.attributes.set("data-clear-popover", "true"),
		setPopover: (popoverEvent, initialiser) => {
			if (component.popover)
				component.popover.remove()

			let isShown = false

			const popover = Popover()
				.anchor.from(component)
				.setOwner(component)
				.tweak(initialiser, component)
				.event.subscribe("toggle", e => {
					const event = e as ToggleEvent & { component: Popover }
					if (event.newState === "closed") {
						isShown = false
						component.clickState = false
						Mouse.offMove(updatePopoverState)
					}
				})
				.appendTo(document.body)

			if (popoverEvent === "hover" && !component.popover)
				component.hoveredOrFocused.subscribe(component, updatePopoverState)

			const ariaLabel = component.attributes.getUsing("aria-label") ?? popover.attributes.get("aria-label")
			const ariaRole = popover.attributes.getUsing("role") ?? popover.attributes.get("role")
			component.ariaLabel.use((quilt, { arg }) => quilt["component/popover/button"](arg(ariaLabel), arg(ariaRole)))
			popover.ariaLabel.use((quilt, { arg }) => quilt["component/popover"](arg(ariaLabel)))

			component.clickState = false
			if (!component.popover) {
				component.event.subscribe("click", async event => {
					// always subscribe click because we need to handle it for keyboard navigation
					if (!component.focused.value && popoverEvent !== "click")
						return

					event.stopPropagation()
					component.clickState = true
					component.popover?.show()
					component.popover?.focus()
					component.popover?.style.removeProperties("left", "top")
					await Task.yield()
					component.popover?.anchor.apply()
				})

				component.receiveAncestorInsertEvents()
				component.event.subscribe(["insert", "ancestorInsert"], updatePopoverParent)
			}

			popover.popoverHasFocus.subscribe(component, hasFocused => {
				if (hasFocused)
					return

				component.clickState = false
				component.popover?.hide()
				component.focus()
			})

			return component.extend<PopoverComponentRegisteredExtensions>(component => ({
				popover,
				popoverDescendants: [],
				tweakPopover: (initialiser) => {
					initialiser(component.popover, component)
					return component
				},
			}))

			function updatePopoverParent () {
				if (!component.popover)
					return

				const oldParent = component.popover.popoverParent.value
				component.popover.popoverParent.value = component.closest(Popover)
				if (oldParent && oldParent !== component.popover.popoverParent.value)
					oldParent.popoverChildren.value = oldParent.popoverChildren.value.filter(c => c !== component.popover)

				if (component.popover.popoverParent.value && component.popover.popoverParent.value !== oldParent)
					component.popover.popoverParent.value.popoverChildren.value = [...component.popover.popoverParent.value.popoverChildren.value, component.popover]
			}

			async function updatePopoverState () {
				if (!component.popover)
					return

				const shouldShow = false
					|| component.hoveredOrFocused.value
					|| (true
						&& isShown
						&& (false
							|| (component.popover.isMouseWithin(true) && !shouldClearPopover())
							|| InputBus.isDown("F4"))
					)
					|| !!component.clickState

				if (isShown === shouldShow)
					return

				if (component.hoveredOrFocused.value && !isShown)
					Mouse.onMove(updatePopoverState)

				if (!shouldShow)
					Mouse.offMove(updatePopoverState)

				if (!shouldShow)
					FOCUS_TRAP.style.setProperty("display", "none")

				isShown = shouldShow
				component.popover.toggle(shouldShow)
				if (!shouldShow)
					return

				FOCUS_TRAP.style.setProperty("display", "inline")
				component.popover.style.removeProperties("left", "top")
				await Task.yield()
				component.popover.anchor.apply()
			}

			function shouldClearPopover () {
				if (!component.popover)
					return false

				const hovered = HoverListener.hovered() ?? null
				if (component.element.contains(hovered) || component.popover.element.contains(hovered))
					return false

				const clearsPopover = hovered?.closest("[data-clear-popover]")
				if (!clearsPopover)
					return false

				const clearsPopoverWithinPopover = clearsPopover.component?.closest(Popover)
				if (component.popover.containsPopoverDescendant(clearsPopoverWithinPopover))
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
	const visible = State(false)
	const popover = component
		.style("popover")
		.tabIndex("programmatic")
		.attributes.set("popover", "manual")
		.extend<PopoverExtensions>(popover => ({
			visible,
			popoverChildren: State([]),
			popoverParent: State(undefined),
			popoverHasFocus: FocusListener.focused.map(popover, focused =>
				visible.value && containsPopoverDescendant(focused)),

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

	popover.onRooted(() => {
		InputBus.subscribe("down", onInputDown)
		component.event.subscribe("remove", () => InputBus.unsubscribe("down", onInputDown))
	})

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
