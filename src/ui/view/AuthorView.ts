import type { AuthorComment } from 'api.fluff4.me'
import EndpointAuthorGet from 'endpoint/author/EndpointAuthorGet'
import EndpointCommentGetAllAuthor from 'endpoint/comment/EndpointCommentGetAllAuthor'
import EndpointWorkGetAllAuthor from 'endpoint/work/EndpointWorkGetAllAuthor'
import PagedData from 'model/PagedData'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import Component from 'ui/Component'
import Author from 'ui/component/Author'
import type { CommentData } from 'ui/component/Comment'
import Comment from 'ui/component/Comment'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Slot from 'ui/component/core/Slot'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import Work from 'ui/component/Work'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import State from 'utility/State'

interface AuthorViewParams {
	vanity: string
	tab?: string
}

export default ViewDefinition({
	async load (params: AuthorViewParams) {
		const response = await EndpointAuthorGet.query({ params })
		if (response instanceof Error)
			throw response

		const author = response.data
		return { author }
	},
	create (params: AuthorViewParams, { author }) {
		const view = View('author')

		Author(author)
			.viewTransition('author-view-author')
			.setContainsHeading()
			.appendTo(view.content)

		const contentTabinator = author.comments_privated && Session.Auth.author.value?.vanity !== author.vanity ? undefined
			: Tabinator()
				.appendTo(view.content)

		const worksTab = contentTabinator && Tab('works')
			.setIcon('book')
			.text.use('view/author/works/title')
			.addTo(contentTabinator)

		const works = PagedListData.fromEndpoint(25, EndpointWorkGetAllAuthor.prep({
			params: {
				author: params.vanity,
			},
		}))
		Paginator()
			.viewTransition('author-view-works')
			.tweak(p => p.title.text.use('view/author/works/title'))
			// .setActionsMenuButton()
			.setActionsMenu(popover => popover
				.append(Slot()
					.if(Session.Auth.author.map(popover, author => author?.vanity === params.vanity), () => Button()
						.type('flush')
						.setIcon('plus')
						.text.use('view/author/works/action/label/new')
						.event.subscribe('click', () => navigate.toURL('/work/new'))))
			)
			.set(works, 0, (slot, works) =>
				slot.append(...works.map(workData =>
					Link(`/work/${author.vanity}/${workData.vanity}`)
						.and(Work, workData, author)
						.viewTransition(false)
						.type('flush')
						.appendTo(slot))))
			.orElse(slot => Block()
				.type('flush')
				.tweak(block => Component()
					.style('placeholder')
					.text.use('view/author/works/content/empty')
					.appendTo(block.content))
				.appendTo(slot))
			.appendTo(worksTab?.content ?? view.content)

		if (contentTabinator)
			Tab('comments')
				.setIcon('comment')
				.text.use(quilt => quilt['view/author/comments/title'](author.comments_privated))
				.tweak(tab => {
					const GetCommentData = (comment: AuthorComment): CommentData => ({ ...comment.comment as CommentData, author: author.vanity })

					const comments = PagedData.fromEndpoint(EndpointCommentGetAllAuthor.prep(
						{
							params: {
								vanity: params.vanity,
							},
						},
						{
							filter: 'chapter',
						},
					))
					Paginator()
						.viewTransition('author-view-comments')
						.style('view-type-author-comment-paginator')
						.tweak(p => p.content
							.style('view-type-author-comment-paginator-content')
						)
						// .tweak(p => p.title.text.use('view/author/comments/title'))
						.set(comments, 0, (slot, { comments, authors, works, chapters }) =>
							slot.append(...comments.map(commentData =>
								Comment(
									{
										threadAuthor: '@',
										comments: State(comments.map(GetCommentData)),
										authors: State([author]),
									},
									GetCommentData(commentData),
									{
										context: {
											root_object: commentData.root_object,
											is_reply: commentData.is_reply || undefined,
											authors,
											works,
											chapters,
										},
									},
								)
									.style('view-type-author-comment')
									.appendTo(slot)
							)))
						.orElse(slot => Block()
							.type('flush')
							.tweak(block => Component()
								.style('placeholder')
								.text.use('view/author/comments/content/empty')
								.appendTo(block.content))
							.appendTo(slot))
						.appendTo(tab.content)
				})
				.addTo(contentTabinator)

		contentTabinator?.bindURL(params.tab, tab => tab && tab !== 'works' ? `/author/${params.vanity}/${tab}` : `/author/${params.vanity}`)

		return view
	},
})
