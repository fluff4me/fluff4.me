import Component from 'ui/Component'
import type { IInputEvent } from 'ui/InputBus'
import InputBus from 'ui/InputBus'
import FocusListener from 'ui/utility/FocusListener'
import HoverListener from 'ui/utility/HoverListener'
import Mouse from 'ui/utility/Mouse'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Task from 'utility/Task'

const FOCUS_TRAP = Component()
	.tabIndex('auto')
	.ariaHidden()
	.style.setProperty('display', 'none')
	.prependTo(document.body)

export interface PopoverComponentRegisteredExtensions {
	popover: Popover
	tweakPopover (initialiser: PopoverInitialiser<this>): this
}

interface InternalPopoverExtensions {
	clickState: boolean
}

export type PopoverInitialiser<HOST> = (popover: Popover, host: HOST) => unknown

interface PopoverComponentExtensions {
	/** Disallow any popovers to continue showing if this component is hovered */
	clearPopover (): this
	setPopover (event: 'hover' | 'click', initialiser: PopoverInitialiser<this>): this & PopoverComponentRegisteredExtensions
}

Component.extend(component => {
	component.extend<PopoverComponentExtensions>((component: Component & PopoverComponentExtensions & Partial<PopoverComponentRegisteredExtensions> & Partial<InternalPopoverExtensions>) => ({
		clearPopover: () => component
			.attributes.set('data-clear-popover', 'true'),
		setPopover: (popoverEvent, initialiser) => {
			if (component.popover)
				component.popover.remove()

			let isShown = false

			const popover = Popover()
				.anchor.from(component)
				.setOwner(component)
				.tweak(initialiser, component)
				.event.subscribe('toggle', e => {
					const event = e as ToggleEvent & { component: Popover }
					if (event.newState === 'closed') {
						isShown = false
						component.clickState = false
						Mouse.offMove(updatePopoverState)
					}
				})
				.appendTo(document.body)

			if (popoverEvent === 'hover' && !component.popover)
				component.hoveredOrFocused.subscribe(component, updatePopoverState)

			const ariaLabel = component.attributes.getUsing('aria-label') ?? popover.attributes.get('aria-label')
			const ariaRole = popover.attributes.getUsing('role') ?? popover.attributes.get('role')
			component.ariaLabel.use((quilt, { arg }) => quilt['component/popover/button'](arg(ariaLabel), arg(ariaRole)))
			popover.ariaLabel.use((quilt, { arg }) => quilt['component/popover'](arg(ariaLabel)))

			component.clickState = false
			if (!component.popover) {
				component.event.subscribe('click', async event => {
					// always subscribe click because we need to handle it for keyboard navigation
					if (!component.focused.value && popoverEvent !== 'click')
						return

					event.stopPropagation()
					event.preventDefault()

					component.clickState = true
					component.popover?.show()
					component.popover?.focus()
					component.popover?.style.removeProperties('left', 'top')
					await Task.yield()
					component.popover?.anchor.apply()
				})

				component.receiveAncestorInsertEvents()
				component.event.subscribe(['insert', 'ancestorInsert'], updatePopoverParent)
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
				tweakPopover: initialiser => {
					initialiser(component.popover, component)
					return component
				},
			}))

			function updatePopoverParent () {
				if (!component.popover)
					return

				const oldParent = component.popover.popoverParent.value
				component.popover.popoverParent.asMutable?.setValue(component.closest(Popover))
				if (oldParent && oldParent !== component.popover.popoverParent.value)
					oldParent.popoverChildren.asMutable?.setValue(oldParent.popoverChildren.value.filter(c => c !== component.popover))

				if (component.popover.popoverParent.value && component.popover.popoverParent.value !== oldParent)
					component.popover.popoverParent.value.popoverChildren.asMutable?.setValue([...component.popover.popoverParent.value.popoverChildren.value, component.popover])
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
							|| InputBus.isDown('F4'))
					)
					|| !!component.clickState

				if (isShown === shouldShow)
					return

				if (component.hoveredOrFocused.value && !isShown)
					Mouse.onMove(updatePopoverState)

				if (!shouldShow)
					Mouse.offMove(updatePopoverState)

				if (!shouldShow)
					FOCUS_TRAP.style.setProperty('display', 'none')

				isShown = shouldShow
				component.popover.toggle(shouldShow)
				if (!shouldShow)
					return

				FOCUS_TRAP.style.setProperty('display', 'inline')
				component.popover.style.removeProperties('left', 'top')
				await Task.yield()
				component.popover.anchor.apply()
			}

			function shouldClearPopover () {
				if (!component.popover)
					return false

				const hovered = HoverListener.hovered() ?? null
				if (component.element.contains(hovered) || component.popover.element.contains(hovered))
					return false

				const clearsPopover = hovered?.closest('[data-clear-popover]')
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

declare module 'ui/Component' {
	interface ComponentExtensions extends PopoverComponentExtensions { }
}

interface PopoverExtensions {
	readonly visible: State<boolean>
	readonly popoverChildren: State<readonly Popover[]>
	readonly popoverParent: State<Popover | undefined>
	readonly popoverHasFocus: State<boolean>

	/** Sets the distance the mouse can be from the popover before it hides, if it's shown due to hover */
	setMousePadding (padding?: number): this
	/** Disables using the popover API for this element, using normal stacking instead of the element going into the top layer */
	setNormalStacking (): this

	isMouseWithin (checkDescendants?: true): boolean
	containsPopoverDescendant (node?: Node | Component): boolean
	/** Defaults on */
	setCloseOnInput (closeOnInput?: boolean): this

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
	let shouldCloseOnInput = true
	let normalStacking = false
	const popover = component
		.style('popover')
		.tabIndex('programmatic')
		.attributes.set('popover', 'manual')
		.extend<PopoverExtensions>(popover => ({
			visible,
			popoverChildren: State([]),
			popoverParent: State(undefined),
			popoverHasFocus: FocusListener.focused.map(popover, focused =>
				visible.value && containsPopoverDescendant(focused)),

			setCloseOnInput (closeOnInput = true) {
				shouldCloseOnInput = closeOnInput
				return popover
			},
			setMousePadding: padding => {
				mousePadding = padding
				return popover
			},
			setNormalStacking () {
				popover.style('popover--normal-stacking')
				popover.attributes.remove('popover')
				normalStacking = true
				togglePopover(visible.value)
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
				togglePopover(true)
				popover.visible.asMutable?.setValue(true)
				return popover
			},
			hide: () => {
				unbind?.()
				togglePopover(false)
				popover.visible.asMutable?.setValue(false)
				return popover
			},
			toggle: shown => {
				unbind?.()
				togglePopover(shown)
				popover.visible.asMutable?.setValue(shown ?? !popover.visible.value)
				return popover
			},
			bind: state => {
				unbind?.()
				unbind = state.use(popover, shown => {
					togglePopover(shown)
					popover.visible.asMutable?.setValue(shown)
				})
				return popover
			},
			unbind: () => {
				unbind?.()
				return popover
			},
		}))

	popover.event.subscribe('toggle', event => {
		popover.visible.asMutable?.setValue(event.newState === 'open')
	})

	popover.onRooted(() => {
		InputBus.subscribe('down', onInputDown)
		popover.removed.awaitManual(true, () => InputBus.unsubscribe('down', onInputDown))
	})

	return popover

	function togglePopover (shown?: boolean) {
		if (normalStacking)
			popover.style.toggle(!shown, 'popover--normal-stacking--hidden')
		else
			popover.element.togglePopover(shown)
	}

	function onInputDown (event: IInputEvent) {
		if (!popover.visible.value || !shouldCloseOnInput)
			return

		if (!event.key.startsWith('Mouse') || popover.containsPopoverDescendant(HoverListener.hovered()))
			return

		popover.element.togglePopover(false)
		popover.visible.asMutable?.setValue(false)
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
