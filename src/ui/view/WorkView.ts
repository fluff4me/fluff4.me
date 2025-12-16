import type { ChapterMetadata, WorkReference } from 'api.fluff4.me'
import EndpointChapters$authorVanity$workVanity$chapterUrlReorder from 'endpoint/chapters/$author_vanity/$work_vanity/$chapter_url/EndpointChapters$authorVanity$workVanity$chapterUrlReorder'
import EndpointChapters$authorVanity$workVanity from 'endpoint/chapters/$author_vanity/EndpointChapters$authorVanity$workVanity'
import EndpointHistoryBookmarks$authorVanity$workVanityDeleteFurthestRead from 'endpoint/history/bookmarks/$author_vanity/$work_vanity/delete/EndpointHistoryBookmarks$authorVanity$workVanityDeleteFurthestRead'
import EndpointHistoryBookmarks$authorVanity$workVanityDeleteLastRead from 'endpoint/history/bookmarks/$author_vanity/$work_vanity/delete/EndpointHistoryBookmarks$authorVanity$workVanityDeleteLastRead'
import EndpointHistoryWork$authorVanity$workVanityAdd from 'endpoint/history/work/$author_vanity/$work_vanity/EndpointHistoryWork$authorVanity$workVanityAdd'
import EndpointWorks$authorVanity$workVanityGet from 'endpoint/works/$author_vanity/$work_vanity/EndpointWorks$authorVanity$workVanityGet'
import Chapters from 'model/Chapters'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import Tags from 'model/Tags'
import Works from 'model/Works'
import Component from 'ui/Component'
import ActionBlock from 'ui/component/ActionBlock'
import Chapter from 'ui/component/Chapter'
import type { CommentData } from 'ui/component/Comment'
import Comment from 'ui/component/Comment'
import type { CommentTreeRenderDefinition } from 'ui/component/CommentTree'
import CommentTree from 'ui/component/CommentTree'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import GradientText from 'ui/component/core/ext/GradientText'
import Link from 'ui/component/core/Link'
import Paginator from 'ui/component/core/Paginator'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import Work from 'ui/component/Work'
import DynamicDestination from 'ui/utility/DynamicDestination'
import Viewport from 'ui/utility/Viewport'
import LoginView from 'ui/view/LoginView'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Errors from 'utility/Errors'
import Objects from 'utility/Objects'
import State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

export default ViewDefinition({
	async load (params: WorkReference) {
		const response = await EndpointWorks$authorVanity$workVanityGet.query({ params })
		if (response instanceof Error)
			throw response

		const work = response.data
		return { work }
	},
	create (params: WorkReference, { work: workDataIn }) {
		const view = View('work')

		const workData = State(workDataIn)

		if (Session.Auth.loggedIn.value)
			void EndpointHistoryWork$authorVanity$workVanityAdd.query({ params })

		const authorData = workData.value.synopsis.mentions.find(author => author.vanity === workData.value.author)!
		if (!authorData)
			throw Errors.BadData('Work author not in synopsis authors')

		const work = Work(workData, authorData)
			.viewTransition('work-view-work')
			.setContainsHeading()
			.appendTo(view.content)

		ActionBlock()
			.viewTransition('work-view-work-actions')
			.attachAbove()
			.append(work.bookmarkActions
				.style('view-type-work-actions')
			)
			.addActions(work)
			.appendTo(view.content)

		work.bookmarkStatus.use(view, status => status?.style('view-type-work-bookmark-status'))
		work.bookmarkAction.use(view, action => action
			?.style('view-type-work-bookmark-action')
			.style.bind(workData.map(view, work => !!work.bookmarks?.url_read_last && !work.bookmarks.url_next), 'view-type-work-bookmark-action--irrelevant')
		)

		const ageRestricted = State.Map(view, [workData, Tags, Session.Auth.account], (work, tags, author) => true
			&& Tags.hasMature(work.global_tags)
			&& (!author || author.age !== 'eighteen_plus')
		)

		Block()
			.tweak(block => block.title.text.use('view/work/age-restricted/title'))
			.tweak(block => block.content
				.append(Placeholder()
					.text.bind(Session.Auth.loggedIn.map(block, loggedIn => quilt => quilt[loggedIn ? 'view/work/age-restricted/description/logged-in' : 'view/work/age-restricted/description/logged-out']()))
				)
				.appendWhen(Session.Auth.loggedIn.falsy, Button()
					.type('primary')
					.setIcon('circle-user')
					.text.use('shared/action/login-or-signup')
					.event.subscribe('click', () => navigate.ephemeral(LoginView, undefined))
				)
			)
			.appendToWhen(ageRestricted, view.content)

		const tabletMode = Viewport.tablet

		const tabinator = Tabinator()
			.viewTransition('work-view-tabinator')
			.tweak(tabinator => tabinator.header.prependToWhen(tabletMode.truthy, tabinator))
			.appendToWhen(ageRestricted.falsy, view.content)

		const chaptersTab = Tab('chapters')
			.text.use('view/work/chapters/title')
			.addTo(tabinator)

		////////////////////////////////////
		//#region Chapters

		const movingChapter = State<ChapterMetadata | undefined>(undefined)
		const editMode = State(false)
		const displayAsEditMode = State.Every(view, editMode, movingChapter.falsy)

		const chaptersListState = State(null)
		Slot()
			.use([ageRestricted, chaptersListState], (slot, ageRestricted) => ageRestricted ? undefined : Paginator()
				.viewTransition('work-view-chapters')
				.style('view-type-work-chapter-list')
				.tweak(paginator => {
					paginator.title.text.use('view/work/chapters/title')

					const isOwnWork = Session.Auth.loggedInAs(paginator, workDataIn.author)
					Slot().appendTo(paginator.primaryActions).if(isOwnWork, slot => {
						Button()
							.text.use('view/work/chapters/action/label/edit')
							.setIcon('pencil')
							.type('primary', 'flush')
							.event.subscribe('click', () => editMode.value = true)
							.appendToWhen(State.Every(paginator, editMode.falsy, movingChapter.falsy), slot)
						Button()
							.text.use('view/work/chapters/action/label/cancel-editing')
							.setIcon('xmark')
							.type('flush')
							.event.subscribe('click', () => editMode.value = false)
							.appendToWhen(displayAsEditMode, slot)
						Button()
							.text.use('chapter/action/label/reorder-cancel')
							.setIcon('xmark')
							.type('flush')
							.event.subscribe('click', () => movingChapter.value = undefined)
							.appendToWhen(movingChapter.truthy, slot)
					})

					Slot()
						.use(movingChapter, (slot, movingChapterData) => {
							if (!movingChapterData)
								return

							Chapter(movingChapterData, workData.value, authorData)
								.style('view-type-work-chapter-list-chapter-moving')
								.append(ReorderingIcon())
								.appendTo(slot)
						})
						.appendTo(paginator.header)
				})
				.set(
					PagedListData.fromEndpoint(25, EndpointChapters$authorVanity$workVanity.prep({
						params: Works.reference(workData.value),
					})),
					Math.min(
						Math.floor((workData.value.bookmarks?.url_next_page ?? 0) / 25),
						Math.max(0, Math.floor(((workData.value.chapter_count ?? workData.value.chapter_count_public) - 1) / 25)),
					),
					(slot, chapters) => {
						slot.style('chapter-list')
							.style.bind(movingChapter.truthy, 'view-type-work-chapter-list--moving-chapter')
							.style.bind(displayAsEditMode, 'view-type-work-chapter-list--edit-mode')

						const firstChapter = chapters.at(0)
						if (firstChapter)
							MoveSlot('before', firstChapter)
								.appendTo(slot)

						for (const chapterData of chapters) {
							const isMoving = movingChapter.map(slot, movingChapter => movingChapter === chapterData)

							const Marker = Component.Builder((component, EndpointDelete: typeof EndpointHistoryBookmarks$authorVanity$workVanityDeleteLastRead | typeof EndpointHistoryBookmarks$authorVanity$workVanityDeleteFurthestRead) => {
								return component
									.style('view-type-work-chapter-marker')
									.onRooted(marker => {
										marker.event.subscribe('mousedown', e => e.button === 1 && e.preventDefault())
										marker.event.subscribe('auxclick', async e => {
											if (e.button !== 1)
												return

											e.preventDefault()
											const response = await EndpointDelete.query({ params: Works.reference(workData.value) })
											if (toast.handleError(response))
												return

											workData.value.bookmarks = response.data
											workData.emit()
											chaptersListState.emit()
										})
									})
								// .and(CanHasActionsMenu)
								// .setActionsMenu(popover => popover
								// 	.appendAction('clear', slot => Button()
								// 		.type('flush')
								// 		.setIcon('trash')
								// 		.text.use('view/work/chapters/marker/action/remove')
								// 		.event.subscribe('click', async () => {
								// 		})
								// 	)
								// )
							})

							const nextUrl = workData.value.bookmarks?.url_next
							const nextFurthestUrl = workData.value.bookmarks?.url_next_furthest
							const nextIsFurthest = nextUrl === nextFurthestUrl
							if (chapterData.chapter_url === nextUrl)
								Marker(EndpointHistoryBookmarks$authorVanity$workVanityDeleteLastRead)
									.style(nextIsFurthest ? 'view-type-work-chapter-marker--next-furthest' : 'view-type-work-chapter-marker--next')
									.text.use('view/work/chapters/marker/next-chapter/next')
									.appendTo(slot)

							if (chapterData.chapter_url === nextFurthestUrl && nextUrl !== nextFurthestUrl)
								Marker(EndpointHistoryBookmarks$authorVanity$workVanityDeleteFurthestRead)
									.style('view-type-work-chapter-marker--next-furthest')
									.text.use('view/work/chapters/marker/next-chapter/furthest')
									.appendTo(slot)

							Chapter(chapterData, workData.value, authorData)
								.style('view-type-work-chapter')
								.style.bind(isMoving, 'view-type-work-chapter--moving')
								.style.bind(movingChapter.truthy, 'view-type-work-chapter--has-moving-sibling')
								.attributes.bind(movingChapter.truthy, 'inert')
								.tweak(chapter => {
									chapter.number.style.bind(isMoving, 'view-type-work-chapter--moving-number')
									chapter.chapterName.style.bind(isMoving, 'view-type-work-chapter--moving-name')
									chapter.timestamp?.style.bind(isMoving, 'view-type-work-chapter--moving-timestamp')
									Slot()
										.if(isMoving, () => ReorderingIcon()
											.style('view-type-work-chapter-reordering-icon--slot'))
										.appendTo(chapter)
								})
								.bindEditMode(displayAsEditMode)
								.setReorderHandler(() => movingChapter.value = movingChapter.value === chapterData ? undefined : chapterData)
								.appendTo(slot)

							MoveSlot('after', chapterData).appendTo(slot)
						}

						function MoveSlot (direction: 'before' | 'after', chapter: ChapterMetadata) {
							return Component()
								.style('view-type-work-chapter-slot-wrapper')
								.style.bind(movingChapter.truthy, 'view-type-work-chapter-slot-wrapper--has-moving-chapter')
								.append(Button()
									.style('chapter', 'view-type-work-chapter-slot')
									.event.subscribe('click', async () => {
										const movingChapterData = movingChapter.value
										if (!movingChapterData)
											return

										if (movingChapterData.chapter_url === chapter.chapter_url) {
											// no-op
											movingChapter.value = undefined
											return
										}

										const response = await EndpointChapters$authorVanity$workVanity$chapterUrlReorder.query({
											params: Chapters.reference(movingChapterData),
											body: {
												relative_to: chapter.chapter_url,
												position: direction,
											},
										})

										movingChapter.value = undefined

										if (toast.handleError(response))
											return

										chaptersListState.emit()
									})
								)
						}
					}
				)
				.orElse(slot => Block()
					.type('flush')
					.tweak(block => Placeholder()
						.text.use('view/work/chapters/content/empty')
						.appendTo(block.content))
					.appendTo(slot))
				// .setActionsMenu(popover => popover
				// 	.append(Slot()
				// 		.if(Session.Auth.author.map(popover, author => author?.vanity === workData.value.author), () => Button()
				// 			.setIcon('plus')
				// 			.type('flush')
				// 			.text.use('view/work/chapters/action/label/new')
				// 			.event.subscribe('click', () => navigate.toURL(`/work/${workData.value.author}/${workData.value.vanity}/chapter/new`))))
				// )
			)
			.appendTo(chaptersTab.content)

		//#endregion
		////////////////////////////////////

		const commentsTab = Tab('comments')
			.text.use('view/work/comments/title')
			.addToWhen(tabletMode.truthy, tabinator)

		const commentState = workData.mapManual(work => !work.root_comment ? undefined : {
			threadId: work.root_comment as UUID,
			threadAuthor: work.author,
		}, Objects.deepEquals)
		Block()
			.style('view-type-work-comment-block')
			.tweak(block => block.header.style('view-type-work-comment-block-header'))
			.tweak(block => block.title
				.setAestheticLevel(4)
				.text.use('view/work/comments/title')
			)
			.tweak(block => block.content.append(Slot().use([commentState, workData, ageRestricted], (slot, thread, work, ageRestricted) => {
				if (!thread || ageRestricted)
					return

				const isOwnWork = Session.Auth.loggedInAs(slot, thread.threadAuthor)
				const commentsRenderDefinition: CommentTreeRenderDefinition = {
					simpleTimestamps: true,
					onCommentsUpdate (comments) {
						const ownRecommendation = comments.find(comment => comment.author === Session.Auth.author.value?.vanity && !comment.edit)
						if (!work.recommendation && ownRecommendation) {
							work.recommendation = ownRecommendation
							workData.emit()
						}
					},
					shouldSkipComment (data) {
						return true
							&& data.author === Session.Auth.author.value?.vanity
							&& !data.edit
					},
					onRenderComment (comment, data) {
						comment
							.style('view-type-work-comment')
							.style.toggle(!!comment.editor, 'view-type-work-comment--has-editor')
							.style.toggle(!data.comment_id, 'view-type-work-comment--is-new-comment')

						if (!comment.editor)
							return

						comment.editor
							.setMinimal(tabletMode.falsy)
							.hint.use()

						if (data.comment_id)
							// this is an editor for an existing comment
							return

						// this is the new comment editor (only possible on root)
						// dynamically replace the editor with hints or the existing recommendation if applicable
						const existingRecommendation = work.recommendation as CommentData | undefined
						const canRecommend = !existingRecommendation && !work.bookmarks?.can_recommend ? State(false)
							: isOwnWork.falsy
						const noExistingRecommendation = State(!existingRecommendation)
						const showCommentEditor = State.Every(comment, canRecommend, noExistingRecommendation)
						const showCommentHint = State.Every(comment, canRecommend.falsy, isOwnWork.falsy, noExistingRecommendation)

						comment.author?.text.use('view/work/comments/action/add/label')
							.style('view-type-work-comment-editor-author-hint')
						comment.onRooted(() => {
							const parent = comment.parent!

							// show comment editor only when able to recommend & no existing recommendation
							comment.prependToWhen(showCommentEditor, parent)

							// show hint when unable to recommend & no existing recommendation
							Link(undefined)
								.and(GradientText)
								.useGradient(Session.Auth.author.value?.supporter?.username_colours)
								.style('view-type-work-comment-hint', 'author-link')
								.text.use('view/work/comments/action/no-add/label')
								.prependToWhen(showCommentHint, parent)

							// otherwise show existing recommendation
							if (existingRecommendation) {
								const existingRecommendationState = State([existingRecommendation])
								existingRecommendationState.subscribeManual(([existingRecommendation]) => {
									if (!existingRecommendation) {
										work.recommendation = undefined
										workData.emit()
									}
								})
								Comment(
									{ threadAuthor: thread.threadAuthor, comments: existingRecommendationState, authors: State(existingRecommendation.body?.mentions ?? []) },
									existingRecommendation,
									undefined,
									commentsRenderDefinition,
								)
									.prependTo(parent)
							}
						})
					},
					onNoComments (slot) {
						Placeholder()
							.style('view-type-work-comment-placeholder', 'view-type-work-comment-placeholder--empty')
							.style.bind(isOwnWork, 'view-type-work-comment-placeholder--empty--is-own-work')
							.text.use('view/work/comments/content/empty')
							.appendTo(slot)
					},
					onCommentsEnd (slot) {
						Placeholder()
							.style('view-type-work-comment-placeholder', 'view-type-work-comment-placeholder--end')
							.text.use('view/work/comments/content/end')
							.appendTo(slot)
					},
				}

				return CommentTree(thread.threadId, thread.threadAuthor, true, commentsRenderDefinition)
					.style('view-type-work-comment-tree')
			})))
			.appendTo(DynamicDestination(view)
				.addDestination('tab', commentsTab.content)
				.addDestination('sidebar', view.sidebar)
				.setStrategy(State.Map(view, [tabletMode, ageRestricted], (tabletMode, ageRestricted) =>
					ageRestricted ? undefined
						: tabletMode ? 'tab' : 'sidebar'
				))
			)

		return view
	},
})

function ReorderingIcon () {
	return Component()
		.and(Button)
		.ariaHidden()
		.tabIndex('programmatic')
		.setIcon('arrow-up-arrow-down')
		.type('icon')
		.style('view-type-work-chapter-reordering-icon')
}
