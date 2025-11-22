import type { AuthorMetadata } from 'api.fluff4.me'
import EndpointCommentGetAllUnder from 'endpoint/comment/EndpointCommentGetAllUnder'
import type { EndpointReturn } from 'endpoint/Endpoint'
import Session from 'model/Session'
import Component from 'ui/Component'
import type { CommentData, CommentEditor, CommentRenderDefinition } from 'ui/component/Comment'
import Comment from 'ui/component/Comment'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import type ComponentInsertionTransaction from 'ui/component/core/ext/ComponentInsertionTransaction'
import Loading from 'ui/component/core/Loading'
import type { SlotInitialiser } from 'ui/component/core/Slot'
import Slot from 'ui/component/core/Slot'
import TextEditor from 'ui/component/core/TextEditor'
import AbortPromise from 'utility/AbortPromise'
import State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

export interface CommentTreeRenderDefinition extends CommentRenderDefinition {
	onCommentsUpdate?(comments: CommentData[]): unknown
	onNoComments?(slot: ComponentInsertionTransaction): unknown
	onCommentsEnd?: SlotInitialiser
}

interface CommentTreeExtensions {
	tweakCommentEditor (tweak: (editor: TextEditor) => unknown): this
}

interface CommentTree extends Block, CommentTreeExtensions { }

const CommentTree = Component.Builder((rawComponent, threadId: UUID, threadAuthor: string, isRootComment?: true, renderDefinition?: CommentTreeRenderDefinition): CommentTree => {
	let tweakCommentEditor: ((editor: TextEditor) => unknown) | undefined = undefined
	const block = rawComponent
		.and(Block)
		.type('flush')
		.style('comment-tree')
		.viewTransition('comments')
		.extend<CommentTreeExtensions>(component => ({
			tweakCommentEditor (tweak) {
				tweakCommentEditor = tweak
				return component
			},
		}))

	const loading = State(false)

	Slot()
		.use(Session.Auth.author, AbortPromise.asyncFunction(async (signal, slot, author) => {
			const comment: CommentData = { comment_id: threadId, replyable: true }
			const comments = State<(CommentData | CommentEditor)[]>([comment])
			const authors = State<AuthorMetadata[]>(!author ? [] : [author])

			if (author)
				comments.use(block, commentsData => {
					if (!commentsData[0].edit) {
						commentsData.unshift({ edit: true, parent_id: threadId, author: author.vanity } as CommentEditor)
						comments.emit()
						return
					}

					renderDefinition?.onCommentsUpdate?.(commentsData as CommentData[])
				})

			type CommentQueryFunction = EndpointReturn<'/comments/{under}'>

			const query = State<CommentQueryFunction | undefined>(undefined)
			query.value = EndpointCommentGetAllUnder.prep({ params: { under: threadId } }).query

			const rootComment = Comment({ comments, authors, threadAuthor }, comment, { isRootComment, noSiblings: true }, renderDefinition)
				.appendTo(slot)

			await loadMore()
			if (signal.aborted)
				return

			const noComments = comments.value.filter(c => !c.edit).length <= 1
			if (noComments)
				renderDefinition?.onNoComments?.(slot)

			Slot()
				.if(query.truthy, () => Button()
					.event.subscribe('click', loadMore)
					.text.set('load more'))
				.else(slot => !noComments && renderDefinition?.onCommentsEnd?.(slot))
				.appendTo(slot)

			async function loadMore () {
				if (!query.value)
					return

				loading.value = true
				const result = await query.value?.()
				// await Async.sleep(100000)
				loading.value = false
				if (toast.handleError(result))
					throw result

				authors.value.push(...result.data.authors); authors.emit()
				comments.value.push(...result.data.comments as CommentData[]); comments.emit()

				query.value = result.next

				if (!tweakCommentEditor)
					return

				for (const textEditor of rootComment.getDescendants(TextEditor)) {
					if (textEditor.classes.has('_text-editor-tweaked'))
						continue

					tweakCommentEditor(textEditor)
					textEditor.classes.add('_text-editor-tweaked')
				}
			}
		}))
		.appendTo(block.content)

	Loading()
		.style('comment-tree-loading')
		.tweak(loader => loader.enabled.value = true)
		.appendToWhen(loading, block.content)

	return block
})

export default CommentTree
