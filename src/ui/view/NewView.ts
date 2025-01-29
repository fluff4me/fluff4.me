import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('new')

		WorkFeed()
			.tweak(p => p.title.text.use('view/new/main/title'))
			.viewTransition('new-view-feed')
			.setFromEndpoint(EndpointFeedGet)
			.appendTo(view.content)

		return view
	},
})
