import type { ChapterCreateBody, ChapterLite, ChapterReference, ChapterRelativePosition, QueuedChapterFinalise, Work as WorkData, WorkFull } from 'api.fluff4.me'
import EndpointChapterCreateBulkCancel from 'endpoint/chapter/EndpointChapterCreateBulkCancel'
import EndpointChapterCreateBulkFinish from 'endpoint/chapter/EndpointChapterCreateBulkFinish'
import EndpointChapterCreateBulkQueue from 'endpoint/chapter/EndpointChapterCreateBulkQueue'
import EndpointChapterGetAll from 'endpoint/chapter/EndpointChapterGetAll'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import type { Weave, WeavingArg } from 'lang/en-nz'
import Chapters from 'model/Chapters'
import PagedListData from 'model/PagedListData'
import Patreon from 'model/Patreon'
import Session from 'model/Session'
import Component from 'ui/Component'
import Chapter from 'ui/component/Chapter'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Checkbutton from 'ui/component/core/Checkbutton'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Details from 'ui/component/core/Details'
import LabelledTable from 'ui/component/core/LabelledTable'
import Link from 'ui/component/core/Link'
import Loading from 'ui/component/core/Loading'
import Paginator from 'ui/component/core/Paginator'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import SlotArray from 'ui/component/core/SlotArray'
import Small from 'ui/component/core/Small'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import TextInput from 'ui/component/core/TextInput'
import Work from 'ui/component/Work'
import InputBus from 'ui/InputBus'
import type { Quilt } from 'ui/utility/StringApplicator'
import ChapterEditForm from 'ui/view/chapter/ChapterEditForm'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Documents from 'utility/Documents'
import Maths from 'utility/maths/Maths'
import State from 'utility/State'
import Strings from 'utility/string/Strings'
import Task from 'utility/Task'

type Params = Omit<ChapterReference, 'url'>

export default ViewDefinition({
	requiresLogin: true,
	async load (params: Params) {
		const workResponse = await EndpointWorkGet.query({ params: Chapters.work(params) })
		if (workResponse instanceof Error)
			throw workResponse

		const author = workResponse.data.synopsis?.mentions.find(author => author.vanity === params.author)
		return { work: workResponse.data as WorkData & Partial<WorkFull>, author }
	},
	create (params: Params, { work, author }) {
		const id = 'chapter-bulk'
		const view = View(id)

		delete work.synopsis
		delete work.custom_tags

		Link(`/work/${author?.vanity}/${work.vanity}`)
			.and(Work, work, author)
			.viewTransition('chapter-view-work')
			.style('view-type-chapter-work')
			.setContainsHeading()
			.appendTo(view.content)

		const ChapterDisplay = (url: string, title: string) => Slot()
			.append((() => {
				const number = Maths.parseIntOrUndefined(url)
				if (!number)
					return undefined

				return Component()
					.style('view-type-chapter-bulk-chapter-display-number')
					.text.use(quilt => quilt['view/chapter/number/label'](number))
			})())
			.append(Component()
				.style('view-type-chapter-bulk-chapter-display-title')
				.text.set(title)
			)

		const viewContent = Component()
			.style('view-type-chapter-bulk-content')
			.appendTo(view.content)

		interface UploadStateUploading {
			done: false
			chapters: readonly ChapterForm[]
			position?: InsertPosition
		}

		interface UploadStateComplete {
			done: true
		}

		const state = State<UploadStateUploading | UploadStateComplete | undefined>(undefined)

		const tabinator = Tabinator()
			.tabType('steps')
			.appendTo(viewContent)

		////////////////////////////////////
		//#region Position

		interface InsertPosition extends ChapterRelativePosition {
			title: string
		}

		const chosenPosition = State<InsertPosition | undefined>(undefined)
		const InsertionPositionDisplay = () => Slot.using(chosenPosition, (slot, insertAt) => insertAt && Component()
			.style('view-type-chapter-bulk-position-display')
			.append(Component()
				.style('view-type-chapter-bulk-position-display-label')
				.text.use(`view/chapter-create-bulk/position/label/position/${insertAt.position}`)
			)
			.append(ChapterDisplay(insertAt.relative_to, insertAt.title))
			.appendWhen(chosenPosition.truthy, Button()
				.tweak(button => {
					changingPosition.use(button, changing => {
						if (changing)
							button.type.remove('primary')
						else
							button.type('primary')
					})
				})
				.style('view-type-chapter-bulk-position-display-action')
				.text.bind(changingPosition.map(slot, changing => quilt => quilt[`view/chapter-create-bulk/position/action/${changing ? 'cancel-change' : 'change'}`]()))
				.event.subscribe('click', event => {
					changingPosition.value = !changingPosition.value
					positionBlock.header.element.scrollIntoView({ behavior: 'instant' })
				})
			)
		)

		const changingPosition = State(false)

		const positionTab = Tab()
			.text.use('view/chapter-create-bulk/position/tab')
			.addTo(tabinator)

		const positionBlock = Block()
			.type('flush')
			.style('view-type-chapter-bulk-block', 'view-type-chapter-bulk-block--not-last')
			.tweak(block => block.title.text.use('view/chapter-create-bulk/position/title'))
			.tweak(block => block.description.text.use('view/chapter-create-bulk/position/description'))
			.tweak(block => block.content

				////////////////////////////////////
				//#region Position Selection

				.appendWhen(State.Some(block, chosenPosition.falsy, changingPosition),
					Paginator()
						.viewTransition('work-view-chapters')
						.style('view-type-work-chapter-list')
						.set(
							PagedListData.fromEndpoint(25, EndpointChapterGetAll.prep({ params: work })),
							(slot, chapters) => {
								slot.style('chapter-list')
									.style('view-type-work-chapter-list--moving-chapter')

								const firstChapter = chapters.at(0)
								if (firstChapter)
									MoveSlot('before', firstChapter)
										.appendTo(slot)

								for (const chapterData of chapters) {
									Chapter(chapterData, work, author ?? { vanity: params.author })
										.style('view-type-work-chapter', 'view-type-work-chapter--has-moving-sibling')
										.attributes.append('inert')
										.appendTo(slot)

									MoveSlot('after', chapterData).appendTo(slot)
								}

								function MoveSlot (direction: 'before' | 'after', chapter: ChapterLite) {
									const position: InsertPosition = {
										relative_to: chapter.url,
										position: direction,
										title: chapter.name,
									}
									const isChosen = chosenPosition.map(slot, chosen => !!chosen && chosen.relative_to === position.relative_to && chosen.position === position.position)
									return Component()
										.style('view-type-work-chapter-slot-wrapper')
										.style('view-type-work-chapter-slot-wrapper--has-moving-chapter')
										.append(Button()
											.style('chapter', 'view-type-work-chapter-slot')
											.style.bind(isChosen, 'view-type-work-chapter-slot--chosen')
											.event.subscribe('click', () => {
												chosenPosition.value = position
												changingPosition.value = false
												block.header.element.scrollIntoView({ behavior: 'instant' })
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
							.appendTo(slot)))

				//#endregion
				////////////////////////////////////

				.append(InsertionPositionDisplay())

				.append(ActionRow()
					.style('view-type-chapter-bulk-step-action-row')
					.tweak(row => row.right.append(positionTab.createNextButton())))
			)
			.appendToWhen(state.falsy, positionTab.content)

		//#endregion
		////////////////////////////////////

		////////////////////////////////////
		//#region File Discovery

		const fileList = State<FileList | null>(null)
		const filenameExtractionRegex = State<RegExp | undefined>(undefined)
		const filenameExtractionRegexGroups = filenameExtractionRegex.mapManual(regex => {
			if (!regex)
				return undefined

			const match = new RegExp(`(?:${regex.source})|`).exec('')
			if ((match?.length ?? 0) <= 1)
				return undefined

			return match
		})
		const chapterNameTemplate = State<string | undefined>(undefined)
		const documentImportState = Documents.importFrom(view, fileList)
		const imports = documentImportState.state.map(view, imports => ({
			loading: !imports.settled,
			imports: (imports.value ?? []).map(file => ({ ...file, enabled: !file.error })),
		}))

		const getColour = (i: number) => `light-dark(oklch(30% 100% ${(100 + (60 * i)) % 360}deg), oklch(70% 100% ${(100 + (60 * i)) % 360}deg))`
		const getChapterName = (file: Documents.ImportDocument) => {
			const title = file.title
			if (!filenameExtractionRegex.value)
				return file.title

			const match = filenameExtractionRegex.value.exec(title)
			if (!match || (match.length <= 1 && match[0].length === title.length))
				return file.title

			return (chapterNameTemplate.value ?? '{filename}')
				.replaceAll(/{filename(?::(\d+))?}/g, (_, group) => {
					const varId = +group
					return isNaN(varId) ? title : match[varId] ?? ''
				})
		}

		const fileInput = Component('input')
			.style('view-type-chapter-bulk-import-list-actions-import-input')
			.attributes.set('type', 'file')
			.attributes.append('multiple')
			.event.subscribe('change', event => fileList.value = event.host.element.files)
			.appendTo(viewContent)

		const importTab = Tab()
			.text.use('view/chapter-create-bulk/import/tab')
			.addTo(tabinator)

		Block()
			.type('flush')
			.style('view-type-chapter-bulk-block', 'view-type-chapter-bulk-block--not-last')
			.tweak(block => block.title.text.use('view/chapter-create-bulk/import/title'))
			.tweak(block => block.description.text.use('view/chapter-create-bulk/import/description'))

			////////////////////////////////////
			//#region File Selection

			.tweak(block => block.content
				.style('view-type-chapter-bulk-import-list-wrapper')
				.append(Component()
					.style('view-type-chapter-bulk-import-list')
					.append(ActionRow()
						.style('view-type-chapter-bulk-import-list-actions')
						.tweak(row => {
							Button()
								.setIcon('file-import')
								.type('flush')
								.text.bind(fileList.map(row, list => quilt => quilt[list?.length ? 'view/chapter-create-bulk/import/action/replace' : 'view/chapter-create-bulk/import/action/select']()))
								.event.subscribe('click', () => fileInput.element.click())
								.appendTo(row.left)

							Button()
								.setIcon('square-check')
								.type('flush')
								.text.use('view/chapter-create-bulk/shared/action/select-all')
								.event.subscribe('click', () => {
									for (const file of imports.value.imports) {
										if (file.error)
											continue

										file.enabled = true
									}

									imports.emit()
								})
								.appendToWhen(
									imports.map(row, state => !state.imports.every(file => file.enabled)),
									row.right,
								)

							Button()
								.setIcon('square-minus')
								.type('flush')
								.text.use('view/chapter-create-bulk/shared/action/deselect-all')
								.event.subscribe('click', () => {
									for (const file of imports.value.imports) {
										if (file.error)
											continue

										file.enabled = false
									}

									imports.emit()
								})
								.appendToWhen(
									imports.map(row, state => state.imports.some(file => file.enabled)),
									row.right,
								)
						}))
					.append(Slot.using(imports, (slot, state) => {
						if (state.loading)
							return Loading()
								.style('view-type-chapter-bulk-import-list-loading')
								.use(documentImportState)

						const files = state.imports
						if (!files.length)
							return Placeholder()
								.style('view-type-chapter-bulk-import-list-empty-paragraph')
								.text.use('view/chapter-create-bulk/import/empty')

						let odd = true
						for (const file of files) {
							Details()
								.style('view-type-chapter-bulk-import')
								.style.toggle(odd = !odd, 'view-type-chapter-bulk-import--odd')
								.tweak(details => {
									details.style.bind(details.state, 'view-type-chapter-bulk-import--open')

									details.summary
										.style.remove('button')
										.style('view-type-chapter-bulk-import-summary')
										.style.bind(details.state, 'view-type-chapter-bulk-import-summary--open')

									const shouldDimDueToNotIncluded = details.summary.hoveredOrHasFocused.mapManual(focus => !focus && !file.enabled)
									const meta = Component()
										.style('view-type-chapter-bulk-import-summary-meta')
										.style.bind(shouldDimDueToNotIncluded, 'view-type-chapter-bulk-import-summary-meta--disabled')
										.appendTo(details.summary)

									if (file.title)
										Component()
											.style('view-type-chapter-bulk-import-summary-title')
											.text.bind(filenameExtractionRegex.map(meta, regex => {
												if (!regex)
													return file.title

												regex.lastIndex = 0
												const match = regex.exec(file.title)
												if (!match || !match[1] || !match[0])
													return file.title

												if (match[1]) {
													const result: Weave = { content: [] }
													let lastIndex = 0
													for (let i = 1; i < match.length; i++) {
														const [start, end] = match.indices![i]
														const beforeMatch = file.title.slice(lastIndex, start)
														lastIndex = end
														result.content.push(
															{ content: beforeMatch, tag: 'SM' },
															{
																content: Component('strong')
																	.style.setProperty('color', getColour(i))
																	.text.set(match[i]),
															},
														)
													}

													const afterMatch = file.title.slice(lastIndex)
													result.content.push({ content: afterMatch, tag: 'SM' })
													return quilt => result
												}

												const [start, end] = match.indices![0]
												const beforeMatch = file.title.slice(0, start)
												const afterMatch = file.title.slice(end)
												return quilt => ({
													content: [
														{ content: beforeMatch, tag: 'SM' },
														{ content: match[0], tag: 'B' },
														{ content: afterMatch, tag: 'SM' },
													],
												})
											}))
											.appendTo(meta)

									Placeholder()
										.style('view-type-chapter-bulk-import-summary-filename')
										.text.set(file.file)
										.appendTo(meta)

									if (file.error)
										Component()
											.style('view-type-chapter-bulk-import-summary-error')
											.text.set(file.error.message)
											.appendTo(meta)

									if (!file.error)
										Checkbutton()
											.type('flush')
											.style('view-type-chapter-bulk-import-summary-checkbox')
											.tweak(button => button.icon
												?.style('view-type-chapter-bulk-import-summary-checkbox-icon')
												.style.bind(button.hoveredOrHasFocused, 'view-type-chapter-bulk-import-summary-checkbox-icon--focus')
											)
											.setChecked(file.enabled)
											.event.subscribe('change', event => {
												file.enabled = event.host.checked.value
												imports.emit()
											})
											.appendTo(details.summary)

									if (file.body)
										Component()
											.style('view-type-chapter-bulk-import-body')
											.setMarkdownContent(file.body, 512, false)
											.appendTo(details)
								})
								.event.subscribe('toggle', event => {
									if (event.host.state.value) {
										event.host.element.scrollIntoView({ behavior: 'smooth' })
										block.header.element.scrollIntoView({ behavior: 'smooth' })
									}
								})
								.appendTo(slot)
						}
					}))))

			//#endregion
			////////////////////////////////////

			.tweak(block => block.footer
				.style('view-type-chapter-bulk-import-list-wrapper-footer')
				.tweak(footer => {
					const hasFiles = fileList.map(footer, list => !!list?.length)

					////////////////////////////////////
					//#region Advanced

					Details()
						.style('view-type-chapter-bulk-import-list-wrapper-footer-config-details')
						.tweak(details => {
							details.style.bind(details.state, 'view-type-chapter-bulk-import-list-wrapper-footer-config-details--open')
							details.summary
								.style('view-type-chapter-bulk-import-list-wrapper-footer-config-button')
								.text.use('view/chapter-create-bulk/import/action/config')
								.tweak(summary => details.state.use(summary, open => summary.setIcon(open ? 'angles-up' : 'angles-down')))
						})
						.append(Block()
							.style('view-type-chapter-bulk-import-list-wrapper-footer-config')
							.tweak(block => block.content.and(LabelledTable)
								.label(label => label.text.use('view/chapter-create-bulk/import/form/filename/label'))
								.content((content, label) => content
									.append(TextInput()
										.setLabel(label)
										.placeholder.set('(.*)')
										.setValidityHandler(input => !input.value || filenameExtractionRegexGroups.value ? undefined
											: quilt => quilt['view/chapter-create-bulk/import/form/filename/invalid']())
										.tweak(input => input.state.useManual(value => filenameExtractionRegex.value = Strings.optionalParseRegex(value, 'd')))
									)
									.append(Small()
										.text.bind(filenameExtractionRegexGroups.map(content, groups => {
											return quilt => quilt['view/chapter-create-bulk/import/form/filename/variables'](...[...groups ?? ['']]
												.map((groupStr, group) => !group
													? Component().style.setProperty('color', 'var(--colour-3)').text.set('{filename}')
													: Component().style.setProperty('color', getColour(group)).text.set(`{filename:${group}}`)
												)
												.slice((groups?.length ?? 0) > 1 ? 1 : 0)
											)
										}))
									)
								)
								.label(label => label.text.use('view/chapter-create-bulk/import/form/name/label'))
								.content((content, label) => content
									.append(TextInput()
										.setLabel(label)
										.placeholder.set('{filename}')
										.setValidityHandler(input => {
											if (input.length.value && !/\{filename(:\d+)\}/.test(input.value))
												return quilt => quilt['view/chapter-create-bulk/import/form/name/invalid']()
										})
										.tweak(input => input.state.useManual(value => chapterNameTemplate.value = value || undefined))
									)
									.append(Small()
										.text.bind(State
											.Generator((): Quilt.Handler => {
												const files = imports.value.imports.filter((file): file is Documents.ImportDocument & { enabled: boolean } => !file.error && file.enabled)

												const titles: Weave[] = []
												for (let i = 0; i < Math.min(files.length, 5); i++)
													titles.push({ content: [{ content: getChapterName(files[i]), tag: 'B' }] })

												return quilt => quilt['view/chapter-create-bulk/import/form/name/examples'](...titles)
											})
											.observe(content, imports, filenameExtractionRegexGroups, chapterNameTemplate)
										)
									)
								)
							))
						.prependToWhen(hasFiles, footer)

					//#endregion
					////////////////////////////////////

					Button()
						.setIcon('xmark')
						.text.use('view/chapter-create-bulk/import/action/clear')
						.event.subscribe('click', () => {
							fileInput.element.value = ''
							fileList.value = null
						})
						.appendToWhen(hasFiles, footer.right)

					Button()
						.type('primary')
						.bindDisabled(imports.map(footer, state => !state.imports.some(filter => filter.enabled)), 'no enabled documents')
						.text.use('view/chapter-create-bulk/import/action/import')
						.event.subscribe('click', () => {
							for (const file of imports.value.imports) {
								if (file.error || !file.enabled)
									continue

								chapterFormData.push({
									open: false,
									selected: false,
									body: {
										name: getChapterName(file),
										body: file.body,
										visibility: 'Private',
									},
								})
							}

							chapterFormData.emit()

							importTab.showNextTab()
						})
						.appendTo(footer.right)
				})

			)
			.appendToWhen(state.falsy, importTab.content)

		//#endregion
		////////////////////////////////////

		////////////////////////////////////
		//#region Create Chapters

		interface ChapterForm {
			open: boolean
			selected: boolean
			body: ChapterCreateBody
		}

		const chapterFormData = State.Array<ChapterForm>()
		const hasSelectedChapter = chapterFormData.mapManual(chapters => chapters.some(chapter => chapter.selected))
		const hasUnselectedChapter = chapterFormData.mapManual(chapters => chapters.some(chapter => !chapter.selected))

		interface ChapterDetailsExtensions {
			readonly chapter: ChapterForm
			readonly index: State<number>
		}

		interface ChapterDetails extends Details, ChapterDetailsExtensions { }

		interface ChapterDetailsAPINumber {
			url: string
			chapterNumber: number
			interludeNumber: number
		}

		interface ChapterDetailsAPI {
			readonly index: State<number>
			readonly number: State<ChapterDetailsAPINumber>
			closeAllSiblings (filter?: (details: Details) => boolean): void
		}

		interface FocusRestore {
			readonly index: number
			readonly time: number
		}
		let restoreFocusTo: FocusRestore | undefined
		////////////////////////////////////
		//#region Chapter Component

		const ChapterDetails = Component
			.Builder('details', (component, chapter: ChapterForm, api: ChapterDetailsAPI): ChapterDetails => {
				return component
					.and(Details)
					.and(Block)
					.style('view-type-chapter-bulk-create-chapter')
					.tweak(details => {
						details.state.value = chapter.open
						details.state.subscribeManual(open => {
							if (open)
								api.closeAllSiblings(d => d !== details)

							chapter.open = open
						})

						hasSelectedChapter.use(details, selected => {
							if (selected)
								details.state.value = false
						})

						details.style.bind(details.state.falsy, 'view-type-chapter-bulk-create-chapter--closed')

						Object.assign(details, { header: details.summary.style('block-header') })
						details.summary
							.style('view-type-chapter-bulk-create-chapter-summary')
							.style.bind(details.state, 'view-type-chapter-bulk-create-chapter-summary--open')
							.style.bind(details.state.falsy, 'view-type-chapter-bulk-create-chapter-summary--closed')
							.style.toggle(chapter.body.visibility === 'Patreon', 'view-type-chapter-bulk-create-chapter-summary--patreon')
							.style.toggle(chapter.body.visibility === 'Private', 'view-type-chapter-bulk-create-chapter-summary--private')
							.append(Slot.using(api.number, (slot, number) => ChapterDisplay(number.url, chapter.body.name)
								.style.remove('slot')
								.append(chapter.body.visibility !== 'Patreon' || !chapter.body.tier_ids?.length ? undefined
									: Component()
										.style('view-type-chapter-bulk-create-chapter-summary-patreon', 'patreon-icon-before')
										.text.use(Patreon.translateTiers(chapter.body.tier_ids, Session.Auth.author?.value?.patreon_campaign?.tiers ?? []))
								)
								.append(chapter.body.visibility !== 'Private' ? undefined
									: Placeholder()
										.style('view-type-chapter-bulk-create-chapter-summary-private')
										.text.use('view/chapter-create-bulk/create/visibility/private')
								)
							))
							.event.subscribe('click', event => {
								const activeClosestButton = document.activeElement?.component?.closest(Button)
								if (activeClosestButton === selected) {
									event.preventDefault()
									selected.setChecked(!selected.checked.value)
									details.element.scrollIntoView({ behavior: 'smooth' })
									event.host.focus()
									return
								}

								if (event.targetComponent?.closest(Button) !== event.host)
									return

								if (!hasSelectedChapter.value)
									// use default summary click functionality
									return

								event.preventDefault()
								selected.setChecked(!selected.checked.value)
							})

						const selected = Checkbutton()
							.style('view-type-chapter-bulk-create-chapter-summary-checkbox')
							.setChecked(chapter.selected)
							.attributes.bind(hasSelectedChapter, 'inert')
							.tweak(button => button.checked.subscribeManual(checked => {
								chapter.selected = checked
								chapterFormData.emit()
							}))
							.event.subscribe('click', event => event.stopPropagation())
							.prependTo(details.summary)

						details.style.bind(State.Every(component, hasSelectedChapter, selected.checked.falsy),
							'view-type-chapter-bulk-create-chapter--has-selected-sibling')

						details.state.matchManual(true, async () => {
							const chapterState = State<ChapterCreateBody | undefined>(chapter.body)
							const form = ChapterEditForm.Content(chapterState)
								.appendTo(details)

							form.numbered.selection.subscribe(details, selection => {
								const newIsNumbered = !selection || selection === 'numbered'
								if (chapter.body.is_numbered !== newIsNumbered) {
									chapter.body.is_numbered = newIsNumbered
									chosenPosition.emit() // trigger all details to update their numbers
								}
							})

							await Task.yield()
							details.element.scrollIntoView()
						})

						component.onRooted(async () => {
							if (!restoreFocusTo)
								return

							const elapsed = Date.now() - restoreFocusTo.time
							if (elapsed > 300) {
								restoreFocusTo = undefined
								return
							}

							if (api.index.value !== restoreFocusTo.index)
								return

							restoreFocusTo = undefined
							await Task.yield()
							details.summary.focus()
						})
					})
					.extend<ChapterDetailsExtensions>(details => ({
						chapter,
						index: api.index,
					}))
			})
			.setName('ChapterDetails')

		//#endregion
		////////////////////////////////////

		const createTab = Tab()
			.text.use('view/chapter-create-bulk/create/tab')
			.addTo(tabinator)

		Block()
			.type('flush')
			.style('view-type-chapter-bulk-block', 'view-type-chapter-bulk-block--not-last')
			.tweak(block => block.title.text.use('view/chapter-create-bulk/create/title'))
			.tweak(block => block.description.text.use('view/chapter-create-bulk/create/description'))
			.tweak(block => block.content
				.style('view-type-chapter-bulk-create')

				.append(InsertionPositionDisplay())

				.append(SlotArray().use(chapterFormData, (slot, chapter) => {
					////////////////////////////////////
					//#region Construction

					return ChapterDetails(chapter, {
						index: slot.index,
						number: State.Map(slot, [slot.index, chosenPosition], (ownIndex, bulkInsertionPosition) => {
							const relativeToChapterUrl = bulkInsertionPosition?.relative_to ?? work.last_chapter ?? '0'
							let chapterN = parseInt(relativeToChapterUrl) || 0
							let interludeN = +relativeToChapterUrl - chapterN

							if (bulkInsertionPosition?.position === 'before') {
								if (interludeN)
									interludeN = Math.max(0, interludeN - 1)
								else
									chapterN = Math.max(0, chapterN - 1)
							}

							for (let i = 0; i <= ownIndex; i++) {
								const chapter = chapterFormData.value[i]
								if (chapter.body.is_numbered ?? true)
									chapterN++, interludeN = 0
								else
									interludeN++
							}

							return {
								chapterNumber: chapterN,
								interludeNumber: interludeN,
								url: `${chapterN}${interludeN ? `.${interludeN}` : ''}`,
							}
						}),
						closeAllSiblings (filter?: (details: ChapterDetails) => boolean) {
							for (const closingDetails of slot.wrapper.getDescendants(ChapterDetails)) {
								if (filter && !filter(closingDetails))
									continue

								closingDetails.chapter.open = false
								closingDetails.state.value = false
							}
						},
					})

					//#endregion
					////////////////////////////////////
				}))

				.appendWhen(chapterFormData.length.truthy, ActionRow()
					.style('view-type-chapter-bulk-create-selection-actions')
					////////////////////////////////////
					//#region Select/Deselect

					.tweak(row => row.left
						.appendWhen(hasUnselectedChapter, Button()
							.setIcon('square-check')
							.type('flush')
							.text.use('view/chapter-create-bulk/shared/action/select-all')
							.event.subscribe('click', () => {
								for (let i = 0; i < chapterFormData.length.value; i++) {
									const chapter = chapterFormData.value[i]
									if (!chapter.selected) {
										chapter.selected = true
										chapterFormData.emitItem(i)
									}
								}

								chapterFormData.emit()
							})
						)
						.appendWhen(hasSelectedChapter, Button()
							.setIcon('square-minus')
							.type('flush')
							.text.use('view/chapter-create-bulk/shared/action/deselect-all')
							.event.subscribe('click', () => {
								for (let i = 0; i < chapterFormData.length.value; i++) {
									const chapter = chapterFormData.value[i]
									if (chapter.selected) {
										chapter.selected = false
										chapterFormData.emitItem(i)
									}
								}

								chapterFormData.emit()
							})
						)
					)

					//#endregion
					////////////////////////////////////
					.appendWhen(hasSelectedChapter, Details()
						.style('view-type-chapter-bulk-create-selection-actions-details')
						.tweak(details => details.summary
							.style('view-type-chapter-bulk-create-selection-actions-summary')
							.type('flush')
							.setIcon('ellipsis-vertical')
							.text.use('view/chapter-create-bulk/create/action/actions')
						)
						.append(Tabinator()
							.style('view-type-chapter-bulk-create-selection-actions-details-tabinator')
							.allowNoneVisible()

							////////////////////////////////////
							//#region Action Selection

							.tweak(tabinator => {
								hasSelectedChapter.subscribe(tabinator, hasSelected => {
									if (!hasSelected)
										tabinator.showNone()
								})

								InputBus.until(tabinator, bus => bus.subscribe('down', event => {
									const selection = getSelection()

									if (event.use('ArrowUp', 'ctrl')) {
										const moveTo = Math.max(0,
											Maths.isIncrementing(selection)
												? Math.min(...selection) - 1
												: Math.min(...selection)
										)
										restoreFocusTo = { index: moveTo, time: Date.now() }
										chapterFormData.moveAt(selection, moveTo)
									}

									if (event.use('ArrowDown', 'ctrl')) {
										const selection = getSelection()
										const moveTo = Math.min(chapterFormData.length.value - 1,
											Maths.isIncrementing(selection)
												? Math.min(...selection) + 1
												: Math.max(...selection) - selection.length + 1
										)
										restoreFocusTo = { index: moveTo, time: Date.now() }
										chapterFormData.moveAt(selection, moveTo)
									}

									function getSelection () {
										const focusedChapter = event.targetComponent?.parent?.as(ChapterDetails)?.chapter
										const focusedChapterIndex = chapterFormData.value.indexOf(focusedChapter!)
										return chapterFormData.value.entries()
											.filter(([, chapter]) => chapter.selected)
											.map(([i]) => i)
											.toArray()
											.concat(...focusedChapterIndex === -1 ? [] : [focusedChapterIndex])
											.distinctInPlace()
											.sort((a, b) => a - b)
									}
								}))
							})

							//#endregion
							////////////////////////////////////

							////////////////////////////////////
							//#region Visibility

							.addTab(Tab()
								.text.use('view/chapter-create-bulk/create/action/tab/visibility')
								.tweak(tab => {
									tab.content.style('view-type-chapter-bulk-create-selection-actions-details-tabinator-tab-content')

									const table = LabelledTable()
										.appendTo(tab.content)

									const { visibility, threshold } = ChapterEditForm.applyVisibilityOptions(table, State(undefined))

									chapterFormData.use(visibility, chapters => {
										const visibilities = chapters.filter(chapter => chapter.selected).map(chapter => chapter.body.visibility).distinct()
										visibility.default.set(visibilities.length === 1 ? visibilities[0] : null)
									})

									ActionRow()
										.style('view-type-chapter-bulk-create-selection-actions-details-tabinator-tab-content-actions')
										.tweak(row => row.right.append(Button()
											.type('primary')
											.text.use('view/chapter-create-bulk/create/action/apply')
											.event.subscribe('click', () => {
												if (!visibility.selection.value)
													return

												for (let i = 0; i < chapterFormData.length.value; i++) {
													const chapter = chapterFormData.value[i]
													if (!chapter.selected)
														continue

													chapter.body.visibility = visibility.selection.value
													chapter.body.tier_ids = threshold?.selection.value
													chapterFormData.emitItem(i)
												}

												chapterFormData.emit()
											})
										))
										.appendTo(tab.content)
								}))

							//#endregion
							////////////////////////////////////

							////////////////////////////////////
							//#region Remove

							.tweak(tabinator => tabinator.header.append(Button()
								.style('view-type-chapter-bulk-create-selection-actions-details-right-button')
								.setIcon('xmark')
								.type('flush')
								.text.use('view/chapter-create-bulk/create/action/remove')
								.event.subscribe('click', async event => {
									const selectedChapters = chapterFormData.value
										.filter(chapter => chapter.selected)
									const confirmed = await ConfirmDialog.prompt(event.host, {
										bodyTranslation: quilt => quilt['view/chapter-create-bulk/create/action/remove/confirm'](
											selectedChapters
												.map(chapter => chapter.body.name)
												.slice(0, 5) as any as WeavingArg,
											Math.max(0, selectedChapters.length - 5),
										),
									})
									if (!confirmed)
										return

									chapterFormData.filterInPlace(chapter => !chapter.selected)
								})
							))

							//#endregion
							////////////////////////////////////
						)
					)
				)

				.append(ActionRow()
					.style('view-type-chapter-bulk-step-action-row')
					.tweak(row => row.right.append(createTab.createNextButton())))
			)
			.appendToWhen(state.falsy, createTab.content)

		//#endregion
		////////////////////////////////////

		////////////////////////////////////
		//#region Upload

		const uploadTab = Tab()
			.text.use('view/chapter-create-bulk/upload/tab')
			.bindDisabled(chapterFormData.length.falsy, 'no chapters')
			.addTo(tabinator)

		Block()
			.type('flush')
			.style('view-type-chapter-bulk-block')
			.tweak(block => block.title.text.use('view/chapter-create-bulk/upload/title'))
			.tweak(block => block.description.text.use('view/chapter-create-bulk/upload/description'))
			.tweak(block => {
				const uploadingState = State.Async(block, state, async (currentState, signal, setProgress) => {
					////////////////////////////////////
					//#region Uploading

					if (!currentState || currentState.done)
						return

					setProgress(0, quilt => quilt['view/chapter-create-bulk/upload/loading/clearing']())
					const cancelResponse = await EndpointChapterCreateBulkCancel.query({ params: work })
					if (toast.handleError(cancelResponse))
						return resetUploadState()

					for (let i = 0; i < currentState.chapters.length; i++) {
						if (signal.aborted)
							return

						const chapter = currentState.chapters[i]

						setProgress(i / (currentState.chapters.length + 2), quilt => quilt['view/chapter-create-bulk/upload/loading/queuing'](chapter.body.name, i, currentState.chapters.length))
						const response = await EndpointChapterCreateBulkQueue.query({
							params: work,
							body: {
								name: chapter.body.name,
								body: chapter.body.body,
								visibility: chapter.body.visibility,
								is_numbered: chapter.body.is_numbered,
								notes_before: chapter.body.notes_before,
								notes_after: chapter.body.notes_after,
							},
						})
						if (toast.handleError(response))
							return resetUploadState()
					}

					if (signal.aborted)
						return

					setProgress((currentState.chapters.length + 1) / (currentState.chapters.length + 2), quilt => quilt['view/chapter-create-bulk/upload/loading/finishing']())

					const confirmed = await ConfirmDialog.ensureDangerToken(block, { dangerToken: 'chapter-create-bulk' })
					if (!confirmed)
						return resetUploadState()

					const finishResponse = await EndpointChapterCreateBulkFinish.query({
						params: work,
						body: {
							position: currentState.position && {
								relative_to: currentState.position.relative_to,
								position: currentState.position.position,
							},
							chapters: currentState.chapters.map(chapter => ({
								tier_ids: chapter.body.tier_ids,
								custom_tags: chapter.body.custom_tags,
								global_tags: chapter.body.global_tags,
							}) as QueuedChapterFinalise),
						},
					})
					if (toast.handleError(finishResponse))
						return resetUploadState()

					state.value = { done: true }

					//#endregion
					////////////////////////////////////
				})

				Component()
					.style('view-type-chapter-bulk-import-list-wrapper')
					.append(Component()
						.style('view-type-chapter-bulk-import-list',)
						.appendWhen(state.map(block, state => state?.done === false),
							Loading().use(uploadingState)
								.style('view-type-chapter-bulk-import-list-loading')
						)
						.appendWhen(state.falsy, Component()
							.style('view-type-chapter-bulk-upload-box')
							.append(Button()
								.type('primary')
								.text.use('view/chapter-create-bulk/upload/action/upload')
								.event.subscribe('click', () => state.value = {
									chapters: chapterFormData.value,
									position: chosenPosition.value,
									done: false,
								})
							))
						.appendWhen(state.map(block, state => !!state?.done), Component()
							.style('view-type-chapter-bulk-upload-box')
							.append(
								Paragraph()
									.text.use('view/chapter-create-bulk/upload/notice/complete'),
								Button()
									.type('primary')
									.text.use(quilt => quilt['view/chapter-create-bulk/upload/action/return'](work.name))
									.event.subscribe('click', () =>
										navigate.toURL(`/work/${work.author}/${work.vanity}`)
									),
							))
					)
					.appendTo(block.content)

				function resetUploadState () {
					state.value = undefined
					block.element.scrollIntoView()
				}
			})
			.appendToWhen(chapterFormData.length.truthy, uploadTab.content)

		//#endregion
		////////////////////////////////////

		return view
	},
})
