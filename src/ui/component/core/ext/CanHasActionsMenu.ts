import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import type { PopoverComponentRegisteredExtensions } from 'ui/component/core/Popover'
import Popover from 'ui/component/core/Popover'
import type { SlotInitialiserReturn } from 'ui/component/core/Slot'
import Slot from 'ui/component/core/Slot'
import Viewport from 'ui/utility/Viewport'
import { mutable } from 'utility/Objects'
import type State from 'utility/State'

export type ReanchorTweaker<MENU extends ActionsMenuExtensions<string>> = (actionsMenu: MENU, isTablet: boolean) => unknown

export interface ActionsMenuExtensions<ACTION_ID extends string> {
	readonly actionsWrappers: Record<ACTION_ID, Slot>
	appendAction<ID extends string> (id: ID, initialiser: (slot: Slot) => unknown): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	appendAction<ID extends string, T> (id: ID, state: State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	prependAction<ID extends string> (id: ID, initialiser: (slot: Slot) => unknown): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	prependAction<ID extends string, T> (id: ID, state: State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	insertAction<ID extends string> (id: ID, direction: 'before' | 'after', sibling: ACTION_ID, initialiser: (slot: Slot) => unknown): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	insertAction<ID extends string, T> (id: ID, direction: 'before' | 'after', sibling: ACTION_ID, state: State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	/** Allow adding a tweaker function that will be called whenever the anchor positioning is reset, after the default positioning */
	subscribeReanchor (tweaker: ReanchorTweaker<this>): this
	/** Remove a registered anchor tweaker function */
	unsubscribeReanchor (tweaker: ReanchorTweaker<this>): this
}

export interface ActionsMenu<ACTION_ID extends string> extends Popover, ActionsMenuExtensions<ACTION_ID> { }

const ActionsMenu = Component.Builder((component): ActionsMenu<never> => {
	if (!component.is(Popover))
		throw new Error('ActionsMenu must be a Popover')

	const anchorTweakers = new Set<(actionsMenu: ActionsMenuExtensions<never>, isTablet: boolean) => unknown>()
	const actionsWrappers: Record<string, Slot> = {}
	return component.extend<ActionsMenuExtensions<never>>(component => ({
		actionsWrappers,
		anchorTweakers,
		appendAction: makeActionInserter(wrapper =>
			wrapper.appendTo(component)),
		prependAction: makeActionInserter(wrapper =>
			wrapper.prependTo(component)),
		insertAction: makeActionInserter((wrapper, direction: 'before' | 'after', sibling: string) =>
			wrapper.insertTo(component, direction, actionsWrappers[sibling])),
		subscribeReanchor (tweaker) {
			anchorTweakers.add(tweaker)
			return component
		},
		unsubscribeReanchor (tweaker) {
			anchorTweakers.delete(tweaker)
			return component
		},
	}))

	function makeActionInserter<PARAMS extends any[]> (insert: (actionWrapper: Slot, ...params: PARAMS) => unknown) {
		type ParamsTail<T> = [stateOrInitialiser: State<T> | ((slot: Slot) => unknown), initialiser?: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn]
		type Params<ID extends string, T> = [id: ID, ...params: PARAMS, ...tail: ParamsTail<T>]
		return function <ID extends string, T> (...all: Params<ID, T>) {
			const [id] = all
			const [stateOrInitialiser, initialiser] = all.slice(-2) as ParamsTail<T>
			const params = all.slice(1, -2) as PARAMS

			const slot = Slot().tweak(insert, ...params)
			actionsWrappers[id] = slot

			if (typeof stateOrInitialiser === 'function') {
				slot.tweak(stateOrInitialiser)
				return component as typeof component & ActionsMenuExtensions<ID>
			}

			slot.use(stateOrInitialiser, initialiser!)
			return component as typeof component & ActionsMenuExtensions<ID>
		}
	}
})

type ActionsMenuInitialiser<ID extends string, T, RESULT> = (actionsMenu: ActionsMenu<ID>, host: T) => RESULT

export interface HasActionsMenuExtensions<ACTION_ID extends string = never> {
	readonly actionsMenu: ActionsMenu<ACTION_ID>
	tweakActions<MENU> (tweaker: ActionsMenuInitialiser<ACTION_ID, this, MENU>): this & HasActionsMenuExtensions<MENU extends ActionsMenuExtensions<infer ID> ? ID : never>
	tweakActionsAnchor (tweaker: (actionsMenu: ActionsMenu<never>) => unknown): this
	untweakActionsAnchor (tweaker: (actionsMenu: ActionsMenu<never>) => unknown): this
}

export interface CanHasActionsMenuExtensions {
	setActionsMenu<MENU> (initialiser: ActionsMenuInitialiser<never, this, MENU>): this & HasActionsMenuExtensions<MENU extends ActionsMenuExtensions<infer ID> ? ID : never>
	setActionsMenuButton (inserter?: (button: Button) => unknown): this
}

interface CanHasActionsMenu extends Component, CanHasActionsMenuExtensions { }

const CanHasActionsMenu = Component.Extension((component, popoverInitialiser?: ActionsMenuInitialiser<never, Component, unknown>): CanHasActionsMenu => {
	let actionsMenu: ActionsMenu<never> | undefined
	let hasActionsMenu = false
	let actionsMenuButtonInserter: true | ((button: Button) => unknown) | undefined
	let actionsMenuInitHandlers: ((popover: ActionsMenu<never>) => unknown)[] | undefined
	const onActionsMenu = (initialiser: (popover: ActionsMenu<never>) => unknown) => {
		if (actionsMenu)
			initialiser(actionsMenu)
		else
			(actionsMenuInitHandlers ??= []).push(initialiser)
	}
	return (component as Component & PopoverComponentRegisteredExtensions)
		.extend<CanHasActionsMenuExtensions & HasActionsMenuExtensions>(component => ({
			actionsMenu: undefined!,
			setActionsMenu (initialiser) {
				hasActionsMenu = true

				if (actionsMenuButtonInserter)
					addActionsMenuButton(component)

				component.clearPopover().setPopover('hover/longpress', (popover, button) => {
					actionsMenu = mutable(component).actionsMenu = popover
						.and(ActionsMenu)
						.style('actions-menu-popover')
						.prepend(Component()
							.style('actions-menu-popover-close-surface')
							.event.subscribe('click', () => popover.hide())
						)
						.append(Slot().style.remove('slot').style('actions-menu-popover-arrow'))
						.tweak(popoverInitialiser, button)
						.tweak(initialiser, button)

					for (const onActionMenu of actionsMenuInitHandlers ?? [])
						onActionMenu(actionsMenu)

					Viewport.tablet.use(actionsMenu, isTablet => {
						const tablet = isTablet()
						actionsMenu!.anchor.reset()
						if (tablet) actionsMenu!
							.type.remove('flush')
							.anchor.add('aligned right', 'off bottom')
							.anchor.add('aligned right', 'off top')
							.anchor.orElseHide()
						else actionsMenu!
							.type('flush')
							.anchor.add('off right', 'centre')
							.anchor.orElseHide()

						const { anchorTweakers } = actionsMenu as any as { anchorTweakers: Set<ReanchorTweaker<ActionsMenu<never>>> }
						for (const tweaker of anchorTweakers)
							tweaker(actionsMenu!, tablet)
					})
				})

				return component as never
			},
			setActionsMenuButton (inserter) {
				actionsMenuButtonInserter = inserter ?? true
				if (hasActionsMenu)
					addActionsMenuButton(component)

				return component
			},
			tweakActions (tweaker) {
				onActionsMenu(menu => menu.tweak(tweaker, component))
				return component as never
			},
			tweakActionsAnchor (tweaker) {
				onActionsMenu(menu => menu.subscribeReanchor(tweaker))
				return component
			},
			untweakActionsAnchor (tweaker) {
				onActionsMenu(menu => menu.unsubscribeReanchor(tweaker))
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

				if (Viewport.tablet.value)
					component.togglePopover()
				else
					component.showPopover()
			})
		if (typeof actionsMenuButtonInserter === 'function')
			actionsMenuButtonInserter(button)
		else
			button.appendTo(component)
	}
})

export default CanHasActionsMenu
