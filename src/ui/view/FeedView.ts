import EndpointFeedGetFollowed from 'endpoint/feed/EndpointFeedGetFollowed'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('feed')

		view.breadcrumbs.title.text.use('view/feed/main/title')
		view.breadcrumbs.description.text.use('view/feed/main/description')

		WorkFeed()
			.viewTransition('feed-view-feed')
			.setFromEndpoint(EndpointFeedGetFollowed)
			.appendTo(view.content)

		return view
	},
})
