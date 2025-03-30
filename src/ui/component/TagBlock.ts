import quilt from 'lang/en-nz'
import Follows from 'model/Follows'
import Session from 'model/Session'
import type { TagsManifest } from 'model/Tags'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Heading from 'ui/component/core/Heading'
import Popover from 'ui/component/core/Popover'
import Slot from 'ui/component/core/Slot'
import FollowingBookmark from 'ui/component/FollowingBookmark'
import type { TagData } from 'ui/component/Tag'
import Tag from 'ui/component/Tag'
import AbortPromise from 'utility/AbortPromise'
import State from 'utility/State'

interface TagBlockExtensions {

}

interface TagBlock extends Block, TagBlockExtensions { }

const TagBlock = Component.Builder((component, tag: TagData, manifestIn?: TagsManifest): TagBlock => {
	const manifest = State(manifestIn)
	if (!manifest.value)
		void Tags.getManifest().then(value => manifest.value = value)

	const block = component
		.and(Block)
		.style('tag-block')
		.extend<TagBlockExtensions>(tab => ({}))

	const id = Tags.toId(tag)

	block.header.style('tag-block-header')

	FollowingBookmark(follows => follows.followingTag(id))
		.style('tag-block-following-bookmark')
		.appendTo(block.header)

	block.setActionsMenu(popover => {
		Session.Auth.loggedIn.use(popover, loggedIn => {
			if (!loggedIn)
				return

			Button()
				.type('flush')
				.bindIcon(Follows.map(popover, () => Follows.followingTag(id)
					? 'circle-check'
					: 'circle'))
				.text.bind(Follows.map(popover, () => Follows.followingTag(id)
					? quilt['tag/action/label/unfollow']()
					: quilt['tag/action/label/follow']()
				))
				.event.subscribe('click', () => Follows.toggleFollowingTag(id))
				.appendTo(popover)

			Button()
				.type('flush')
				.bindIcon(Follows.map(popover, () => Follows.ignoringTag(id)
					? 'ban'
					: 'circle'))
				.text.bind(Follows.map(popover, () => Follows.ignoringTag(id)
					? quilt['tag/action/label/unignore']()
					: quilt['tag/action/label/ignore']()
				))
				.event.subscribe('click', () => Follows.toggleIgnoringTag(id))
				.appendTo(popover)
		})
	})

	const info = Component()
		.style('tag-block-info')
		.prependTo(block.header)

	const tagComponent = Tag(tag)
		.replaceElement(document.createElement('span'))
		.style('tag-block-tag')
		.tweak(tag => tag.followingBookmark?.remove())
		.appendTo(info)

	tagComponent.categoryWrapper?.style('tag-block-tag-category')
	tagComponent.nameWrapper.style('tag-block-tag-name')

	block.content.style('tag-block-content')

	Component()
		.style('tag-block-description')
		.setMarkdownContent(tag.description)
		.appendTo(block.content)

	const RelationshipTag = (tag: TagData | string) => Tag(tag).style('tag-block-relationship')

	if (tag.aliases?.length)
		Component()
			.style('tag-block-aliases')
			.append(Heading()
				.style('tag-block-section-heading')
				.setAestheticStyle(false)
				.text.use('tag/label/aliases'))
			.append(...!tag.aliases ? [] : tag.aliases.map(RelationshipTag))
			.appendTo(block.content)

	const closestPopover = component.getStateForClosest(Popover)
	async function getTagList (tagIds: string[]) {
		const tags = await Tags.resolve(tagIds)
		if (!tags.length)
			return []

		const toAppend: Component[] = []
		const MAX_TAGS_IN_POPOVER = 4
		toAppend.push(...tags.slice(0, MAX_TAGS_IN_POPOVER).map(RelationshipTag))

		const remaining = tags.slice(MAX_TAGS_IN_POPOVER)
		if (remaining.length)
			toAppend.push(Slot()
				.if(closestPopover.falsy, slot => slot
					.append(...remaining.map(RelationshipTag))))

		return toAppend
	}

	const tagId = Tags.toId(tag)

	const relationshipsTo = manifest.mapManual(manifest => manifest?.relationships[tagId] ?? [])
	Slot().appendTo(block.content).use(relationshipsTo, AbortPromise.asyncFunction(async (signal, slot, relationships) => !relationships.length ? undefined
		: Component()
			.style('tag-block-relationships')
			.append(Heading()
				.style('tag-block-section-heading')
				.setAestheticStyle(false)
				.text.use('tag/label/relationships-to'))
			.append(...await getTagList(relationships))
	))

	const relationshipsFrom = manifest.mapManual(manifest => !manifest ? []
		: Object.entries(manifest.relationships)
			.filter(([from, to]) => to.includes(tagId))
			.map(([from]) => from)
	)
	Slot().appendTo(block.content).use(relationshipsFrom, AbortPromise.asyncFunction(async (signal, slot, relationships) => !relationships.length ? undefined
		: Component()
			.style('tag-block-relationships')
			.append(Heading()
				.style('tag-block-section-heading')
				.setAestheticStyle(false)
				.text.use('tag/label/relationships-from'))
			.append(...await getTagList(relationships))
	))

	return block
})

export default TagBlock
