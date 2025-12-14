import type { AuthorMetadata } from 'api.fluff4.me'
import EndpointAuthorsResolveFull from 'endpoint/authors/resolve/EndpointAuthorsResolveFull'
import Follows from 'model/Follows'
import PagedListData from 'model/PagedListData'
import Component from 'ui/Component'
import ActionBlock from 'ui/component/ActionBlock'
import Author from 'ui/component/Author'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import { Tab } from 'ui/component/core/Tabinator'
import AbortPromise from 'utility/AbortPromise'
import { NonNullish } from 'utility/Arrays'
import State from 'utility/State'

interface FollowingAuthorsTabExtensions {

}

interface FollowingAuthorsTab extends Tab, FollowingAuthorsTabExtensions { }

const FollowingAuthorsTab = Component.Builder((component, type: 'following' | 'ignoring'): FollowingAuthorsTab => {
	const tab = component.and(Tab, 'authors')
		.text.use('view/following/tab/authors')
		.extend<FollowingAuthorsTabExtensions>(tab => ({}))

	const authors = Follows.map(tab,
		manifest => manifest?.[type].author ?? [],
		(a, b) => true
			&& !!a === !!b
			&& a.length === b.length
			&& a.every(follow => b.some(follow2 => follow.author === follow2.author))
	)

	let page = 0
	Slot()
		.use(authors, AbortPromise.asyncFunction(async (signal, slot, follows) => {
			const mentions = State<AuthorMetadata[]>([])
			const authors = PagedListData(25, {
				async get (page) {
					const slice = follows.slice(page * 25, (page + 1) * 25) ?? []
					if (!slice.length)
						return null

					const response = await EndpointAuthorsResolveFull.query(undefined, { authors: slice.map(follow => follow.author).filterInPlace(NonNullish) })
					if (toast.handleError(response))
						return false

					mentions.value.push(...response.data.mentions)
					mentions.value.distinctInPlace(author => author.vanity)
					mentions.emit()
					return response.data.authors.sort((a, b) => slice.findIndex(follow => follow.author === a.vanity) - slice.findIndex(follow => follow.author === b.vanity))
				},
			})

			await authors.get(0)

			Paginator()
				.type('flush')
				.viewTransition(false)
				.set(authors, 0, (slot, authors) => {
					for (const author of authors) {
						author.description.mentions = mentions.value
						const authorComponent = Link(`/author/${author.vanity}`)
							.and(Author, author)
							.viewTransition(false)
							.appendTo(slot)

						ActionBlock()
							.attachAbove()
							.addActions(authorComponent)
							.appendTo(slot)
					}
				})
				.orElse(slot => Placeholder()
					.text.use(`view/${type}/panel/authors/empty`)
					.appendTo(slot))
				.tweak(paginator => paginator.page.asMutable?.setValue(page))
				.tweak(paginator => paginator.page.use(slot, newPage => page = newPage))
				.appendTo(slot)
		}))
		.appendTo(tab.content)

	return tab
})

export default FollowingAuthorsTab
