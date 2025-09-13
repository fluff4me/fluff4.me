import type { AuthorMetadata, FeedResponse, WorkMetadata } from 'api.fluff4.me'
import type { PreparedPaginatedQueryReturning } from 'endpoint/Endpoint'
import PagedListData from 'model/PagedListData'
import Component from 'ui/Component'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Work from 'ui/component/Work'
import State from 'utility/State'

type PageHandler = (page: number) => unknown
interface WorkFeedExtensions {
	readonly state: State<FeedResponse | undefined>
	setFromEndpoint (endpoint: PreparedPaginatedQueryReturning<FeedResponse>): this
	setFromWorks (pagedData: PagedListData<WorkMetadata>, authors: AuthorMetadata[]): this
	setPageHandler (handler?: PageHandler): this
}

interface WorkFeed extends Paginator, WorkFeedExtensions { }

const WorkFeed = Component.Builder((component): WorkFeed => {
	const paginator = component.and(Paginator)
		.type('flush')

	const set = paginator.set

	const state = State<FeedResponse | undefined>(undefined)

	let pageHandler: PageHandler | undefined

	const feed = paginator.extend<WorkFeedExtensions>(feed => ({
		state,
		setPageHandler (handler) {
			pageHandler = handler
			return feed
		},
		setFromEndpoint (endpoint) {
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
			feed.setFromWorks(data/* .resized(3)*/, authors.value)
			return feed
		},
		setFromWorks (pagedData, authors) {
			set(pagedData, (slot, works, page) => {
				pageHandler?.(page)

				for (const workData of works) {
					const author = authors.find(author => author.vanity === workData.author)
					Link(author && `/work/${author.vanity}/${workData.vanity}`)
						.and(Work, workData, author, true)
						.viewTransition(false)
						.appendTo(slot)
				}
			})
			return feed
		},
	}))

	paginator.orElse(slot => Component()
		.style('placeholder')
		.text.use('feed/empty')
		.appendTo(slot))

	return feed
})

export default WorkFeed
