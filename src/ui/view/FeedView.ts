import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import Component from 'ui/Component'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Work from 'ui/component/Work'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: async () => {
		const view = View('feed')

		const paginator = Paginator()
			.viewTransition('author-view-feed')
			.type('flush')
			.tweak(p => p.title.text.use('view/feed/main/title'))
			.appendTo(view)
		const endpoint = EndpointFeedGet.prep().setPageSize(3)
		await paginator.useEndpoint(endpoint, (slot, { works, authors }) => {
			for (const workData of works) {
				const author = authors.find(author => author.vanity === workData.author)
				Link(author && `/work/${author.vanity}/${workData.vanity}`)
					.and(Work, workData, author, true)
					.viewTransition()
					.appendTo(slot)
			}
		})
		paginator.orElse(slot => Component()
			.style('placeholder')
			.text.use('view/feed/content/empty')
			.appendTo(slot))

		return view
	},
})
