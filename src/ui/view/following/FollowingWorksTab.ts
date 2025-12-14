import type { AuthorMetadata } from 'api.fluff4.me'
import EndpointWorksResolve from 'endpoint/works/EndpointWorksResolve'
import Follows from 'model/Follows'
import PagedListData from 'model/PagedListData'
import Works from 'model/Works'
import Component from 'ui/Component'
import ActionBlock from 'ui/component/ActionBlock'
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
	const tab = component.and(Tab, 'works')
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
			const authors = State<AuthorMetadata[]>([])
			const works = PagedListData(25, {
				async get (page) {
					const slice = follows.slice(page * 25, (page + 1) * 25) ?? []
					if (!slice.length)
						return null

					const response = await EndpointWorksResolve.query(undefined, { works: slice.map(follow => Works.reference(follow.work)).filterInPlace(NonNullish) })
					if (toast.handleError(response))
						return false

					authors.value.push(...response.data.authors)
					authors.value.distinctInPlace(author => author.vanity)
					authors.emit()

					return response.data.works.sort((a, b) => slice.findIndex(follow => follow.work?.author === a.author && follow.work?.vanity === a.vanity) - slice.findIndex(follow => follow.work?.author === b.author && follow.work?.vanity === b.vanity))
				},
			})

			await works.get(0)

			Paginator()
				.type('flush')
				.viewTransition(false)
				.set(works, 0, (slot, works) => {
					for (const work of works) {
						const workComponent = Link(`/work/${work.author}/${work.vanity}`)
							.and(Work, work, authors.value.find(author => author.vanity === work.author), true)
							.viewTransition(false)
							.appendTo(slot)

						ActionBlock()
							.attachAbove()
							.addActions(workComponent)
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
