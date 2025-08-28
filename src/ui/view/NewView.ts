import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import EndpointFeedGetAuthed from 'endpoint/feed/EndpointFeedGetAuthed'
import Session from 'model/Session'
import Slot from 'ui/component/core/Slot'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Env from 'utility/Env'

export default ViewDefinition({
	create: () => {
		const view = View('new')

		view.breadcrumbs.title.text.use('view/new/main/title')
		view.breadcrumbs.description.text.use('view/new/main/description')

		if (!Session.Auth.loggedIn.value)
			view.breadcrumbs.setRSSButton(`${Env.API_ORIGIN}feed/get/rss.xml`)

		Slot()
			.use(Session.Auth.loggedIn, (slot, loggedIn) => WorkFeed()
				.viewTransition('new-view-feed')
				.setFromEndpoint(loggedIn ? EndpointFeedGetAuthed : EndpointFeedGet)
			)
			.appendTo(view.content)

		return view
	},
})
