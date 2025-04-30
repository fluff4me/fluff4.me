import type { Tag as TagData } from 'api.fluff4.me'
import type { TagsManifestCategory } from 'model/Tags'
import Tags from 'model/Tags'
import type { ComponentEvents } from 'ui/Component'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Draggable from 'ui/component/core/ext/Draggable'
import Link from 'ui/component/core/Link'
import FollowingBookmark from 'ui/component/FollowingBookmark'
import BrowserListener from 'ui/utility/BrowserListener'
import type { EventHandler } from 'ui/utility/EventManipulator'

export { TagData }

interface TagExtensions {
	readonly categoryWrapper?: Component
	readonly nameWrapper: Component
	readonly followingBookmark?: FollowingBookmark
	readonly tag: TagData | string
	addDeleteButton (handler: EventHandler<Button, ComponentEvents, 'click'>): this
}

interface Tag extends Component, TagExtensions { }

const toURLRegex = /\W+/g
const toURL = (name: string) => name.replaceAll(toURLRegex, '-').toLowerCase()
const Tag = Object.assign(
	Component.Builder('a', (component, tag: TagData | string): Tag & Link => {
		if (component.tagName === 'A')
			component.and(Link, typeof tag === 'string' ? undefined /* `/tag/${tag}` */ : `/tag/${toURL(tag.category)}/${toURL(tag.name)}`)

		component
			.and(Button)
			.style('tag')
			.style.toggle(typeof tag === 'string', 'tag-custom')
			.style.toggle(typeof tag !== 'string', 'tag-global')

		const followingBookmark = typeof tag === 'string'
			? undefined
			: FollowingBookmark(follows => follows.followingTag(Tags.toId(tag))).tweak(bookmark => bookmark
				.style('tag-following-bookmark')
				.style.bind(component.hoveredOrFocused, 'tag-following-bookmark--active')
				.style.bind(BrowserListener.isWebkit, 'tag-following-bookmark--webkit')
				.appendTo(component
					.style.bind(bookmark.isFollowing, 'tag--has-following-bookmark')
				))

		const categoryWrapper = typeof tag === 'string'
			? undefined
			: Component()
				.style('tag-category')
				.text.set(tag.category)
				.appendTo(component)

		const nameWrapper = Component()
			.style('tag-name')
			.text.set(typeof tag === 'string' ? tag : tag.name)
			.appendTo(component)

		const unuseSupers = component.supers.useManual(() => {
			if (!component.is(Draggable))
				return

			unuseSupers()
			component.style.bind(component.dragging, 'tag--dragging')
		})

		return component.extend<TagExtensions>(component => ({
			tag,
			categoryWrapper,
			nameWrapper,
			followingBookmark,
			addDeleteButton (handler) {
				component.style('tag--has-delete-button')
				followingBookmark?.style('tag-following-bookmark--has-delete-button')
				Button()
					.style('tag-delete-button')
					.setIcon('xmark')
					.event.subscribe('click', handler)
					.appendTo(component)
				return component
			},
		})) as Tag & Link
	}),
	{
		Category: Component
			.Builder('button', (component, category: TagsManifestCategory): Tag =>
				component.and(Tag, { category: category.name, name: '...', description: { body: category.description }, is_mature: false }))
			.setName('TagCategory'),
	}
)
export default Tag
