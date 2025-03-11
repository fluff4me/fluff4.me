import type { Author } from 'api.fluff4.me'
import EndpointCommentGetAllUnder from 'endpoint/comment/EndpointCommentGetAllUnder'
import type { EndpointReturn } from 'endpoint/Endpoint'
import Session from 'model/Session'
import Component from 'ui/Component'
import type { CommentData, CommentEditor } from 'ui/component/Comment'
import Comment from 'ui/component/Comment'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Slot from 'ui/component/core/Slot'
import AbortPromise from 'utility/AbortPromise'
import State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

interface CommentsExtensions {

}

interface Comments extends Block, CommentsExtensions { }

const Comments = Component.Builder((rawComponent, under: UUID, isRootComment?: true): Comments => {
	const block = rawComponent
		.and(Block)
		.type('flush')
		.style('comment-list')
		.viewTransition('comments')
		.extend<CommentsExtensions>(component => ({}))

	Slot()
		.use(Session.Auth.author, AbortPromise.asyncFunction(async (signal, slot, author) => {
			const comment: CommentData = { comment_id: under }
			const comments = State<(CommentData | CommentEditor)[]>([comment])
			const authors = State<Author[]>(!author ? [] : [author])

			if (author)
				comments.use(block, commentsData => {
					if (!commentsData[0].edit) {
						commentsData.unshift({ edit: true, parent_id: under, author: author.vanity } as CommentEditor)
						comments.emit()
					}
				})

			type CommentQueryFunction = EndpointReturn<'/comments/{under}'>

			const query = State<CommentQueryFunction | undefined>(undefined)
			query.value = EndpointCommentGetAllUnder.prep({ params: { under } }).query

			Comment({ comments, authors }, comment, { isRootComment, noSiblings: true })
				.appendTo(slot)

			await loadMore()
			if (signal.aborted)
				return

			Slot()
				.if(query.truthy, () => Button()
					.event.subscribe('click', loadMore)
					.text.set('load more'))
				.appendTo(slot)

			async function loadMore () {
				if (!query.value)
					return

				const result = await query.value?.()
				if (toast.handleError(result))
					throw result

				authors.value.push(...result.data.authors); authors.emit()
				comments.value.push(...result.data.comments as CommentData[]); comments.emit()

				query.value = result.next
			}
		}))
		.appendTo(block.content)

	return block
})

export default Comments
