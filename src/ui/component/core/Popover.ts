import Component, { ComponentPerf } from 'ui/Component'
import Dialog from 'ui/component/core/Dialog'
import type { IInputEvent } from 'ui/InputBus'
import InputBus, { HandlesMouseEvents } from 'ui/InputBus'
import FocusListener from 'ui/utility/FocusListener'
import HoverListener from 'ui/utility/HoverListener'
import Mouse from 'ui/utility/Mouse'
import type { ComponentNameType } from 'ui/utility/StyleManipulator'
import TypeManipulator from 'ui/utility/TypeManipulator'
import Viewport from 'ui/utility/Viewport'
import Vector2 from 'utility/maths/Vector2'
import { mutable } from 'utility/Objects'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'
import Task from 'utility/Task'

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

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
	setPopover (event: 'hover/longpress' | 'longpress' | 'hover/click' | 'click', initialiser: PopoverInitialiser<this>): this & PopoverComponentRegisteredExtensions
	hasPopoverSet (): boolean
}

declare module 'ui/Component' {
	interface ComponentExtensions extends PopoverComponentExtensions { }
}

Component.extend(component => {
	component.extend<PopoverComponentExtensions>((component: Component & PopoverComponentExtensions & Partial<PopoverComponentRegisteredExtensions> & Partial<InternalPopoverExtensions>) => ({
		hasPopoverSet () {
			return !!(component as Component & PopoverComponentRegisteredExtensions).popover
		},
		clearPopover: () => component
			.attributes.set('data-clear-popover', 'true'),
		setPopover: (popoverEvent, initialiser) => {
			if (component.popover)
				component.popover.remove()

			component.style('has-popover')

			let isShown = false

			const popover = Popover()
				.anchor.from(component)
				.tweak(popover => popover
					.prepend(Component()
						.style('popover-close-surface')
						.event.subscribe('click', () => popover.hide())
					)
				)
				.setOwner(component)
				.setCloseDueToMouseInputFilter(event => {
					const hovered = HoverListener.hovered() ?? null
					if (component.element.contains(hovered))
						return false

					return true
				})
				.event.subscribe('toggle', e => {
					if (!popover.element.matches(':popover-open')) {
						isShown = false
						component.clickState = false
						Mouse.offMove(updatePopoverState)
					}
				})
				.tweak(initialiser, component)

			component.getStateForClosest(Dialog).use(popover, getDialog => {
				popover.appendTo(getDialog() ?? document.body)
			})

			let touchTimeout: number | undefined
			let touchStart: Vector2 | undefined
			let longpressed = false
			function cancelLongpress () {
				longpressed = false
				touchStart = undefined
				clearTimeout(touchTimeout)
			}
			component.event.until(popover, event => event
				.subscribe('touchstart', event => {
					touchStart = Vector2.fromClient(event.touches[0])
					if (event.touches.length > 1)
						return cancelLongpress()

					const closestWithPopover = [
						event.targetComponent,
						...event.targetComponent?.getAncestorComponents() ?? [],
					]
						.find(component => component?.hasPopoverSet())

					////////////////////////////////////
					//#region Debugging

					// function useError (supplier: () => unknown) {
					// 	try {
					// 		return supplier()
					// 	}
					// 	catch (e) {
					// 		return e instanceof Error ? e.message : String(e)
					// 	}
					// }
					// Component('pre')
					// 	.style.setProperties({
					// 		position: 'relative',
					// 		zIndex: '2',
					// 		background: '#222',
					// 		color: '#aaa',
					// 		fontSize: 'var(--font-0)',
					// 		whiteSpace: 'pre-wrap',
					// 	})
					// 	.text.set(Object
					// 		.entries({
					// 			eventPopoverHost: component?.fullType,
					// 			...(event.targetComponent === component
					// 				? { targetIsEventHost: true }
					// 				: {
					// 					targetIsEventHost: false,
					// 					target: event.targetComponent?.fullType,
					// 					...(closestWithPopover === component
					// 						? { closestIsEventHost: true }
					// 						: {
					// 							closestIsEventHost: false,
					// 							closestPopoverHost: closestWithPopover?.fullType,
					// 						}
					// 					),
					// 				}
					// 			),
					// 		})
					// 		.map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
					// 		.join('\n')
					// 	)
					// 	.appendTo(component)

					//#endregion
					////////////////////////////////////

					if (closestWithPopover !== component)
						return

					touchTimeout = window.setTimeout(() => {
						longpressed = true
						void updatePopoverState(null, null, 'longpress')
					}, 800)
				})
				.subscribePassive('touchmove', event => {
					if (!touchStart)
						return

					if (event.touches.length > 1)
						return cancelLongpress()

					const newPosition = Vector2.fromClient(event.touches[0])
					if (!Vector2.distanceWithin(20, touchStart, newPosition))
						return cancelLongpress()
				})
				.subscribe('touchend', event => {
					if (longpressed)
						event.preventDefault()

					cancelLongpress()
				})
				.subscribe('contextmenu', event => {
					if (touchStart)
						return

					event.preventDefault()
					void updatePopoverState(null, null, 'longpress')
				})
			)

			popover.visible.match(component, true, async () => {
				if (popover.hasContent()) {
					popover.show()
					await Task.yield()
					popover.rect.markDirty()
					popover.anchor.apply()
				}
			})

			popover.style.bind(popover.anchor.state.mapManual(location => location?.preference?.yAnchor.side === 'bottom'), 'popover--anchored-top')

			const hostHoveredOrFocusedForLongEnough = component.hoveredOrFocused.delay(popover, hoveredOrFocused => {
				if (!hoveredOrFocused)
					return 0 // no delay for mouseoff or blur

				return popover.getDelay()
			})

			if ((popoverEvent === 'hover/click' || popoverEvent === 'hover/longpress' || popoverEvent === 'longpress') && !component.popover)
				hostHoveredOrFocusedForLongEnough.subscribe(component, updatePopoverState)

			const rawLabel = component.ariaLabel.state.value
			const ariaLabel = popover.ariaLabel.state.map(popover, popoverLabel => rawLabel || popoverLabel)
			const ariaRole = popover.attributes.getUsing('role') ?? popover.attributes.get('role')
			component.ariaLabel.bind(ariaLabel.mapManual(ariaLabel =>
				(quilt, { arg }) => quilt['popover/button'](arg(ariaLabel), arg(ariaRole))))
			popover.ariaLabel.bind(ariaLabel.mapManual(ariaLabel =>
				(quilt, { arg }) => quilt['popover'](arg(ariaLabel))))

			navigate.event.subscribe('Navigate', forceClose)
			popover.removed.matchManual(true, () => navigate.event.unsubscribe('Navigate', forceClose))
			function forceClose () {
				component.clickState = false
				popover.hide()
			}

			component.clickState = false
			if (!component.popover) {
				component.event.subscribe('click', async event => {
					if (popoverEvent === 'hover/longpress' || popoverEvent === 'longpress')
						return

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

				ComponentPerf.CallbacksOnInsertions.add(component, updatePopoverParent)
				// component.receiveInsertEvents()
				// component.receiveAncestorInsertEvents()
				// component.event.subscribe(['insert', 'ancestorInsert'], updatePopoverParent)
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
				component.popover?.rect.markDirty()
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

			async function updatePopoverState (_1?: any, _2?: any, reason?: 'longpress') {
				if (!component.popover)
					return

				const shouldShow = false
					|| (hostHoveredOrFocusedForLongEnough.value && !isTouchDevice() && !(popoverEvent === 'longpress' && Viewport.tablet.value))
					|| reason === 'longpress'
					|| (isShown && (popoverEvent === 'hover/longpress' || popoverEvent === 'longpress') && Viewport.tablet.value)
					|| (true
						&& isShown
						&& (false
							|| (component.popover.isMouseWithin(true) && !shouldClearPopover())
							|| InputBus.isDown('F4'))
					)
					|| !!component.clickState

				////////////////////////////////////
				//#region Debugging

				// Component('pre')
				// 	.style.setProperties({
				// 		fontSize: 'var(--font-0)',
				// 		whiteSpace: 'pre-wrap',
				// 	})
				// 	.text.set(JSON.stringify({
				// 		shouldShow,
				// 		isShown,
				// 		reason,
				// 	}, null, '  '))
				// 	.prependTo(document.body)

				//#endregion
				////////////////////////////////////

				if (isShown === shouldShow)
					return

				if (hostHoveredOrFocusedForLongEnough.value && !isShown)
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
				// component.popover.style.removeProperties('left', 'top')
				await Task.yield()
				component.popover?.rect.markDirty()
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

interface PopoverExtensions {
	readonly visible: State<boolean>
	readonly popoverChildren: State<readonly Popover[]>
	readonly popoverParent: State<Popover | undefined>
	readonly popoverHasFocus: State<'focused' | 'no-focus' | undefined>
	readonly type: TypeManipulator<this, PopoverType>
	readonly lastStateChangeTime: number

	/** Sets the distance the mouse can be from the popover before it hides, if it's shown due to hover */
	setMousePadding (padding?: number): this
	/** Sets the delay until this popover will show (only in hover mode) */
	setDelay (ms: number): this
	getDelay (): number
	/** Disables using the popover API for this element, using normal stacking instead of the element going into the top layer */
	setNormalStacking (): this

	isMouseWithin (checkDescendants?: true): boolean
	containsPopoverDescendant (node?: Node | Component): boolean
	/** Defaults on */
	setCloseOnInput (closeOnInput?: boolean): this
	setCloseDueToMouseInputFilter (filter: (event: IInputEvent) => boolean): this
	onShow (handler: (popover: Popover) => boolean): this

	show (): this
	hide (): this
	toggle (shown?: boolean): this
	bind (state: State<boolean>): this
	unbind (): this
}

interface Popover extends Component, PopoverExtensions { }

const Popover = Component.Builder((component): Popover => {
	let mousePadding: number | undefined
	let delay = 0
	let unbind: UnsubscribeState | undefined
	const visible = State(false)
	let shouldCloseOnInput = true
	let inputFilter: ((event: IInputEvent) => boolean) | undefined
	let normalStacking = false
	const onShowHandlers: ((popover: Popover) => boolean)[] = []
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
			setDelay (ms) {
				delay = ms
				return popover
			},
			getDelay () {
				return delay
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
			onShow (handler) {
				onShowHandlers.push(handler)
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
		popover.removed.matchManual(true, () => InputBus.unsubscribe('down', onInputDown))
	})

	return popover

	function togglePopover (shown?: boolean) {
		if (shown)
			for (const handler of onShowHandlers)
				if (handler(popover) === false)
					return

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
