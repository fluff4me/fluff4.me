import EndpointAuthorsResolveReferences from 'endpoint/author/EndpointAuthorsResolveReferences'
import Follows from 'model/Follows'
import PagedListData from 'model/PagedListData'
import Component from 'ui/Component'
import Author from 'ui/component/Author'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import { Tab } from 'ui/component/core/Tabinator'
import AbortPromise from 'utility/AbortPromise'
import { NonNullish } from 'utility/Arrays'

interface FollowingAuthorsTabExtensions {

}

interface FollowingAuthorsTab extends Tab, FollowingAuthorsTabExtensions { }

const FollowingAuthorsTab = Component.Builder((component, type: 'following' | 'ignoring'): FollowingAuthorsTab => {
	const tab = component.and(Tab)
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
			const authors = PagedListData(25, {
				async get (page) {
					const slice = follows.slice(page * 25, (page + 1) * 25) ?? []
					if (!slice.length)
						return null

					const response = await EndpointAuthorsResolveReferences.query(undefined, { authors: slice.map(follow => follow.author).filterInPlace(NonNullish) })
					if (toast.handleError(response))
						return false

					return response.data
				},
			})

			await authors.get(0)

			Paginator()
				.type('flush')
				.viewTransition(false)
				.set(authors, (slot, authors) => {
					for (const author of authors) {
						Link(`/author/${author.vanity}`)
							.and(Author, author)
							.viewTransition(false)
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
