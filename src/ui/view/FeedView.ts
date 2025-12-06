import EndpointCommentGetAllUnderWork from 'endpoint/comment/EndpointCommentGetAllUnderWork'
import EndpointFeedGetFollowed from 'endpoint/feed/EndpointFeedGetFollowed'
import Follows from 'model/Follows'
import PagedData from 'model/PagedData'
import type { CommentData } from 'ui/component/Comment'
import type { CommentListPageData, ContextualComment } from 'ui/component/CommentList'
import CommentList from 'ui/component/CommentList'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import WorkFeed from 'ui/component/WorkFeed'
import DynamicDestination from 'ui/utility/DynamicDestination'
import Viewport from 'ui/utility/Viewport'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import State from 'utility/State'

export default ViewDefinition({
	create: () => {
		const view = View('feed')

		view.breadcrumbs.title.text.use('view/feed/main/title')
		view.breadcrumbs.description.text.use('view/feed/main/description')

		const rssURL = State<string | undefined>(undefined)

		view.breadcrumbs.setRSSButton(rssURL)

		Link('/following')
			.and(Button)
			.type('flush')
			.style('breadcrumbs-actions-action')
			.setIcon('bookmark')
			.text.bind(Follows.map(view, () => quilt =>
				quilt['view/shared/info/following'](Follows.getTotalFollowing())))
			.appendTo(view.breadcrumbs.actions)

		Link('/ignoring')
			.and(Button)
			.type('flush')
			.style('breadcrumbs-actions-action')
			.setIcon('eye-slash')
			.text.bind(Follows.map(view, () => quilt =>
				quilt['view/shared/info/ignoring'](Follows.getTotalIgnoring())))
			.appendTo(view.breadcrumbs.actions)

		const tabletMode = Viewport.tablet

		const tabinator = Tabinator()
			.viewTransition('work-view-tabinator')
			.tweak(tabinator => tabinator.header.prependToWhen(tabletMode.truthy, tabinator))
			.appendTo(view.content)

		const worksTab = Tab('works')
			.text.use('view/feed/works/title')
			.addTo(tabinator)

		WorkFeed()
			.viewTransition('feed-view-feed')
			.setFromEndpoint(EndpointFeedGetFollowed)
			.tweak(feed => feed.state.use(feed, state => rssURL.value = state?.rss_url))
			.appendTo(worksTab.content)

		const recommendationsTab = Tab('recommendations')
			.text.use('view/feed/recommendations/title')
			.addToWhen(tabletMode.truthy, tabinator)

		const comments = PagedData.fromEndpoint(EndpointCommentGetAllUnderWork.prep(undefined, { following_only: true }))
			.map((authorComments): CommentListPageData => ({
				comments: authorComments.comments.map((comment): ContextualComment => ({
					data: comment.comment as CommentData,
					metadata: {
						context: {
							root_object: comment.root_object,
							is_reply: comment.is_reply || undefined,
						},
					},
				})),
				authors: authorComments.authors,
				works: authorComments.works,
				chapters: authorComments.chapters,
			}))
		CommentList()
			.viewTransition('feed-view-comments')
			.tweak(list => list.paginator.style('view-type-work-comment-block'))
			.tweak(list => list.paginator.header.style('view-type-work-comment-block-header'))
			.tweak(list => list.paginator.title
				.setAestheticLevel(4)
				.text.use('view/feed/recommendations/title')
			)
			.set({ data: comments, placeholder: placeholder => placeholder.text.use('view/feed/recommendations/content/empty') })
			.appendTo(DynamicDestination(view)
				.addDestination('tab', recommendationsTab.content)
				.addDestination('sidebar', view.sidebar)
				.setStrategy(tabletMode.map(view, tabletMode => tabletMode ? 'tab' : 'sidebar'))
			)

		return view
	},
})
