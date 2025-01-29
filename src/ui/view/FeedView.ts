import EndpointFeedGetFollowed from 'endpoint/feed/EndpointFeedGetFollowed'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('feed')

		WorkFeed()
			.tweak(p => p.title.text.use('view/feed/main/title'))
			.viewTransition('feed-view-feed')
			.setFromEndpoint(EndpointFeedGetFollowed)
			.appendTo(view.content)

		return view
	},
})
