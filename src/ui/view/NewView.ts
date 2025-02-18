import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import EndpointFeedGetAuthed from 'endpoint/feed/EndpointFeedGetAuthed'
import Session from 'model/Session'
import Slot from 'ui/component/core/Slot'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('new')

		view.breadcrumbs.title.text.use('view/new/main/title')
		view.breadcrumbs.description.text.use('view/new/main/description')

		Slot()
			.use(Session.Auth.loggedIn, loggedIn => WorkFeed()
				.viewTransition('new-view-feed')
				.setFromEndpoint(loggedIn ? EndpointFeedGetAuthed : EndpointFeedGet)
			)
			.appendTo(view.content)

		return view
	},
})
