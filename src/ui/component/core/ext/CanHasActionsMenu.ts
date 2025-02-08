import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import type { PopoverComponentRegisteredExtensions, PopoverInitialiser } from 'ui/component/core/Popover'
import Popover from 'ui/component/core/Popover'
import type { SlotInitialiserReturn } from 'ui/component/core/Slot'
import Slot from 'ui/component/core/Slot'
import { mutable } from 'utility/Objects'
import type State from 'utility/State'

export interface ActionsMenuExtensions<ACTION_ID extends string> {
	readonly actionsWrappers: Record<ACTION_ID, Slot>
	appendAction<ID extends string> (id: ID, initialiser: (slot: Slot) => unknown): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	appendAction<ID extends string, T> (id: ID, state: State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	prependAction<ID extends string> (id: ID, initialiser: (slot: Slot) => unknown): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	prependAction<ID extends string, T> (id: ID, state: State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	insertAction<ID extends string> (id: ID, direction: 'before' | 'after', sibling: ACTION_ID, initialiser: (slot: Slot) => unknown): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
	insertAction<ID extends string, T> (id: ID, direction: 'before' | 'after', sibling: ACTION_ID, state: State<T>, initialiser: (slot: ComponentInsertionTransaction, value: T) => SlotInitialiserReturn): Omit<this, keyof ActionsMenuExtensions<string>> & ActionsMenuExtensions<ACTION_ID | ID>
}

export interface ActionsMenu<ACTION_ID extends string> extends Popover, ActionsMenuExtensions<ACTION_ID> { }

const ActionsMenu = Component.Builder((component): ActionsMenu<never> => {
	if (!component.is(Popover))
		throw new Error('ActionsMenu must be a Popover')

	const actionsWrappers: Record<string, Slot> = {}
	return component.extend<ActionsMenuExtensions<never>>(component => ({
		actionsWrappers,
		appendAction: makeActionInserter(wrapper =>
			wrapper.appendTo(component)),
		prependAction: makeActionInserter(wrapper =>
			wrapper.prependTo(component)),
		insertAction: makeActionInserter((wrapper, direction: 'before' | 'after', sibling: string) =>
			wrapper.insertTo(component, direction, actionsWrappers[sibling])),
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
}

export interface CanHasActionsMenuExtensions {
	setActionsMenu<MENU> (initialiser: ActionsMenuInitialiser<never, this, MENU>): this & HasActionsMenuExtensions<MENU extends ActionsMenuExtensions<infer ID> ? ID : never>
	setActionsMenuButton (inserter?: (button: Button) => unknown): this
}

interface CanHasActionsMenu extends Component, CanHasActionsMenuExtensions { }

const CanHasActionsMenu = Component.Extension((component, popoverInitialiser?: PopoverInitialiser<Component>): CanHasActionsMenu => {
	let hasActionsMenu = false
	let actionsMenuButtonInserter: true | ((button: Button) => unknown) | undefined
	return (component as Component & PopoverComponentRegisteredExtensions)
		.extend<CanHasActionsMenuExtensions & HasActionsMenuExtensions>(component => ({
			actionsMenu: undefined!,
			setActionsMenu (initialiser) {
				hasActionsMenu = true

				if (actionsMenuButtonInserter)
					addActionsMenuButton(component)

				component.clearPopover().setPopover('hover', (popover, button) =>
					mutable(component).actionsMenu = popover
						.and(ActionsMenu)
						.type('flush')
						.style('actions-menu-popover')
						.anchor.add('off right', 'centre')
						.anchor.orElseHide()
						.append(Slot().style.remove('slot').style('actions-menu-popover-arrow'))
						.tweak(popoverInitialiser, button)
						.tweak(initialiser, button)
				)

				return component as never
			},
			setActionsMenuButton (inserter) {
				actionsMenuButtonInserter = inserter ?? true
				if (hasActionsMenu)
					addActionsMenuButton(component)

				return component
			},
			tweakActions (tweaker) {
				component.actionsMenu.tweak(tweaker, component)
				return component as never
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
