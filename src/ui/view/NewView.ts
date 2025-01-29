import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('new')

		view.breadcrumbs.title.text.use('view/new/main/title')
		view.breadcrumbs.description.text.use('view/new/main/description')

		WorkFeed()
			.viewTransition('new-view-feed')
			.setFromEndpoint(EndpointFeedGet)
			.appendTo(view.content)

		return view
	},
})
