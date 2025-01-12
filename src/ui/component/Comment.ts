import type { Author, CommentResolved as CommentDataRaw } from 'api.fluff4.me'
import EndpointCommentAdd from 'endpoint/comment/EndpointCommentAdd'
import EndpointCommentUpdate from 'endpoint/comment/EndpointCommentUpdate'
import EndpointReactComment from 'endpoint/reaction/EndpointReactComment'
import EndpointUnreactComment from 'endpoint/reaction/EndpointUnreactComment'
import quilt from 'lang/en-nz'
import Session from 'model/Session'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Slot from 'ui/component/core/Slot'
import TextEditor from 'ui/component/core/TextEditor'
import Timestamp from 'ui/component/core/Timestamp'
import type State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

export interface CommentData extends Omit<CommentDataRaw, 'comment_id' | 'parent_id'> {
	comment_id: UUID
	parent_id?: UUID | null
	edit?: never
}

export interface CommentEditor extends Omit<Partial<CommentData>, 'edit'> {
	edit: true
}

interface CommentExtensions {

}

interface Comment extends Component, CommentExtensions { }

interface CommentDataSource {
	comments: State<(CommentData | CommentEditor)[]>
	authors: State<Author[]>
}

const Comment = Component.Builder((component, source: CommentDataSource, commentData: CommentData | CommentEditor, isRootComment?: true, noSiblings?: true): Comment => {
	const comment = component.and(Slot)
		.style('comment')
		.extend<CommentExtensions>(comment => ({}))

	const comments = source.comments.map(comment, comments =>
		comments.filter(comment => comment === commentData || comment.parent_id === commentData.comment_id))

	comment.use(comments, (slot, commentsData) => {
		if (commentData && !isRootComment) {
			const header = Component('header')
				.style('comment-header')
				.style.toggle(!!commentData.edit, 'comment-header--editing')
				.appendTo(slot)

			const author = source.authors.value.find(author => author.vanity === commentData.author)
			Link(!author?.vanity ? undefined : `/author/${author.vanity}`)
				.style('comment-header-author')
				.text.set(author?.name ?? quilt['comment/deleted/author']().toString())
				.appendTo(header)

			const time = commentData.edited_time ?? commentData.created_time
			if (time)
				Timestamp(time)
					.style('comment-header-timestamp')
					.setTranslation(!commentData.edited_time ? undefined : quilt['comment/timestamp/edited'])
					.appendTo(header)

			if (commentData.edit) {
				////////////////////////////////////
				//#region Text Editor Body

				const textEditor = TextEditor()
					.default.set(commentData.body?.body ?? '')
					.appendTo(slot)

				textEditor.content.use(header, markdown => commentData.body = { body: markdown })

				const footer = Component('footer').and(ActionRow)
					.style('comment-footer', 'comment-footer--editing')
					.appendTo(slot)

				Button()
					.text.use('comment/action/cancel')
					.event.subscribe('click', () => {
						if (commentData.created_time)
							delete (commentData as CommentDataRaw as CommentData).edit
						else
							source.comments.value.filterInPlace(comment => comment !== commentData)
						source.comments.emit()
					})
					.appendTo(footer.right)

				Button()
					.type('primary')
					.text.use('comment/action/save')
					.event.subscribe('click', async () => {
						if (!commentData.parent_id)
							return

						const response = commentData.comment_id
							? await EndpointCommentUpdate.query({
								params: { id: commentData.comment_id },
								body: { body: textEditor.useMarkdown() },
							})
							: await EndpointCommentAdd.query({
								params: { under: commentData.parent_id },
								body: { body: textEditor.useMarkdown() },
							})
						if (response instanceof Error)
							return

						const newComment = response.data

						source.comments.value.filterInPlace(comment => comment !== commentData)
						source.comments.value.push(newComment as CommentData)
						source.comments.emit()
					})
					.appendTo(footer.right)

				//#endregion
				////////////////////////////////////
			}
			else {
				////////////////////////////////////
				//#region Real Comment Body

				Component()
					.style('comment-body')
					.setMarkdownContent(commentData.body?.body ?? quilt['comment/deleted/body']().toString())
					.appendTo(slot)

				Slot()
					.use(Session.Auth.author, (slot, author) => {
						if (!author)
							return

						const footer = Component('footer')
							.style('comment-footer')
							.appendTo(slot)

						Component()
							.style('comment-footer-reaction')
							.append(
								Button()
									.style('comment-footer-reaction-button')
									.style.toggle(!!commentData.reacted, 'comment-footer-reaction-button--reacted')
									.setIcon('heart')
									.event.subscribe('click', async () => {
										if (commentData.reacted) {
											const response = await EndpointUnreactComment.query({ params: { comment_id: commentData.comment_id } })
											if (response instanceof Error)
												return

											delete commentData.reacted
											commentData.reactions ??= 0
											commentData.reactions--
											if (commentData.reactions < 0)
												delete commentData.reactions
										}
										else {
											const response = await EndpointReactComment.query({ params: { comment_id: commentData.comment_id, type: 'love' } })
											if (response instanceof Error)
												return

											commentData.reacted = true
											commentData.reactions ??= 0
											commentData.reactions++
										}

										comments.emit()
									}),
								commentData.reactions && Component()
									.style('comment-footer-reaction-count')
									.text.set(`${commentData.reactions}`),
							)
							.appendTo(footer)

						Button()
							.style('comment-footer-action')
							.type('flush')
							.text.use('comment/action/reply')
							.event.subscribe('click', () => {
								source.comments.value.unshift({ edit: true, parent_id: commentData.comment_id, author: author.vanity })
								comments.refresh()
							})
							.appendTo(footer)

						if (commentData.author === author.vanity)
							Button()
								.style('comment-footer-action')
								.type('flush')
								.text.use('comment/action/edit')
								.event.subscribe('click', () => {
									(commentData as CommentDataRaw as CommentEditor).edit = true
									comments.refresh()
								})
								.appendTo(footer)
					})
					.appendTo(slot)

				//#endregion
				////////////////////////////////////
			}
		}

		if (!commentData.comment_id || commentsData.length <= 1)
			return

		const childrenWrapper = Component()
			.style('comment-children')
			.style.toggle(!!isRootComment || (commentsData.length <= 2 && !!noSiblings), 'comment-children--flush')
			.appendTo(slot)

		const timeValue = (c: CommentData | CommentEditor) => !c.created_time ? Infinity : new Date(c.created_time).getTime()
		for (const comment of commentsData.sort((a, b) => timeValue(b) - timeValue(a))) {
			if (comment === commentData)
				continue

			const hasSiblings = commentsData.length <= 2 ? true : undefined
			Comment(source, comment, undefined, hasSiblings)
				.appendTo(childrenWrapper)
		}
	})

	return comment
})

export default Comment
