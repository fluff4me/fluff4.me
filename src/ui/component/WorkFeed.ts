import type { Author, Feed, Work as WorkData } from 'api.fluff4.me'
import type { PreparedPaginatedQueryReturning } from 'endpoint/Endpoint'
import PagedListData from 'model/PagedListData'
import Component from 'ui/Component'
import Link from 'ui/component/core/Link'
import Paginator2 from 'ui/component/core/Paginator2'
import Work from 'ui/component/Work'
import State from 'utility/State'

interface WorkFeedExtensions {
	setFromEndpoint (endpoint: PreparedPaginatedQueryReturning<Feed>): this
	setFromWorks (pagedData: PagedListData<WorkData>, authors: Author[]): this
}

interface WorkFeed extends Paginator2, WorkFeedExtensions { }

const WorkFeed = Component.Builder((component): WorkFeed => {
	const paginator = component.and(Paginator2)
		.type('flush')

	const set = paginator.set

	const feed = paginator.extend<WorkFeedExtensions>(feed => ({
		setFromEndpoint (endpoint) {
			const authors = State<Author[]>([])
			const data = PagedListData(endpoint.getPageSize?.() ?? 25, {
				async get (page) {
					const response = await endpoint.query(undefined, { page })
					if (toast.handleError(response))
						return false

					if (!Array.isArray(response.data) || response.data.length) {
						authors.value.push(...response.data.authors)
						authors.value.distinctInPlace(author => author.vanity)
						authors.emit()
						return response.data.works
					}

					return null
				},
			})
			feed.setFromWorks(data.resized(3), authors.value)
			return feed
		},
		setFromWorks (pagedData, authors) {
			set(pagedData, (slot, works) => {
				for (const workData of works) {
					const author = authors.find(author => author.vanity === workData.author)
					Link(author && `/work/${author.vanity}/${workData.vanity}`)
						.and(Work, workData, author, true)
						.viewTransition()
						.appendTo(slot)
				}
			})
			return feed
		},
	}))

	paginator.orElse(slot => Component()
		.style('placeholder')
		.text.use('work-feed/empty')
		.appendTo(slot))

	return feed
})

export default WorkFeed
