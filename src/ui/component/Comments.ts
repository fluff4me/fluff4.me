import type { Author } from 'api.fluff4.me'
import EndpointCommentGetAllUnder from 'endpoint/comment/EndpointCommentGetAllUnder'
import type { EndpointReturn } from 'endpoint/Endpoint'
import Session from 'model/Session'
import Component from 'ui/Component'
import type { CommentData, CommentEditor } from 'ui/component/Comment'
import Comment from 'ui/component/Comment'
import Button from 'ui/component/core/Button'
import Slot from 'ui/component/core/Slot'
import AbortPromise from 'utility/AbortPromise'
import State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

interface CommentsExtensions {

}

interface Comments extends Component, CommentsExtensions { }

const Comments = Component.Builder((rawComponent, under: UUID, isRootComment?: true): Comments => {
	const component = rawComponent
		.style('comment-list')
		.extend<CommentsExtensions>(component => ({}))

	Slot()
		.use(Session.Auth.author, AbortPromise.asyncFunction(async (signal, slot, author) => {
			const comment: CommentData = { comment_id: under }
			const comments = State<(CommentData | CommentEditor)[]>([comment])
			const authors = State<Author[]>(!author ? [] : [author])

			if (author)
				comments.use(component, commentsData => {
					if (!commentsData[0].edit) {
						commentsData.unshift({ edit: true, parent_id: under, author: author.vanity } as CommentEditor)
						comments.emit()
					}
				})

			type CommentQueryFunction = EndpointReturn<'/comments/{under}'>

			const query = State<CommentQueryFunction | undefined>(undefined)
			query.value = EndpointCommentGetAllUnder.prep({ params: { under } }).query

			Comment({ comments, authors }, comment, { isRootComment: true, noSiblings: true })
				.appendTo(component)

			await loadMore()
			if (signal.aborted)
				return

			Slot()
				.if(query.truthy, () => Button()
					.event.subscribe('click', loadMore)
					.text.set('load more'))
				.appendTo(component)

			async function loadMore () {
				if (!query.value)
					return

				const result = await query.value?.()
				if (result instanceof Error)
					throw result

				comments.value.push(...result.data.comments as CommentData[]); comments.emit()
				authors.value.push(...result.data.authors); comments.emit()

				query.value = result.next
			}
		}))
		.appendTo(component)

	return component
})

export default Comments
