import Follows from 'model/Follows'
import Session from 'model/Session'
import type { ComponentEvents } from 'ui/Component'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type { CheckDropdown } from 'ui/component/core/Dropdown'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import type Heading from 'ui/component/core/Heading'
import Loading from 'ui/component/core/Loading'
import RadioRow from 'ui/component/core/RadioRow'
import type { EventHandler } from 'ui/utility/EventManipulator'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface ActionBlockExtensions {
	addActions (provider: ActionProvider): this
	attachAbove (): this
	flush (): this
}

interface ActionBlock extends Component, ActionBlockExtensions { }

const ActionBlock = Component.Builder((component): ActionBlock => {
	let unuseActions: UnsubscribeState | undefined
	return component.style('action-block')
		.extend<ActionBlockExtensions>(block => ({
			flush () {
				block.style('action-block--flush')
				return block
			},
			attachAbove () {
				block.style('action-block--attached-above')
				return block
			},
			addActions (provider: ActionProvider) {
				unuseActions?.()

				const owner = State.Owner.create(); unuseActions = owner.remove
				block.removed.match(owner, true, owner.remove)

				const list = ActionProviderList()
				provider.getActions(owner, list)
				const visible = list.renderTo(owner, block)
				if (typeof visible === 'boolean')
					block.style.toggle(!visible, 'action-block--empty')
				else
					block.style.bind(visible.falsy, 'action-block--empty')
				return block
			},
		}))
})

export default ActionBlock

export const ActionBlockColumn = Component.Builder(component => {
	return component.style('action-block-column')
})

export type ActionInteractable = Button | CheckDropdown<string> | RadioDropdown<string> | RadioRow<string>
export type ActionProviderColumn =
	| [ActionInteractable] | [ActionInteractable | Heading, ActionInteractable]
	| { state: State<boolean>, items: [ActionInteractable] | [ActionInteractable | Heading, ActionInteractable] }
	| { state: State<boolean>, items: 'loading' }

export interface ActionFollowingDefinition {
	/** Whether the user is logged in and should be able to follow/ignore this object */
	isApplicable: State<boolean>
	isFollowing: State<boolean>
	isIgnoring: State<boolean>
	follow (): Promise<unknown>
	unfollow (): Promise<unknown>
	ignore (): Promise<unknown>
	unignore (): Promise<unknown>
}

export interface ActionModerationDefinition {
	/** Whether the user is logged in and should be able to report or moderate this object */
	isApplicable: State<boolean>
	report: EventHandler<Button, ComponentEvents, 'click'>
	moderate: EventHandler<Button, ComponentEvents, 'click'>
}

export interface ActionProviderList {
	readonly items: readonly (ActionProviderColumn)[]
	provide (owner: State.Owner, provider: ActionProvider): this
	add (button: ActionInteractable): this
	add (buttonOrHeading: ActionInteractable | Heading, button: ActionInteractable): this
	addWhen (state: State<boolean>, button: ActionInteractable): this
	addWhen (state: State<boolean>, buttonOrHeading: ActionInteractable | Heading, button: ActionInteractable): this
	addFollowing (owner: State.Owner, definition: ActionFollowingDefinition): this
	addModeration (owner: State.Owner, definition: ActionModerationDefinition): this
	renderTo (owner: State.Owner, container: Component): boolean | State<boolean>
}

export function ActionProviderList (): ActionProviderList {
	const items: ActionProviderColumn[] = []
	const providerList: ActionProviderList = {
		items,
		provide (owner, provider) {
			provider.getActions(owner, providerList)
			return providerList
		},
		add (buttonOrHeading: ActionInteractable | Heading, button?: ActionInteractable) {
			if (button)
				items.push([buttonOrHeading, button])
			else
				items.push([buttonOrHeading as ActionInteractable])
			return providerList
		},
		addWhen (state: State<boolean>, buttonOrHeading: ActionInteractable | Heading, button?: ActionInteractable) {
			if (button)
				items.push({ state, items: [buttonOrHeading, button] })
			else
				items.push({ state, items: [buttonOrHeading as ActionInteractable] })
			return providerList
		},
		addFollowing (owner, definition) {
			items.push({ state: Follows.changingState, items: 'loading' })

			const isOther = definition.isApplicable
			const notFollowingOrIgnoring = State.Every(owner,
				isOther,
				definition.isFollowing.falsy,
				definition.isIgnoring.falsy,
				Follows.changingState.falsy,
			)
			providerList.addWhen(notFollowingOrIgnoring, RadioRow()
				.add('follow', button => button
					.type('flush').style.remove('radio-row-option')
					.setIcon('bookmark')
					.text.use('shared/action/follow')
				)
				.add('ignore', button => button
					.type('flush').style.remove('radio-row-option')
					.setIcon('eye-slash')
					.text.use('shared/action/ignore')
				)
				.tweak(row => {
					row.selection.subscribeManual(selection => {
						if (selection === 'follow')
							return definition.follow()
						if (selection === 'ignore')
							return definition.ignore()
					})

					notFollowingOrIgnoring.subscribeManual(notFollowingOrIgnoring => {
						if (!notFollowingOrIgnoring)
							row.select(undefined)
					})
				})
			)

			const isFollowing = State.Every(owner,
				isOther,
				definition.isFollowing,
				Follows.changingState.falsy,
			)
			providerList.addWhen(isFollowing, RadioDropdown()
				.tweak(dropdown => dropdown.button.type('flush').setIcon('bookmark'))
				.setSimple()
				.add('following', { translation: id => quilt => quilt['shared/action/following']() })
				.add('unfollow', { translation: id => quilt => quilt['shared/action/unfollow'](), tweakButton: button => button.setIcon('bookmark') })
				.add('ignore', { translation: id => quilt => quilt['shared/action/ignore'](), tweakButton: button => button.setIcon('eye-slash') })
				.tweak(dropdown => {
					dropdown.selection.subscribeManual(selection => {
						if (selection === 'unfollow')
							return definition.unfollow()
						if (selection === 'ignore')
							return definition.ignore()
					})

					isFollowing.useManual(isFollowing => dropdown.select(isFollowing ? 'following' : undefined))
				})
			)

			const isIgnoring = State.Every(owner,
				isOther,
				definition.isIgnoring,
				Follows.changingState.falsy,
			)
			providerList.addWhen(isIgnoring, RadioDropdown()
				.tweak(dropdown => dropdown.button.type('flush').setIcon('eye-slash'))
				.setSimple()
				.add('ignoring', { translation: id => quilt => quilt['shared/action/ignoring']() })
				.add('unignore', { translation: id => quilt => quilt['shared/action/unignore'](), tweakButton: button => button.setIcon('eye-slash') })
				.add('follow', { translation: id => quilt => quilt['shared/action/follow'](), tweakButton: button => button.setIcon('bookmark') })
				.tweak(dropdown => {
					dropdown.selection.subscribeManual(selection => {
						if (selection === 'unignore')
							return definition.unignore()
						if (selection === 'follow')
							return definition.follow()
					})

					isIgnoring.useManual(isIgnoring => dropdown.select(isIgnoring ? 'ignoring' : undefined))
				})
			)

			return providerList
		},
		addModeration (owner, definition) {
			const shouldShowReporting = State.Every(owner, definition.isApplicable, Session.Auth.isModerator.falsy)
			const shouldShowModeration = State.Every(owner, definition.isApplicable, Session.Auth.isModerator)
			providerList.addWhen(shouldShowReporting, Button()
				.type('flush')
				.setIcon('flag')
				.text.use('shared/action/report')
				.event.subscribe('click', definition.report)
			)

			providerList.addWhen(shouldShowModeration, Button()
				.type('flush')
				.setIcon('shield-halved')
				.text.use('shared/action/moderate')
				.event.subscribe('click', definition.moderate)
			)

			return providerList
		},
		renderTo (owner, container) {
			let visible: boolean | State<boolean> = false
			const states: State<boolean>[] = []
			for (const column of items) {
				const items = 'items' in column ? column.items : column
				const contents = items === 'loading'
					? [(Loading()
						.tweak(loading => loading.enabled.value = true)
						.style('action-block-loading')
						.tweak(loading => loading.flag.style('action-block-loading-flag'))
					)]
					: items
				ActionBlockColumn()
					.append(...contents)
					.tweak('state' in column
						? c => c.appendToWhen(column.state, container)
						: c => c.appendTo(container)
					)

				// if there's ever a column without a state, the whole block is always visible
				visible ||= !('state' in column)

				if (!visible && 'state' in column)
					states.push(column.state)
			}

			return false
				|| visible
				|| (!states.length ? false : State.Some(owner, ...states))
		},
	}

	return providerList
}

export interface ActionProvider {
	getActions (owner: State.Owner, actions: ActionProviderList): unknown
}
