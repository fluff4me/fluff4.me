import type { Tag as TagData } from 'api.fluff4.me'
import type { TagsManifestCategory } from 'model/Tags'
import type { ComponentEvents } from 'ui/Component'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Draggable from 'ui/component/core/ext/Draggable'
import Link from 'ui/component/core/Link'
import type { EventHandler } from 'ui/utility/EventManipulator'

export { TagData }

interface TagExtensions {
	tag: TagData | string
	addDeleteButton (handler: EventHandler<Button, ComponentEvents, 'click'>): this
}

interface Tag extends Component, TagExtensions { }

const toURLRegex = /\W+/g
const toURL = (name: string) => name.replaceAll(toURLRegex, '-').toLowerCase()
const Tag = Object.assign(
	Component.Builder('a', (component, tag: TagData | string): Tag & Link => {
		if (component.tagName === 'A')
			component.and(Link, typeof tag === 'string' ? `/tag/${tag}` : `/tag/${toURL(tag.category)}/${toURL(tag.name)}`)

		component
			.and(Button)
			.style('tag')
			.style.toggle(typeof tag === 'string', 'tag-custom')
			.style.toggle(typeof tag !== 'string', 'tag-global')

		if (typeof tag !== 'string')
			Component()
				.style('tag-category')
				.text.set(tag.category)
				.appendTo(component)

		Component()
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
			addDeleteButton (handler) {
				Button()
					.style('tag-delete-button')
					.event.subscribe('click', handler)
					.appendTo(component)
				return component
			},
		})) as Tag & Link
	}),
	{
		Category: Component
			.Builder('button', (component, category: TagsManifestCategory): Tag =>
				component.and(Tag, { category: category.name, name: '...', description: { body: category.description } }))
			.setName('TagCategory'),
	}
)
export default Tag
