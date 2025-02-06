import quilt from 'lang/en-nz'
import Follows from 'model/Follows'
import Session from 'model/Session'
import Tags from 'model/Tags'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import type { TagData } from 'ui/component/Tag'
import Tag from 'ui/component/Tag'

interface TagBlockExtensions {

}

interface TagBlock extends Block, TagBlockExtensions { }

const TagBlock = Component.Builder((component, tag: TagData): TagBlock => {
	const block = component
		.and(Block)
		.style('tag-block')
		.extend<TagBlockExtensions>(tab => ({}))

	const id = Tags.toId(tag)

	block.header.style('tag-block-header')

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
		.appendTo(info)

	tagComponent.categoryWrapper?.style('tag-block-tag-category')
	tagComponent.nameWrapper.style('tag-block-tag-name')

	Component()
		.style('tag-block-description')
		.setMarkdownContent(tag.description)
		.appendTo(block.content)

	return block
})

export default TagBlock
