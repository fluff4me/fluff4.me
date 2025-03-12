import type { Author as AuthorData, AuthorFull } from 'api.fluff4.me'
import EndpointAuthorGet from 'endpoint/author/EndpointAuthorGet'
import quilt from 'lang/en-nz'
import Follows from 'model/Follows'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ExternalLink from 'ui/component/core/ExternalLink'
import Loading from 'ui/component/core/Loading'
import Placeholder from 'ui/component/core/Placeholder'
import Popover from 'ui/component/core/Popover'
import Slot from 'ui/component/core/Slot'
import Async from 'utility/Async'
import State from 'utility/State'

interface AuthorExtensions {
	loadFull (): Promise<void>
}

interface Author extends Block, AuthorExtensions { }

const Author = Component.Builder((component, authorIn: AuthorData & Partial<AuthorFull>): Author => {
	const author = State(authorIn)

	component
		.viewTransition('author')
		.style('author')

	const block = component.and(Block)
	block.title
		.style('author-name')
		.text.set(author.value.name)
	block.description
		.append(Component()
			.style('author-vanity')
			.text.set(`@${author.value.vanity}`))
		.append(author.value.pronouns && Slot()
			.text.append(' · ')
			.append(Component()
				.style('author-pronouns')
				.text.set(author.value.pronouns)))

	const loading = Loading()
		.appendTo(block.content)

	loading.enabled.value = false

	Slot()
		.use(author, (slot, author) => author.description
			&& Component()
				.style('author-description')
				.append(Slot().tweak(slot => {
					const body = author.description!.body
					if (body)
						slot.setMarkdownContent(author.description)
					else
						slot.and(Placeholder).text.use('author/description/empty')
				}))
		)
		.appendTo(block.content)

	Slot()
		.use(author, (slot, author) => author.support_link
			&& ExternalLink(author.support_link)
				.style('author-support-link')
				.text.set(author.support_message || quilt['author/support-message/placeholder']())
		)
		.appendTo(block.content)

	if (!component.is(Popover))
		block.setActionsMenu(popover => {
			Session.Auth.author.use(popover, self => {
				if (self?.vanity === author.value.vanity) {
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
						.bindIcon(Follows.map(popover, () => Follows.followingAuthor(author.value.vanity)
							? 'circle-check'
							: 'circle'))
						.text.bind(Follows.map(popover, () => Follows.followingAuthor(author.value.vanity)
							? quilt['author/action/label/unfollow']()
							: quilt['author/action/label/follow']()
						))
						.event.subscribe('click', () => Follows.toggleFollowingAuthor(author.value.vanity))
						.appendTo(popover)

					Button()
						.type('flush')
						.bindIcon(Follows.map(popover, () => Follows.ignoringAuthor(author.value.vanity)
							? 'ban'
							: 'circle'))
						.text.bind(Follows.map(popover, () => Follows.ignoringAuthor(author.value.vanity)
							? quilt['author/action/label/unignore']()
							: quilt['author/action/label/ignore']()
						))
						.event.subscribe('click', () => Follows.toggleIgnoringAuthor(author.value.vanity))
						.appendTo(popover)
				}
			})
		})

	let loadedFull = false
	return block.extend<AuthorExtensions>(block => ({
		async loadFull () {
			if (loadedFull || loading.enabled.value)
				return

			if (author.value.description) {
				loadedFull = true
				author.emit()
				return
			}

			loading.enabled.value = true
			await Async.sleep(1000)
			const response = await EndpointAuthorGet.query({ params: author.value })
			loading.enabled.value = false
			if (response instanceof Error)
				return

			loadedFull = true
			Object.assign(author.value, response.data)
			author.emit()
		},
	}))
})

export default Author
