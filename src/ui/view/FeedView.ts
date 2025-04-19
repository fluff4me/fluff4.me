import EndpointFeedGetFollowed from 'endpoint/feed/EndpointFeedGetFollowed'
import Follows from 'model/Follows'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('feed')

		view.breadcrumbs.title.text.use('view/feed/main/title')
		view.breadcrumbs.description.text.use('view/feed/main/description')

		Link('/following')
			.and(Button)
			.type('flush')
			.setIcon('circle-check')
			.text.bind(Follows.map(view, () => quilt =>
				quilt['view/shared/info/following'](Follows.getTotalFollowing())))
			.appendTo(view.breadcrumbs.actions)

		Link('/ignoring')
			.and(Button)
			.type('flush')
			.setIcon('ban')
			.text.bind(Follows.map(view, () => quilt =>
				quilt['view/shared/info/ignoring'](Follows.getTotalIgnoring())))
			.appendTo(view.breadcrumbs.actions)

		WorkFeed()
			.viewTransition('feed-view-feed')
			.setFromEndpoint(EndpointFeedGetFollowed)
			.appendTo(view.content)

		return view
	},
})
