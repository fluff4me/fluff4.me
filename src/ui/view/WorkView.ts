import type { ChapterMetadata } from 'api.fluff4.me'
import EndpointChapterGetAll from 'endpoint/chapter/EndpointChapterGetAll'
import EndpointChapterReorder from 'endpoint/chapter/EndpointChapterReorder'
import EndpointHistoryAddWork from 'endpoint/history/EndpointHistoryAddWork'
import EndpointHistoryBookmarksDeleteFurthestRead from 'endpoint/history/EndpointHistoryBookmarksDeleteFurthestRead'
import EndpointHistoryBookmarksDeleteLastRead from 'endpoint/history/EndpointHistoryBookmarksDeleteLastRead'
import type { WorkParams } from 'endpoint/work/EndpointWorkGet'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import Works from 'model/Works'
import Component from 'ui/Component'
import ActionBlock from 'ui/component/ActionBlock'
import Chapter from 'ui/component/Chapter'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Paginator from 'ui/component/core/Paginator'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Work from 'ui/component/Work'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Errors from 'utility/Errors'
import State from 'utility/State'

export default ViewDefinition({
	async load (params: WorkParams) {
		const response = await EndpointWorkGet.query({ params })
		if (response instanceof Error)
			throw response

		const work = response.data
		return { work }
	},
	create (params: WorkParams, { work: workDataIn }) {
		const view = View('work')

		const workData = State(workDataIn)

		if (Session.Auth.loggedIn.value)
			void EndpointHistoryAddWork.query({ params })

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

		// TODO add custom bookmark action for being caught up or finished, leaving a recommendation

		const movingChapter = State<ChapterMetadata | undefined>(undefined)
		const editMode = State(false)
		const displayAsEditMode = State.Every(view, editMode, movingChapter.falsy)

		const chaptersListState = State(null)
		Slot()
			.use(chaptersListState, () => Paginator()
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
					PagedListData.fromEndpoint(25, EndpointChapterGetAll.prep({
						params: {
							author: workData.value.author,
							vanity: workData.value.vanity,
						},
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

							const Marker = Component.Builder((component, EndpointDelete: typeof EndpointHistoryBookmarksDeleteLastRead | typeof EndpointHistoryBookmarksDeleteFurthestRead) => {
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
							if (chapterData.url === nextUrl)
								Marker(EndpointHistoryBookmarksDeleteLastRead)
									.style(nextIsFurthest ? 'view-type-work-chapter-marker--next-furthest' : 'view-type-work-chapter-marker--next')
									.text.use('view/work/chapters/marker/next-chapter/next')
									.appendTo(slot)

							if (chapterData.url === nextFurthestUrl && nextUrl !== nextFurthestUrl)
								Marker(EndpointHistoryBookmarksDeleteFurthestRead)
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

										if (movingChapterData.url === chapter.url) {
											// no-op
											movingChapter.value = undefined
											return
										}

										const response = await EndpointChapterReorder.query({
											params: movingChapterData,
											body: {
												relative_to: chapter.url,
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
			.appendTo(view.content)

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
