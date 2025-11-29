import Follows from 'model/Follows'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import ActionBlock from 'ui/component/ActionBlock'
import Link from 'ui/component/core/Link'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import { Tab } from 'ui/component/core/Tabinator'
import TagBlock from 'ui/component/TagBlock'
import AbortPromise from 'utility/AbortPromise'
import { NonNullish } from 'utility/Arrays'

interface FollowingTagsTabExtensions {

}

interface FollowingTagsTab extends Tab, FollowingTagsTabExtensions { }

const FollowingTagsTab = Component.Builder((component, type: 'following' | 'ignoring'): FollowingTagsTab => {
	const tab = component.and(Tab, 'tags')
		.text.use('view/following/tab/tags')
		.extend<FollowingTagsTabExtensions>(tab => ({}))

	const tags = Follows.map(tab,
		manifest => manifest?.[type].tag ?? [],
		(a, b) => true
			&& !!a === !!b
			&& a.length === b.length
			&& a.every(follow => b.some(follow2 => follow.tag === follow2.tag))
	)

	Slot()
		.use(tags, AbortPromise.asyncFunction(async (signal, slot, follows) => {
			const tags = await Tags.resolve(follows.map(follow => follow.tag).filterInPlace(NonNullish))

			if (!tags.length)
				return Placeholder()
					.text.use(`view/${type}/panel/tags/empty`)
					.appendTo(slot)

			for (const tag of tags) {
				const tagComponent = Link(`/tag/${tag.category.toLowerCase()}/${tag.name.toLowerCase()}`)
					.and(TagBlock, tag)
					.viewTransition(false)
					.appendTo(slot)

				ActionBlock()
					.style('view-type-following-action-block')
					.attachAbove()
					.addActions(tagComponent)
					.appendTo(slot)
			}
		}))
		.appendTo(tab.content)

	return tab
})

export default FollowingTagsTab
