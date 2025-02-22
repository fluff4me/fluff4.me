import type { Author, AuthorFull } from 'api.fluff4.me'
import quilt from 'lang/en-nz'
import Follows from 'model/Follows'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ExternalLink from 'ui/component/core/ExternalLink'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'

export default Component.Builder((component, author: Author & Partial<AuthorFull>) => {
	component
		.viewTransition('author')
		.style('author')

	const block = component.and(Block)
	block.title
		.style('author-name')
		.text.set(author.name)
	block.description
		.append(Component()
			.style('author-vanity')
			.text.set(`@${author.vanity}`))
		.append(author.pronouns && Slot()
			.text.append(' · ')
			.append(Component()
				.style('author-pronouns')
				.text.set(author.pronouns)))

	if (author.description)
		Component()
			.style('author-description')
			.append(Slot().tweak(slot => {
				const body = author.description!.body
				if (body)
					slot.setMarkdownContent(author.description)
				else
					slot.and(Placeholder).text.use('author/description/empty')
			}))
			.appendTo(block.content)

	if (author.support_link)
		ExternalLink(author.support_link)
			.style('author-support-link')
			.text.set(author.support_message || quilt['author/support-message/placeholder']())
			.appendTo(block.content)

	block.setActionsMenu(popover => {
		Session.Auth.author.use(popover, self => {
			if (self?.vanity === author.vanity) {
				Button()
					.type('flush')
					.setIcon('pencil')
					.text.use('author/action/label/edit')
					.event.subscribe('click', () => navigate.toURL('/account'))
					.appendTo(popover)
			}
			else if (Session.Auth.loggedIn.value) {
				Button()
					.type('flush')
					.bindIcon(Follows.map(popover, () => Follows.followingAuthor(author.vanity)
						? 'circle-check'
						: 'circle'))
					.text.bind(Follows.map(popover, () => Follows.followingAuthor(author.vanity)
						? quilt['author/action/label/unfollow']()
						: quilt['author/action/label/follow']()
					))
					.event.subscribe('click', () => Follows.toggleFollowingAuthor(author.vanity))
					.appendTo(popover)

				Button()
					.type('flush')
					.bindIcon(Follows.map(popover, () => Follows.ignoringAuthor(author.vanity)
						? 'ban'
						: 'circle'))
					.text.bind(Follows.map(popover, () => Follows.ignoringAuthor(author.vanity)
						? quilt['author/action/label/unignore']()
						: quilt['author/action/label/ignore']()
					))
					.event.subscribe('click', () => Follows.toggleIgnoringAuthor(author.vanity))
					.appendTo(popover)
			}
		})
	})

	return block
})
