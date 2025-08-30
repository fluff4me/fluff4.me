import EndpointFeedGet from 'endpoint/feed/EndpointFeedGet'
import EndpointFeedGetAuthed from 'endpoint/feed/EndpointFeedGetAuthed'
import Session from 'model/Session'
import Slot from 'ui/component/core/Slot'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Env from 'utility/Env'
import State from 'utility/State'

export default ViewDefinition({
	create: () => {
		const view = View('new')

		view.breadcrumbs.title.text.use('view/new/main/title')
		view.breadcrumbs.description.text.use('view/new/main/description')

		const authedRSSURL = State<string | undefined>(undefined)
		const rssURL = State.Map(view, [authedRSSURL, Session.Auth.loggedIn], (authedRssURL, loggedIn) => _
			?? authedRssURL
			?? (loggedIn ? undefined : `${Env.API_ORIGIN}feed/get/rss.xml`)
		)

		view.breadcrumbs.setRSSButton(rssURL)

		Slot()
			.use(Session.Auth.loggedIn, (slot, loggedIn) => WorkFeed()
				.viewTransition('new-view-feed')
				.setFromEndpoint(loggedIn ? EndpointFeedGetAuthed : EndpointFeedGet)
				.tweak(feed => feed.state.use(feed, state => authedRSSURL.value = state?.rss_url))
			)
			.appendTo(view.content)

		return view
	},
})
