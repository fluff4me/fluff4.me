import type { ManifestReactionTypes } from 'api.fluff4.me'
import Component from 'ui/Component'
import type { ButtonIcon } from 'ui/component/core/Button'
import Button from 'ui/component/core/Button'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

export type ReactionType = keyof ManifestReactionTypes

const REACTION_MAP: Record<ReactionType, ButtonIcon> = {
	love: 'heart',
}

interface ReactionExtensions {
	readonly reactions: State<number>
	readonly reacted: State<boolean>
}

interface Reaction extends Component, ReactionExtensions { }

const Reaction = Component.Builder((
	component,
	type: ReactionType,
	reactionsIn: StateOr<number> = State(0),
	reactedIn: StateOr<boolean> = State(false),
): Reaction => {
	const reactions = State.get(reactionsIn)
	const reacted = State.get(reactedIn)

	return component
		.style('reaction')
		.append(Button()
			.setIcon(REACTION_MAP[type])
			.style('reaction-button')
			.style.bind(reacted, 'reaction-button--reacted'))
		.append(Component()
			.style('reaction-count')
			.text.bind(reactions.map(component, reactions => reactions ? `${reactions}` : '')))
		.extend<ReactionExtensions>(component => ({
			reactions,
			reacted,
		}))
})

export default Reaction
