import type { AuthorMetadata, FeedResponse, WorkMetadata } from 'api.fluff4.me'
import type { PreparedPaginatedQueryReturning } from 'endpoint/Endpoint'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import Component from 'ui/Component'
import ActionBlock from 'ui/component/ActionBlock'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Slot from 'ui/component/core/Slot'
import Work from 'ui/component/Work'
import State from 'utility/State'

type PageHandler = (page: number) => unknown
interface WorkFeedExtensions {
	readonly state: State<FeedResponse | undefined>
	setFromEndpoint (endpoint: PreparedPaginatedQueryReturning<FeedResponse>, page?: number): this
	setFromWorks (pagedData: PagedListData<WorkMetadata>, authors: State<AuthorMetadata[]>, page?: number): this
	setPageHandler (handler?: PageHandler): this
	setPlaceholder (initialiser: (placeholder: Component) => unknown): this
}

interface WorkFeed extends Paginator, WorkFeedExtensions { }

const WorkFeed = Component.Builder((component): WorkFeed => {
	const paginator = component.and(Paginator)
		.type('flush')

	const state = State<FeedResponse | undefined>(undefined)

	let pageHandler: PageHandler | undefined
	let placeholderInitialiser: ((placeholder: Component) => unknown) | undefined

	const feed = paginator.extend<WorkFeedExtensions>(feed => ({
		state,
		setPageHandler (handler) {
			pageHandler = handler
			return feed
		},
		setFromEndpoint (endpoint, page) {
			const authors = State<AuthorMetadata[]>([])
			const data = PagedListData(endpoint.getPageSize?.() ?? 25, {
				async get (page) {
					const response = await endpoint.query(undefined, { page })
					state.value = undefined
					if (toast.handleError(response))
						return false

					if (response.data) {
						state.value = response.data
						authors.value.push(...response.data.authors)
						authors.value.distinctInPlace(author => author.vanity)
						authors.emit()
						return response.data.works
					}

					return null
				},
			})
			feed.setFromWorks(data/* .resized(3)*/, authors, page)
			return feed
		},
		setFromWorks (pagedData, authors, page = 0) {
			paginator.set(pagedData, page, (slot, works, page) => {
				pageHandler?.(page)

				for (const workData of works) {
					const author = authors.value.find(author => author.vanity === workData.author_vanity)
					const workCard = Link(author && `/work/${author.vanity}/${workData.work_vanity}`)
						.and(Work, workData, author, true)
						.viewTransition(false)
						.appendTo(slot)

					Slot().appendTo(slot).if(Session.Auth.loggedInAs(slot, workData.author_vanity), slot => ActionBlock()
						.attachAbove()
						.addActions(workCard)
					)
				}
			})
			return feed
		},
		setPlaceholder (initialiser) {
			placeholderInitialiser = initialiser
			return feed
		},
	}))

	paginator.orElse(slot => Component()
		.style('placeholder')
		.text.use('feed/empty')
		.tweak(placeholderInitialiser)
		.appendTo(slot))

	return feed
})

export default WorkFeed
