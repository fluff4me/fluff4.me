import Component from 'ui/Component'
import type { IInputEvent } from 'ui/InputBus'
import InputBus, { HandlesMouseEvents } from 'ui/InputBus'
import FocusListener from 'ui/utility/FocusListener'
import HoverListener from 'ui/utility/HoverListener'
import Mouse from 'ui/utility/Mouse'
import type { ComponentNameType } from 'ui/utility/StyleManipulator'
import TypeManipulator from 'ui/utility/TypeManipulator'
import Viewport from 'ui/utility/Viewport'
import { mutable } from 'utility/Objects'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Task from 'utility/Task'

export type PopoverType = ComponentNameType<'popover--type'>

namespace FocusTrap {
	let component: Component | undefined
	function get () {
		return component ??= Component()
			.tabIndex('auto')
			.ariaHidden()
			.style.setProperty('display', 'none')
			.prependTo(document.body)
	}

	export function show () {
		get().style.setProperty('display', 'inline')
	}

	export function hide () {
		get().style.setProperty('display', 'none')
	}
}

export interface PopoverComponentRegisteredExtensions {
	popover: Popover
	tweakPopover (initialiser: PopoverInitialiser<this>): this
	/** Simulate a click on a button for this popover */
	showPopover (): this
	togglePopover (): this
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
				.setCloseDueToMouseInputFilter(event => {
					const hovered = HoverListener.hovered() ?? null
					if (component.element.contains(hovered))
						return false

					return true
				})
				.event.subscribe('toggle', e => {
					const event = e as ToggleEvent & { host: Popover }
					if (event.newState === 'closed') {
						isShown = false
						component.clickState = false
						Mouse.offMove(updatePopoverState)
					}
				})
				.appendTo(document.body)

			popover.visible.await(component, true, async () => {
				popover.tweak(initialiser, component)
				if (popover.hasContent()) {
					popover.show()
					await Task.yield()
					popover.anchor.apply()
				}
			})

			popover.style.bind(popover.anchor.state.mapManual(location => location?.preference?.yAnchor.side === 'bottom'), 'popover--anchored-top')

			if (popoverEvent === 'hover' && !component.popover)
				component.hoveredOrFocused.subscribe(component, updatePopoverState)

			const rawLabel = component.ariaLabel.state.value
			const ariaLabel = popover.ariaLabel.state.map(popover, popoverLabel => rawLabel || popoverLabel)
			const ariaRole = popover.attributes.getUsing('role') ?? popover.attributes.get('role')
			component.ariaLabel.bind(ariaLabel.mapManual(ariaLabel =>
				(quilt, { arg }) => quilt['component/popover/button'](arg(ariaLabel), arg(ariaRole))))
			popover.ariaLabel.bind(ariaLabel.mapManual(ariaLabel =>
				(quilt, { arg }) => quilt['component/popover'](arg(ariaLabel))))

			navigate.event.subscribe('Navigate', forceClose)
			popover.removed.awaitManual(true, () => navigate.event.unsubscribe('Navigate', forceClose))
			function forceClose () {
				component.clickState = false
				popover.hide()
			}

			component.clickState = false
			if (!component.popover) {
				component.event.subscribe('click', async event => {
					const closestHandlesMouseEvents = (event.target as HTMLElement).component?.closest(HandlesMouseEvents)
					if (closestHandlesMouseEvents && closestHandlesMouseEvents?.element !== component.element && component.element.contains(closestHandlesMouseEvents.element))
						return

					component.clickState = !component.clickState

					event.stopPropagation()
					event.preventDefault()

					if (component.clickState)
						await showPopoverClick()
					else
						popover.hide()
				})

				component.receiveAncestorInsertEvents()
				component.event.subscribe(['insert', 'ancestorInsert'], updatePopoverParent)
			}

			popover.popoverHasFocus.subscribe(component, (hasFocused, oldValue) => {
				if (hasFocused)
					return

				component.clickState = false
				component.popover?.hide()
				if (oldValue !== 'no-focus')
					component.focus()
			})

			return component.extend<PopoverComponentRegisteredExtensions>(component => ({
				popover,
				popoverDescendants: [],
				tweakPopover: initialiser => {
					initialiser(component.popover, component)
					return component
				},
				showPopover: () => {
					void showPopoverClick()
					return component
				},
				togglePopover: () => {
					if (popover.visible.value)
						popover.hide()
					else
						void showPopoverClick()

					return component
				},
			}))

			async function showPopoverClick () {
				component.popover?.show()
				component.popover?.focus()
				component.popover?.style.removeProperties('left', 'top')
				await Task.yield()
				component.popover?.anchor.apply()
			}

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
					FocusTrap.hide()

				isShown = shouldShow
				component.popover.toggle(shouldShow)
				if (!shouldShow)
					return

				FocusTrap.show()
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

				const clearsPopoverContainsHost = clearsPopover.contains(component.element)
				if (clearsPopoverContainsHost)
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
	readonly popoverHasFocus: State<'focused' | 'no-focus' | undefined>
	readonly type: TypeManipulator<this, PopoverType>
	readonly lastStateChangeTime: number

	/** Sets the distance the mouse can be from the popover before it hides, if it's shown due to hover */
	setMousePadding (padding?: number): this
	/** Disables using the popover API for this element, using normal stacking instead of the element going into the top layer */
	setNormalStacking (): this

	isMouseWithin (checkDescendants?: true): boolean
	containsPopoverDescendant (node?: Node | Component): boolean
	/** Defaults on */
	setCloseOnInput (closeOnInput?: boolean): this
	setCloseDueToMouseInputFilter (filter: (event: IInputEvent) => boolean): this

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
	let inputFilter: ((event: IInputEvent) => boolean) | undefined
	let normalStacking = false
	const popover = component
		.style('popover')
		.tabIndex('programmatic')
		.attributes.set('popover', 'manual')
		.extend<PopoverExtensions>(popover => ({
			lastStateChangeTime: 0,
			visible,
			type: TypeManipulator.Style(popover, type => `popover--type-${type}`),
			popoverChildren: State([]),
			popoverParent: State(undefined),
			popoverHasFocus: FocusListener.focused.map(popover, focused =>
				!focused ? 'no-focus'
					: (visible.value && containsPopoverDescendant(focused)) ? 'focused'
						: undefined
			),

			setCloseOnInput (closeOnInput = true) {
				shouldCloseOnInput = closeOnInput
				return popover
			},
			setCloseDueToMouseInputFilter (filter) {
				inputFilter = filter
				return popover
			},
			setMousePadding: padding => {
				mousePadding = padding
				return popover
			},
			setNormalStacking () {
				Viewport.tablet.use(popover, isTablet => {
					const tablet = isTablet()
					popover.style.toggle(!tablet, 'popover--normal-stacking')
					popover.attributes.toggle(tablet, 'popover', 'manual')
					normalStacking = !tablet
					togglePopover(visible.value)
				})

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
		if (!popover.hasContent())
			shown = false

		if (normalStacking && !Viewport.tablet.value)
			popover.style.toggle(!shown, 'popover--normal-stacking--hidden')
		else if (popover.rooted.value)
			popover
				.style.remove('popover--normal-stacking--hidden')
				.attributes.set('popover', 'manual')
				.element.togglePopover(shown)

		mutable(popover).lastStateChangeTime = Date.now()
	}

	function onInputDown (event: IInputEvent) {
		if (!popover.visible.value || !shouldCloseOnInput)
			return

		if (!event.key.startsWith('Mouse') || popover.containsPopoverDescendant(HoverListener.hovered()))
			return

		if (inputFilter && !inputFilter(event))
			return

		if (popover.rooted.value)
			popover
				.attributes.set('popover', 'manual')
				.element.togglePopover(false)

		popover.visible.asMutable?.setValue(false)

		mutable(popover).lastStateChangeTime = Date.now()
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
