import type { ChapterMetadata } from 'api.fluff4.me'
import EndpointChapterGetAll from 'endpoint/chapter/EndpointChapterGetAll'
import EndpointChapterReorder from 'endpoint/chapter/EndpointChapterReorder'
import EndpointHistoryAddWork from 'endpoint/history/EndpointHistoryAddWork'
import type { WorkParams } from 'endpoint/work/EndpointWorkGet'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import Component from 'ui/Component'
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
	create (params: WorkParams, { work: workData }) {
		const view = View('work')

		if (Session.Auth.loggedIn.value)
			void EndpointHistoryAddWork.query({ params })

		const authorData = workData.synopsis.mentions.find(author => author.vanity === params.author)!
		if (!authorData)
			throw Errors.BadData('Work author not in synopsis authors')

		Work(workData, authorData)
			.viewTransition('work-view-work')
			.setContainsHeading()
			.appendTo(view.content)

		const movingChapter = State<ChapterMetadata | undefined>(undefined)

		const chaptersListState = State(null)
		Slot()
			.use(chaptersListState, () => Paginator()
				.viewTransition('work-view-chapters')
				.style('view-type-work-chapter-list')
				.tweak(paginator => {
					paginator.title.text.use('view/work/chapters/title')
					Slot()
						.use(movingChapter, (slot, movingChapterData) => {
							if (!movingChapterData)
								return

							Chapter(movingChapterData, workData, authorData)
								.style('view-type-work-chapter-list-chapter-moving')
								.append(ReorderingIcon())
								.tweakActions(actions => actions
									.insertAction('reorder', 'before', 'delete',
										Session.Auth.author, (slot, self) => true
											&& authorData.vanity === self?.vanity
											&& Button()
												.type('flush')
												.setIcon('arrow-up-arrow-down')
												.text.use('chapter/action/label/reorder-cancel')
												.event.subscribe('click', () =>
													movingChapter.value = undefined)
									)
								)
								.appendTo(slot)
						})
						.appendTo(paginator.header)
				})
				.set(
					PagedListData.fromEndpoint(25, EndpointChapterGetAll.prep({
						params: {
							author: params.author,
							vanity: params.vanity,
						},
					})),
					(slot, chapters) => {
						slot.style('chapter-list')
							.style.bind(movingChapter.truthy, 'view-type-work-chapter-list--moving-chapter')

						const firstChapter = chapters.at(0)
						if (firstChapter)
							MoveSlot('before', firstChapter)
								.appendTo(slot)

						for (const chapterData of chapters) {
							const isMoving = movingChapter.map(slot, movingChapter => movingChapter === chapterData)
							Chapter(chapterData, workData, authorData)
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
								.tweakActions(actions => actions
									.insertAction('reorder', 'before', 'delete',
										Session.Auth.author, (slot, self) => true
											&& authorData.vanity === self?.vanity
											&& Slot()
												.use(movingChapter, (slot, movingChapterData) => {
													Button()
														.type('flush')
														.setIcon('arrow-up-arrow-down')
														.text.use(movingChapterData === chapterData ? 'chapter/action/label/reorder-cancel' : 'chapter/action/label/reorder')
														.event.subscribe('click', () =>
															movingChapter.value = movingChapter.value === chapterData ? undefined : chapterData)
														.appendTo(slot)
												}))
								)
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
				.setActionsMenu(popover => popover
					.append(Slot()
						.if(Session.Auth.author.map(popover, author => author?.vanity === params.author), () => Button()
							.setIcon('plus')
							.type('flush')
							.text.use('view/work/chapters/action/label/new')
							.event.subscribe('click', () => navigate.toURL(`/work/${params.author}/${params.vanity}/chapter/new`))))
				)
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
