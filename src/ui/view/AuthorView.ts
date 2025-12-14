import type { ContextualComment } from 'api.fluff4.me'
import EndpointAuthors$authorVanity from 'endpoint/authors/EndpointAuthors$authorVanity'
import EndpointCommentsAuthor$authorVanityChapter from 'endpoint/comments/author/$author_vanity/EndpointCommentsAuthor$authorVanityChapter'
import EndpointCommentsAuthor$authorVanityWork from 'endpoint/comments/author/$author_vanity/EndpointCommentsAuthor$authorVanityWork'
import EndpointWorks$authorVanity from 'endpoint/works/EndpointWorks$authorVanity'
import PagedData from 'model/PagedData'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import ActionBlock from 'ui/component/ActionBlock'
import Author from 'ui/component/Author'
import type { CommentData } from 'ui/component/Comment'
import type { CommentListPageData } from 'ui/component/CommentList'
import CommentList from 'ui/component/CommentList'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import WorkFeed from 'ui/component/WorkFeed'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import State from 'utility/State'

interface AuthorViewParams {
	author_vanity: string
	tab?: string
}

export default ViewDefinition({
	async load (params: AuthorViewParams) {
		const response = await EndpointAuthors$authorVanity.query({ params })
		if (response instanceof Error)
			throw response

		const author = response.data
		return { author }
	},
	create (params: AuthorViewParams, { author }) {
		const view = View('author')

		const isSelf = Session.Auth.loggedInAs(view, author.vanity)

		const authorComponent = Author(author)
			.viewTransition('author-view-author')
			.setContainsHeading()
			.appendTo(view.content)

		ActionBlock()
			.viewTransition('author-view-author-actions')
			.attachAbove()
			.addActions(authorComponent)
			.appendTo(view.content)

		const contentTabinator = author.comments_privated && Session.Auth.author.value?.vanity !== author.vanity ? undefined
			: Tabinator()
				.appendTo(view.content)

		const worksTab = contentTabinator && Tab('works')
			.setIcon('book')
			.text.use('view/author/works/title')
			.addTo(contentTabinator)

		ActionRow()
			.tweak(row => Button()
				.type('primary')
				.text.use('view/author/works/action/label/new')
				.setIcon('plus')
				.event.subscribe('click', () => navigate.toURL('/work/new'))
				.appendTo(row.right)
			)
			.appendToWhen(isSelf, worksTab?.content ?? view.content)

		const works = PagedListData.fromEndpoint(25, EndpointWorks$authorVanity.prep({
			params: {
				author_vanity: params.author_vanity,
			},
		}))
		WorkFeed()
			.viewTransition('author-view-works')
			.setFromWorks(works, State([author]))
			.setPlaceholder(placeholder => placeholder
				.removeContents()
				.and(Block)
				.tweak(block => block.content.text.use('view/author/works/content/empty'))
			)
			.appendTo(worksTab?.content ?? view.content)

		if (contentTabinator)
			Tab('recommendations')
				.setIcon('heart')
				.text.use('view/author/recommendations/title')
				.tweak(tab => {
					const GetCommentData = (comment: ContextualComment): CommentData => ({ ...comment.comment as CommentData, author: author.vanity })

					const comments = PagedData.fromEndpoint(EndpointCommentsAuthor$authorVanityWork.prep(
						{
							params: {
								author_vanity: params.author_vanity,
							},
						},
					)).map((authorComments): CommentListPageData => ({
						comments: authorComments.comments.map(comment => ({
							data: GetCommentData(comment),
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
						.viewTransition('author-view-recommendations')
						.set({ data: comments, placeholder: placeholder => placeholder.text.use('view/author/recommendations/content/empty') })
						.appendTo(tab.content)
				})
				.addTo(contentTabinator)

		if (contentTabinator)
			Tab('comments')
				.setIcon('comment')
				.text.use(quilt => quilt['view/author/comments/title'](author.comments_privated))
				.tweak(tab => {
					const GetCommentData = (comment: ContextualComment): CommentData => ({ ...comment.comment as CommentData, author: author.vanity })

					const comments = PagedData.fromEndpoint(EndpointCommentsAuthor$authorVanityChapter.prep(
						{
							params: {
								author_vanity: params.author_vanity,
							},
						},
					)).map((authorComments): CommentListPageData => ({
						comments: authorComments.comments.map(comment => ({
							data: GetCommentData(comment),
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
						.viewTransition('author-view-comments')
						.set({ data: comments, placeholder: placeholder => placeholder.text.use('view/author/comments/content/empty') })
						.appendTo(tab.content)
				})
				.addTo(contentTabinator)

		contentTabinator?.bindURL(params.tab, tab => tab && tab !== 'works' ? `/author/${params.author_vanity}/${tab}` : `/author/${params.author_vanity}`)

		return view
	},
})
