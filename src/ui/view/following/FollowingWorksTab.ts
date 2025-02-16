import type { Author } from 'api.fluff4.me'
import EndpointWorksResolveReferences from 'endpoint/work/EndpointWorksResolveReferences'
import Follows from 'model/Follows'
import PagedListData from 'model/PagedListData'
import Works from 'model/Works'
import Component from 'ui/Component'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import { Tab } from 'ui/component/core/Tabinator'
import Work from 'ui/component/Work'
import AbortPromise from 'utility/AbortPromise'
import { NonNullish } from 'utility/Arrays'
import State from 'utility/State'

interface FollowingWorksTabExtensions {

}

interface FollowingWorksTab extends Tab, FollowingWorksTabExtensions { }

const FollowingWorksTab = Component.Builder((component, type: 'following' | 'ignoring'): FollowingWorksTab => {
	const tab = component.and(Tab)
		.text.use('view/following/tab/works')
		.extend<FollowingWorksTabExtensions>(tab => ({}))

	const works = Follows.map(tab,
		manifest => manifest?.[type].work ?? [],
		(a, b) => true
			&& !!a === !!b
			&& a.length === b.length
			&& a.every(follow => b.some(follow2 => follow.work?.author === follow2.work?.author && follow.work?.vanity === follow2.work?.vanity))
	)

	let page = 0
	Slot()
		.use(works, AbortPromise.asyncFunction(async (signal, slot, follows) => {
			const authors = State<Author[]>([])
			const works = PagedListData(25, {
				async get (page) {
					const slice = follows.slice(page * 25, (page + 1) * 25) ?? []
					if (!slice.length)
						return null

					const response = await EndpointWorksResolveReferences.query(undefined, { works: slice.map(follow => Works.reference(follow.work)).filterInPlace(NonNullish) })
					if (toast.handleError(response))
						return false

					authors.value.push(...response.data.authors)
					authors.value.distinctInPlace(author => author.vanity)
					authors.emit()

					return response.data.works
				},
			})

			await works.get(0)

			Paginator()
				.type('flush')
				.viewTransition(false)
				.set(works, (slot, works) => {
					for (const work of works) {
						Link(`/work/${work.author}/${work.vanity}`)
							.and(Work, work, authors.value.find(author => author.vanity === work.author), true)
							.viewTransition(false)
							.appendTo(slot)
					}
				})
				.orElse(slot => Placeholder()
					.text.use(`view/${type}/panel/works/empty`)
					.appendTo(slot))
				.tweak(paginator => paginator.page.asMutable?.setValue(page))
				.tweak(paginator => paginator.page.use(slot, newPage => page = newPage))
				.appendTo(slot)
		}))
		.appendTo(tab.content)

	return tab
})

export default FollowingWorksTab
