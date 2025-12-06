import EndpointCommentGetAllChapter from 'endpoint/comment/EndpointCommentGetAllChapter'
import EndpointCommentGetAllWork from 'endpoint/comment/EndpointCommentGetAllWork'
import PagedData from 'model/PagedData'
import Session from 'model/Session'
import type { CommentListPageData } from 'ui/component/CommentList'
import CommentList, { ContextualComment } from 'ui/component/CommentList'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

interface ManageCommentsViewParams {
	tab?: string
	page?: string
}

export default ViewDefinition({
	create (params?: ManageCommentsViewParams) {
		if (!Session.Auth.privileged.ModerationViewComments.value) {
			void navigate.toURL('/')
			return
		}

		const view = View('manage-comments')

		const tabinator = Tabinator()
			.appendTo(view.content)

		const comments = PagedData.fromEndpoint(EndpointCommentGetAllChapter.prep())
			.map((page): CommentListPageData => ({
				...page,
				comments: page.comments.map(ContextualComment.fromRaw),
			}))
		Tab('comments')
			.text.use('view/manage-comments/tab/comments')
			.setIcon('comment')
			.tweak(tab => tab.content
				.append(CommentList()
					.viewTransition('author-view-comments')
					.set({ data: comments })
				))
			.addTo(tabinator)

		const recommendations = PagedData.fromEndpoint(EndpointCommentGetAllWork.prep())
			.map((page): CommentListPageData => ({
				...page,
				comments: page.comments.map(ContextualComment.fromRaw),
			}))
		Tab('recommendations')
			.text.use('view/manage-comments/tab/recommendations')
			.setIcon('heart')
			.tweak(tab => tab.content
				.append(CommentList()
					.viewTransition('author-view-comments')
					.set({ data: recommendations })
				))
			.addTo(tabinator)

		tabinator.bindURL(params?.tab, tab => tab && tab !== 'comments' ? `/manage/comments/${tab}` : '/manage/comments')

		return view
	},
})
