import type { ManifestReactionTypes } from 'api.fluff4.me'
import Component from 'ui/Component'
import type { ButtonIcon } from 'ui/component/core/Button'
import Button from 'ui/component/core/Button'
import type { StateOr } from 'utility/State'
import State from 'utility/State'

export type ReactionType = keyof ManifestReactionTypes | 'supporter_heart'

const REACTION_MAP: Record<ReactionType, ButtonIcon> = {
	love: 'heart',
	author_heart: 'author-heart',
	guest_heart: 'guest-heart',
	supporter_heart: 'supporter-heart',
}

interface ReactionExtensions {
	readonly reactions: State<number>
	readonly reacted: State<boolean>
	readonly icon: Button
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

	const icon = Button()
		.setIcon(REACTION_MAP[type])
		.type('icon')
		.style('reaction-button')
		.style.bind(reacted, 'reaction-button--reacted')
		.tweak(button => button.icon!
			.style('reaction-button-icon')
			.style.bind(reacted, 'reaction-button-icon--reacted'))

	return component
		.style('reaction')
		.append(icon)
		.appendWhen(reactions.truthy, Component()
			.style('reaction-count')
			.text.bind(reactions.map(component, reactions => reactions ? `${reactions}` : '')))
		.extend<ReactionExtensions>(component => ({
			reactions,
			reacted,
			icon,
		}))
})

export default Reaction
