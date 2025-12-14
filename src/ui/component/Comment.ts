import type { AuthorMetadata, ChapterMetadata, Comment as CommentDataRaw, ContextualComment, ReportCommentBody, WorkMetadata } from 'api.fluff4.me'
import EndpointComments$commentIdAdd from 'endpoint/comments/$comment_id/EndpointComments$commentIdAdd'
import EndpointComments$commentIdDelete from 'endpoint/comments/$comment_id/EndpointComments$commentIdDelete'
import EndpointComments$commentIdUpdate from 'endpoint/comments/$comment_id/EndpointComments$commentIdUpdate'
import EndpointReactionsComment$commentId$reactionTypeAdd from 'endpoint/reactions/comment/$comment_id/$reaction_type/EndpointReactionsComment$commentId$reactionTypeAdd'
import EndpointReactionsComment$commentId$reactionTypeRemove from 'endpoint/reactions/comment/$comment_id/$reaction_type/EndpointReactionsComment$commentId$reactionTypeRemove'
import EndpointReportsComment$commentIdAdd from 'endpoint/reports/comment/$comment_id/EndpointReportsComment$commentIdAdd'
import type { WeavingArg } from 'lang/en-nz'
import quilt from 'lang/en-nz'
import Chapters from 'model/Chapters'
import FormInputLengths from 'model/FormInputLengths'
import Session from 'model/Session'
import Component from 'ui/Component'
import AuthorLink from 'ui/component/AuthorLink'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Loading from 'ui/component/core/Loading'
import Slot from 'ui/component/core/Slot'
import TextEditor from 'ui/component/core/TextEditor'
import Timestamp from 'ui/component/core/Timestamp'
import Reaction from 'ui/component/Reaction'
import ReportDialog, { ReportDefinition } from 'ui/component/ReportDialog'
import WorkLink from 'ui/component/WorkLink'
import type { Quilt } from 'ui/utility/StringApplicator'
import { QuiltHelper } from 'ui/utility/StringApplicator'
import type { StateOr } from 'utility/State'
import State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

const COMMENT_REPORT = ReportDefinition<ReportCommentBody>({
	titleTranslation: 'shared/term/comment',
	reasons: {
		'inappropriate': true,
		'spam': true,
		'harassment': true,
		'phishing': true,
		'tos-violation': true,
	},
})

export interface CommentData extends Omit<CommentDataRaw, 'comment_id' | 'parent_id'> {
	comment_id: UUID
	parent_id?: UUID | null
	edit?: never
}

export interface CommentEditor extends Omit<Partial<CommentData>, 'edit'> {
	edit: true
}

interface CommentExtensions {
	readonly author?: Link
	readonly editor?: TextEditor
}

interface Comment extends Component, CommentExtensions { }

export interface CommentDataSource {
	threadAuthor: string
	comments: State.Mutable<(CommentData | CommentEditor)[]>
	authors: State<AuthorMetadata[]>
}

export interface CommentMetadata {
	// basic comment rendering metadata
	depth?: number
	isRootComment?: true
	noSiblings?: true
	hasParent?: true
	hasGrandparent?: true

	/** context for comments pulled out of that context */
	context?: {
		root_object: ContextualComment['root_object']
		is_reply?: true
		authors?: StateOr<AuthorMetadata[]>
		works?: StateOr<WorkMetadata[]>
		chapters?: StateOr<ChapterMetadata[]>
	}
}

export interface CommentRenderDefinition {
	simpleTimestamps?: true
	shouldSkipComment?(data: CommentData | CommentEditor): boolean | undefined
	onRenderComment?(comment: Comment, data: CommentData | CommentEditor): unknown
}

const Comment = Component.Builder((component, source: CommentDataSource, commentData: CommentData | CommentEditor, meta?: CommentMetadata, renderDefinition?: CommentRenderDefinition): Comment => {
	let authorLink: Link | undefined
	let editor: TextEditor | undefined
	const comment = component.and(Slot)
		.style('comment')
		.extend<CommentExtensions>(comment => ({}))
		.extendMagic('editor', () => ({ get: () => editor }))
		.extendMagic('author', () => ({ get: () => authorLink }))

	const comments = source.comments.map(comment,
		comments => comments.filter(comment => comment === commentData || comment.parent_id === commentData.comment_id),
		() => false,
	)

	comment.use(comments, (slot, commentsData) => {
		editor = undefined

		const isThread = false
			// has siblings & is not a top level comment
			|| (!meta?.noSiblings && !!meta?.hasParent)
			// has a parent that is a top level comment
			|| !!(meta?.hasParent && !meta.hasGrandparent)
		comment.style.toggle(isThread, 'comment--is-thread')

		const content = Component()
			.style('comment-content')
			.style.toggle(!!commentData.edit, 'comment-content--has-editor')
			.style.setProperty('z-index', `${100 - (meta?.depth ?? 0)}`)
			.appendTo(slot)

		if (commentData && !meta?.isRootComment) {
			const header = Component('header')
				.style('comment-header')
				.style.toggle(!!commentData.edit, 'comment-header--editing')
				.appendTo(content)

			const author = source.authors.value.find(author => author.vanity === commentData.author)
			if (!author)
				authorLink = Link(undefined)
					.style('comment-header-author')
					.text.use('comment/deleted/author')
					.appendTo(header)
			else
				authorLink = AuthorLink(author)
					.style('comment-header-author')
					.appendTo(header)

			let isOnPrivateObject = false
			let isOnPatronOnlyObject = false
			let isOnNotViewableObject = false
			if (meta?.context) {
				const contextType = meta.context.root_object.type === 'work' ? 'work'
					: meta.context.root_object.type === 'work_private' ? 'work_private'
						: `${meta.context.root_object.type === 'comment' ? 'orphaned' : meta.context.root_object.type}${meta.context.is_reply ? '/reply' : '/comment'}` as const

				const ChapterContext = () => meta.context?.root_object.type === 'chapter' ? meta.context.root_object : undefined
				const WorkContext = () => meta.context?.root_object.type === 'work' ? meta.context.root_object : undefined
				const authorVanity = ChapterContext()?.chapter.author ?? WorkContext()?.work.author
				const workVanity = ChapterContext()?.chapter.work ?? WorkContext()?.work.vanity
				const chapterUrl = ChapterContext()?.chapter.url
				const author = !authorVanity ? undefined : State.value(meta.context.authors)?.find(a => a.vanity === authorVanity)
				const work = !workVanity ? undefined : State.value(meta.context.works)?.find(w => w.author === authorVanity && w.vanity === workVanity)
				const chapter = !chapterUrl ? undefined : State.value(meta.context.chapters)?.find(c => c.author === authorVanity && c.work === workVanity && c.url === chapterUrl)

				isOnPrivateObject = meta.context.root_object.type === 'work_private' || meta.context.root_object.type === 'chapter_private'
				isOnPatronOnlyObject = chapter?.visibility === 'Patreon'
				isOnNotViewableObject = isOnPatronOnlyObject || isOnPrivateObject

				const workLink = !work ? undefined : WorkLink(work, author)
				type TranslationParams = [thing?: WeavingArg | Quilt.Handler, of?: WeavingArg | Quilt.Handler]
				const translationParams: TranslationParams = _
					?? ({
						work: () => [
							workLink,
							author ? AuthorLink(author) : '',
						],
						chapter: () => [
							(Link(`/work/${work?.author}/${work?.vanity}/chapter/${chapterUrl}`)
								.style('comment-header-context-chapter')
								.style.toggle(isOnPatronOnlyObject, 'comment-header-context-chapter--patreon', 'patreon-icon-before')
								.append(Component().text.set(Chapters.getName(chapter)))
							),
							workLink,
						],
					} as Record<string, () => TranslationParams>)[contextType.split('/')[0]]?.()
					?? []

				Component()
					.style('comment-header-context')
					.text.use(quilt => quilt[`comment/context/${contextType}`](...QuiltHelper.args(translationParams) as [WeavingArg?, WeavingArg?]))
					.appendTo(header)
			}

			const time = commentData.edited_time ?? commentData.created_time
			if (time)
				Timestamp(time)
					.style('comment-header-timestamp')
					.setSimple(!!meta?.context || !!renderDefinition?.simpleTimestamps)
					.setTranslation(!commentData.edited_time ? undefined : quilt => quilt['comment/timestamp/edited'])
					.appendTo(header)

			if (commentData.edit) {
				////////////////////////////////////
				//#region Text Editor Body

				const textEditor = editor = TextEditor()
					.default.set(commentData.body?.body ?? '')
					.setMaxLength(FormInputLengths.map(slot, lengths => lengths?.comment?.body))
					.hint.use('comment/hint')
					.appendTo(content)

				textEditor.editor.style('comment-editor')
				textEditor.content.use(header, markdown => commentData.body = { body: markdown })

				const footer = Component('footer').and(ActionRow)
					.style('comment-footer', 'comment-footer--editing')
					.appendTo(content)

				if (commentData.comment_id)
					Button()
						.style('comment-footer-action')
						.text.use('comment/action/delete')
						.event.subscribe('click', async () => {
							savingComment.value = true
							const response = await EndpointComments$commentIdDelete.query({ params: { comment_id: commentData.comment_id! } })
							savingComment.value = false
							if (toast.handleError(response))
								return

							source.comments.value.filterInPlace(comment => comment !== commentData)
							source.comments.emit()
						})
						.appendTo(footer.right)

				if (meta?.hasParent)
					Button()
						.style('comment-footer-action')
						.text.use('comment/action/cancel')
						.event.subscribe('click', () => {
							if (commentData.created_time)
								delete (commentData as CommentDataRaw as CommentData).edit
							else
								source.comments.value.filterInPlace(comment => comment !== commentData)
							source.comments.emit()
						})
						.appendTo(footer.right)

				const savingComment = State(false)
				Button()
					.style('comment-footer-action')
					.type('primary')
					.text.use('comment/action/save')
					.bindDisabled(textEditor.invalid)
					.event.subscribe('click', async () => {
						savingComment.value = true
						await (async () => {
							if (!commentData.parent_id)
								return

							const response = commentData.comment_id
								? await EndpointComments$commentIdUpdate.query({
									params: { comment_id: commentData.comment_id },
									body: { body: textEditor.useMarkdown() },
								})
								: await EndpointComments$commentIdAdd.query({
									params: { comment_id: commentData.parent_id },
									body: { body: textEditor.useMarkdown() },
								})
							if (toast.handleError(response))
								return

							const newComment = response.data

							for (const key of Object.keys(commentData))
								// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
								delete (commentData as any)[key]

							Object.assign(commentData, newComment)

							// source.comments.value.filterInPlace(comment => comment !== commentData)
							if (!source.comments.value.some(comment => comment.comment_id === commentData.comment_id))
								source.comments.value.push(newComment as CommentData)

							source.comments.emit()
						})()
						savingComment.value = false
					})
					.appendToWhen(savingComment.falsy, footer.right)

				Loading()
					.tweak(loading => {
						loading.style('comment-footer-action-loading')
						loading.enabled.bind(loading, savingComment)
						loading.flag.style('comment-footer-action-loading-flag')
					})
					.appendToWhen(savingComment, footer.right)

				//#endregion
				////////////////////////////////////
			}
			else {
				////////////////////////////////////
				//#region Real Comment Body

				Component()
					.style('comment-body')
					.style.toggle(!commentData.body?.body, 'comment-body--placeholder')
					.setMarkdownContent(commentData.body?.body
						? { body: commentData.body.body, mentions: source.authors.value }
						: quilt[`comment/${isOnPrivateObject ? 'private' : isOnPatronOnlyObject ? 'patron-only' : 'deleted'}/body`]().toString()
					)
					.appendTo(content)

				const commentAuthor = author
				Slot()
					.use(Session.Auth.author, (slot, author) => {
						const deletingComment = State(false)

						const footer = Component('footer')
							.style('comment-footer')
							.appendTo(slot)

						const reactionsWrapper = Component()
							.style('comment-footer-section', 'comment-footer-section--reactions')
							.appendTo(footer)

						const primaryActionsWrapper = Component()
							.style('comment-footer-section')
							.appendTo(footer)

						const secondaryActionsWrapper = Component()
							.style('comment-footer-section')
							.appendTo(footer)

						////////////////////////////////////
						//#region Reactions

						const changingReactionState = State(false)
						const isThreadAuthor = source.threadAuthor === Session.Auth.author.value?.vanity
						const changingAuthorHeartState = isThreadAuthor ? changingReactionState : State(false)
						if (commentData.reactions || !commentData.reacted || !isThreadAuthor)
							Reaction('love', commentData.reactions ?? 0, !!commentData.reacted, changingReactionState)
								.tweak(r => r.icon
									.setDisabled(isOnNotViewableObject, 'not viewable')
									.bindDisabled(Session.Auth.loggedIn.falsy, 'not logged in')
								)
								.event.subscribe('click', async () => {
									if (!author)
										return

									if (commentData.reacted) {
										await unreact()
									}
									else {
										changingReactionState.value = true
										const response = await EndpointReactionsComment$commentId$reactionTypeAdd.query({ params: { comment_id: commentData.comment_id, reaction_type: 'love' } })
										changingReactionState.value = false
										if (toast.handleError(response))
											return

										commentData.reacted = true

										if (isThreadAuthor)
											commentData.author_hearted = true
										else {
											commentData.reactions ??= 0
											commentData.reactions++
										}
									}

									comments.emit()
								})
								.appendTo(reactionsWrapper)

						if (commentData.author_hearted)
							Reaction('author_heart', 0, true, changingAuthorHeartState)
								.tweak(heart => heart.icon
									.style('comment-author-heart')
									.style.toggle(!isThreadAuthor, 'comment-author-heart--not-author')
								)
								.setTooltip(tooltip => tooltip.text.use('comment/tooltip/author-heart'))
								.event.subscribe('click', async () => {
									if (isThreadAuthor)
										await unreact()
								})
								.appendTo(reactionsWrapper)

						async function unreact () {
							changingReactionState.value = true
							const response = await EndpointReactionsComment$commentId$reactionTypeRemove.query({ params: { comment_id: (commentData as CommentDataRaw).comment_id, reaction_type: 'love' } })
							changingReactionState.value = false
							if (toast.handleError(response))
								return

							delete commentData.reacted

							if (source.threadAuthor === Session.Auth.author.value?.vanity)
								delete commentData.author_hearted
							else {
								commentData.reactions ??= 0
								commentData.reactions--
								if (commentData.reactions < 0)
									delete commentData.reactions
							}

							comments.emit()
						}

						//#endregion
						////////////////////////////////////

						if (!author)
							// actions are not available to non-logged in users
							return

						const isOwnComment = commentData.author === author.vanity
						let appendedDeleteButton = false
						const DeleteButton = () => appendedDeleteButton === true ? undefined : (
							appendedDeleteButton = true,
							Button()
								.style('comment-footer-action')
								.type('flush')
								.setIcon(commentData.author === author.vanity || source.threadAuthor === author.vanity ? 'trash' : 'shield-halved')
								.text.use('comment/action/delete')
								.event.subscribe('click', async event => {
									deletingComment.value = true
									const response = await EndpointComments$commentIdDelete.query({ params: { comment_id: commentData.comment_id } })
									deletingComment.value = false
									if (toast.handleError(response))
										return

									source.comments.value.filterInPlace(comment => comment !== commentData)
									source.comments.emit()
								})
						)

						if (isOwnComment && !meta?.context)
							Button()
								.style('comment-footer-action')
								.type('flush')
								.setIcon('pencil')
								.text.use('comment/action/edit')
								.event.subscribe('click', () => {
									(commentData as CommentDataRaw as CommentEditor).edit = true
									comments.refresh()
								})
								.appendTo(primaryActionsWrapper)

						if (isOwnComment)
							DeleteButton()
								?.appendToWhen(deletingComment.falsy, primaryActionsWrapper)

						if (!isOnNotViewableObject && commentData.replyable)
							Button()
								.style('comment-footer-action')
								.type('flush')
								.setIcon('reply')
								.text.use('comment/action/reply')
								.event.subscribe('click', () => {
									source.comments.value.unshift({ edit: true, parent_id: commentData.comment_id, author: author.vanity })
									comments.refresh()
								})
								.appendTo(isOwnComment ? secondaryActionsWrapper : primaryActionsWrapper)

						if (!isOwnComment && !isOnNotViewableObject)
							Button()
								.style('comment-footer-action')
								.type('flush')
								.setIcon('flag')
								.text.use('comment/action/report')
								.event.subscribe('click', event => ReportDialog.prompt(event.host, COMMENT_REPORT, {
									reportedContentName: quilt => quilt['shared/term/comment-by'](commentAuthor?.name),
									async onReport (body) {
										const response = await EndpointReportsComment$commentIdAdd.query({ body, params: { comment_id: commentData.comment_id } })
										toast.handleError(response)
									},
								}))
								.appendTo(secondaryActionsWrapper)

						if (source.threadAuthor === author.vanity || Session.Auth.isModerator.value)
							DeleteButton()
								?.appendToWhen(deletingComment.falsy, secondaryActionsWrapper)

						Loading()
							.tweak(loading => {
								loading.style('comment-footer-action-loading')
								loading.enabled.bind(loading, deletingComment)
								loading.flag.style('comment-footer-action-loading-flag')
							})
							.appendToWhen(deletingComment, footer)
					})
					.appendTo(slot)

				//#endregion
				////////////////////////////////////
			}
		}

		////////////////////////////////////
		//#region Children

		if (commentData.comment_id && commentsData.length > 1) {
			const hasChildren = commentsData.length > 2

			const shouldBeFlush = false
				|| !!meta?.isRootComment
				// this is part of a thread, so flatten it
				|| (meta?.noSiblings && !hasChildren)
				// border is handled by child comments rather than being on the wrapper
				|| (commentsData.length > 3)

			const childrenWrapper = Component()
				.style('comment-children')
				.style.toggle(shouldBeFlush, 'comment-children--flush')
				.appendTo(slot)

			const timeValue = (c: CommentData | CommentEditor) => !c.created_time ? Infinity : new Date(c.created_time).getTime()
			for (const comment of commentsData.sort((a, b) => timeValue(b) - timeValue(a))) {
				if (comment === commentData)
					continue

				if (renderDefinition?.shouldSkipComment?.(comment))
					continue

				const noSiblings = commentsData.length <= 2 ? true : undefined
				Comment(source, comment, { noSiblings, hasParent: !meta?.isRootComment ? true : undefined, hasGrandparent: meta?.hasParent, depth: (meta?.depth ?? 0) + 1 }, renderDefinition)
					.appendTo(childrenWrapper)
			}
		}

		//#endregion
		////////////////////////////////////

		renderDefinition?.onRenderComment?.(comment, commentData)
	})

	return comment
})

export default Comment
