import type { ChapterReference, Work as WorkData, WorkMetadata } from 'api.fluff4.me'
import EndpointChapterGet from 'endpoint/chapter/EndpointChapterGet'
import EndpointChapterGetPaged from 'endpoint/chapter/EndpointChapterGetPaged'
import EndpointHistoryAddChapter from 'endpoint/history/EndpointHistoryAddChapter'
import EndpointReactChapter from 'endpoint/reaction/EndpointReactChapter'
import EndpointSupporterReactChapter from 'endpoint/reaction/EndpointSupporterReactChapter'
import EndpointSupporterUnreactChapter from 'endpoint/reaction/EndpointSupporterUnreactChapter'
import EndpointUnreactChapter from 'endpoint/reaction/EndpointUnreactChapter'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import Chapters from 'model/Chapters'
import PagedData from 'model/PagedData'
import Patreon from 'model/Patreon'
import Session from 'model/Session'
import TextBody from 'model/TextBody'
import Component from 'ui/Component'
import AuthorLink from 'ui/component/AuthorLink'
import Chapter from 'ui/component/Chapter'
import Comments from 'ui/component/Comments'
import Button from 'ui/component/core/Button'
import GradientText from 'ui/component/core/ext/GradientText'
import ExternalLink from 'ui/component/core/ExternalLink'
import Heading from 'ui/component/core/Heading'
import Icon from 'ui/component/core/Icon'
import Link from 'ui/component/core/Link'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Timestamp from 'ui/component/core/Timestamp'
import PatronAuthDialog from 'ui/component/PatronAuthDialog'
import Reaction from 'ui/component/Reaction'
import Statistics from 'ui/component/Statistics'
import Tags from 'ui/component/Tags'
import type { TagsState } from 'ui/component/TagsEditor'
import Work from 'ui/component/Work'
import Viewport from 'ui/utility/Viewport'
import PaginatedView from 'ui/view/shared/component/PaginatedView'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTitle from 'ui/view/shared/ext/ViewTitle'
import Maths from 'utility/maths/Maths'
import Objects from 'utility/Objects'
import Random from 'utility/Random'
import Settings from 'utility/Settings'
import State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

const tag = () => Viewport.state.value
const tweakState = (state: State.Generator<number | boolean>) => state.observeManual(Viewport.state)
const settings = Settings.registerGroup('settings/chapter/name', {
	fontSize: Settings.number({
		tag, tweakState,
		name: 'settings/chapter/font-size/name',
		description: 'settings/chapter/font-size/description',
		default: 1,
		min: 0.5,
		max: 3,
		step: 0.1,
	}),
	lineHeight: Settings.number({
		tag, tweakState,
		name: 'settings/chapter/line-height/name',
		description: 'settings/chapter/line-height/description',
		default: 1.4,
		min: 1,
		max: 3,
		step: 0.1,
	}),
	paragraphGap: Settings.number({
		tag, tweakState,
		name: 'settings/chapter/paragraph-gap/name',
		description: 'settings/chapter/paragraph-gap/description',
		default: 1,
		min: 0,
		max: 10,
		step: 0.5,
	}),
	justified: Settings.boolean({
		tag, tweakState,
		name: 'settings/chapter/text-align/name',
		description: 'settings/chapter/text-align/description',
		default: false,
	}),
})

export default ViewDefinition({
	async load (params: ChapterReference) {
		const response = await EndpointWorkGet.query({ params: Chapters.work(params) })
		if (response instanceof Error)
			throw response

		const initialChapterResponse = await EndpointChapterGet.query({ params })
		if (initialChapterResponse instanceof Error)
			throw initialChapterResponse

		return { workData: response.data as WorkMetadata & Partial<WorkData>, initialChapterResponse }
	},
	create (params: ChapterReference, { workData, initialChapterResponse }) {
		const view = PaginatedView('chapter')

		const author = workData.synopsis?.mentions.find(author => author.vanity === workData.author)
		delete workData.synopsis
		delete workData.custom_tags

		view.breadcrumbs.setBackButton(
			`/work/${workData.author}/${workData.vanity}`,
			button => button.subText.set(workData.name),
		)

		Link(`/work/${author?.vanity}/${workData.vanity}`)
			.and(Work, workData, author)
			.tweak(work => work.statistics.remove())
			.viewTransition('chapter-view-work')
			.style('view-type-chapter-work')
			.setContainsHeading()
			.appendTo(view.content)

		const chapterState = State(initialChapterResponse.data)
		const isOwn = Session.Auth.loggedInAs(view, workData.author)
		const sufficientPledge = chapterState.mapManual(chapter => !chapter.insufficient_pledge)
		const shouldShowPatreon = State.Some(view, isOwn.truthy, sufficientPledge.falsy)

		const chapters = PagedData.fromEndpoint(EndpointChapterGetPaged.prep({ params: { author: workData.author, work: workData.vanity } }))
		chapters.set(initialChapterResponse.page, initialChapterResponse.data, !initialChapterResponse.has_more)
		chapters.setPageCount(initialChapterResponse.page_count)

		const paginator = view.paginator()
			.viewTransition('chapter-view-chapter')
			.style('view-type-chapter-block')
			.style.bindVariable('chapter-font-size-multiplier', settings.fontSize.state)
			.style.bindVariable('chapter-line-height', settings.lineHeight.state)
			.style.bindVariable('chapter-paragraph-gap-multiplier', settings.paragraphGap.state)
			.style.bindVariable('align-left-preference', settings.justified.state.map(view, justified => justified ? 'justify' : 'left'))
			.type('flush')
			.event.subscribe('PageError', () => Session.refresh())
			.tweak(paginator => {
				const url = chapterState.mapManual(chapter => chapter.url)
				const chapterName = chapterState.mapManual(chapter => chapter.name)
				const number = url.mapManual(url => Maths.parseIntOrUndefined(url))
				paginator.title
					.and(ViewTitle)
					.style('view-type-chapter-block-title')
					.text.bind(State.MapManual([chapterName, url, number], (name, url, chapterNumber) => _
						|| name
						|| (!chapterNumber ? undefined : quilt => quilt['view/chapter/number/label'](chapterNumber))
						|| (url?.includes('.') ? quilt => quilt['view/chapter/number/interlude/label'](url) : undefined)
					))

				paginator.primaryActions.style('view-type-chapter-block-actions')

				Slot()
					.if(State.Every(paginator, chapterName.truthy, number.mapManual(number => number !== undefined)), () => Heading()
						.setAestheticStyle(false)
						.style('view-type-chapter-block-number-label')
						.style.bind(chapterName.falsy, 'view-type-chapter-block-number-label--auto-named-chapter')
						.text.bind(number.mapManual(number => quilt => quilt['view/chapter/number/label'](number))))
					.prependTo(paginator.header)
			})
			.appendTo(view.content)
			.tweak(p => p.page.value = initialChapterResponse.page)
			.set(chapters, (slot, chapter, page, chapters, paginator) => {
				paginator.setURL(`/work/${workData.author}/${workData.vanity}/chapter/${chapter.url}`)

				if (Session.Auth.loggedIn.value)
					void EndpointHistoryAddChapter.query({ params: chapter })

				const isOwnWork = Session.Auth.loggedInAs(slot, workData.author)
				Slot().appendTo(slot).if(isOwnWork, slot => Statistics()
					.style('view-type-chapter-block-author-statistics')
					.section('shared/stat/section/logged-in', section => section
						.stat('chapter/stat/reads/label', chapter.statistics?.read_count)
						.stat('chapter/stat/hearts/label', chapter.statistics?.reaction_count)
						.stat('chapter/stat/comments/label', chapter.statistics?.comment_count)
					)
					.section('shared/stat/section/logged-out', section => section
						.stat('chapter/stat/visits/label', chapter.statistics?.visits ? BigInt(chapter.statistics.visits) : undefined,
							label => label.content.append(Component()
								.text.use(quilt => quilt['shared/stat/tracking-since'](Timestamp('19 June 2025 21:53 GMT+12')))
							)
						)
					)
				)

				if (chapter.notes_before || chapter.global_tags?.length || chapter.custom_tags?.length)
					Component()
						.style('view-type-chapter-block-notes', 'view-type-chapter-block-notes-before')
						.setMarkdownContent(TextBody.resolve(chapter.notes_before, chapter.mentions))
						.prepend(chapter.notes_before && Component()
							.style('view-type-chapter-block-notes-label')
							.text.use('view/chapter/notes/label'))
						.append((chapter.global_tags?.length || chapter.custom_tags?.length) && Component()
							.style('view-type-chapter-block-notes-label', 'view-type-chapter-block-tags-title')
							.text.use('view/chapter/tags/label'))
						.append(Tags()
							.set(chapter as TagsState)
							.style('view-type-chapter-block-tags'))
						.appendTo(slot)

				const isPatreon = chapter.visibility === 'Patreon' || workData.visibility == 'Patreon'
				const patreonRestriction = Patreon.getMoreRestrictive(chapter.patreon?.tiers, workData.patreon?.tiers)
				if (isPatreon)
					Slot().if(shouldShowPatreon, () =>
						Component()
							.style('view-type-chapter-block-patreon-header')
							.append(Component()
								.style('view-type-chapter-block-patreon-header-label')
								.text.use('view/chapter/patreon/label'))
							.append(Heading()
								.style('view-type-chapter-block-patreon-header-title')
								.setAestheticStyle(false)
								.removeContents()
								.append(
									Component()
										.text.use(Patreon.translateTier(patreonRestriction[0])),
									Slot()
										.style.remove('slot')
										.style('view-type-chapter-block-patreon-header-actions')
										.if(isOwn.falsy, slot => {
											if (!patreonRestriction)
												return

											Slot()
												.if(Session.Auth.loggedIn, slot => {
													Button()
														.style('view-type-chapter-block-patreon-header-button')
														.text.bind(Session.Auth.author.map(slot, author =>
															!author?.patreon_patron
																? quilt => quilt['view/chapter/action/auth-to-patreon']()
																: quilt => quilt['view/chapter/action/unlink-patreon'](author.patreon_patron!.display_name)))
														.event.subscribe('click', () => PatronAuthDialog.auth(slot))
														.appendTo(slot)

													ExternalLink(chapter.patreon?.campaign.url)
														.and(Button)
														.attributes.remove('type')
														.style('view-type-chapter-block-patreon-header-button')
														.text.use('view/chapter/action/become-patron')
														.appendTo(slot)
												})
												.else(() => Placeholder()
													.style('view-type-chapter-block-patreon-header-placeholder')
													.text.use('view/chapter/placeholder/login-for-patreon'))
												.appendTo(slot)
										}),
								)))
						.appendTo(slot)

				Component()
					.style('view-type-chapter-block-body')
					.setMarkdownContent(chapter.body ?? '')
					.appendTo(slot)

				if (chapter.notes_after)
					Component()
						.style('view-type-chapter-block-notes', 'view-type-chapter-block-notes-after')
						.setMarkdownContent(TextBody.resolve(chapter.notes_after, chapter.mentions))
						.prepend(chapter.notes_after && Component()
							.style('view-type-chapter-block-notes-label')
							.text.use('view/chapter/notes/label'))
						.appendTo(slot)

				Slot()
					.if(isOwn, () => isPatreon && Component()
						.style('view-type-chapter-block-patreon-footer'))
					.appendTo(slot)
			})

		paginator.header.style('view-type-chapter-block-header')
		paginator.content.style('view-type-chapter-block-content')

		paginator.header.setActionsMenu(popover => {
			Chapter.initActions(popover, chapterState, workData, author, true)

			popover.subscribeReanchor((actionsMenu, isTablet) => {
				if (isTablet)
					return

				actionsMenu.anchor.reset()
					.anchor.add('off right', 'centre')
					.anchor.orElseHide()
			})
		})

		const reactions = chapterState.mapManual(chapter => chapter.reactions ?? 0)
		const guestReactions = chapterState.mapManual(chapter => chapter.guest_reactions ?? 0)
		const supporterReactions = chapterState.mapManual(chapter => chapter.supporter_reactions?.length ?? 0)
		const reactedNormal = chapterState.mapManual(chapter => !!chapter.reacted && !!Session.Auth.author.value)
		const reactedGuest = chapterState.mapManual(chapter => !!chapter.reacted && !Session.Auth.author.value)
		const reactedSupporter = chapterState.mapManual(chapter => !!chapter.supporter_reactions?.some(reaction => reaction?.author === Session.Auth.author.value?.vanity))
		const reactingNormal = State(false)
		const reactingSupporter = State(false)
		const reactingGuest = State(false)

		const ReactionButtons = () => Slot()
			.style.remove('slot')
			.style('reaction-button-list')
			.if(sufficientPledge, slot => Slot()

				////////////////////////////////////
				//#region Reaction Buttons

				////////////////////////////////////
				//#region Supporter Reaction
				.appendWhen(supporterReactions.map(slot, reactions => !!reactions || !!Session.Auth.author.value?.supporter?.tier),
					Reaction('supporter_heart', supporterReactions, reactedSupporter, reactingSupporter)
						.tweak(reaction => reaction.icon.setDisabled(!Session.Auth.author.value?.supporter?.tier, 'not a supporter'))
						.and(GradientText, 'heart-gradient', '115deg')
						.useGradient(Session.Auth.author.map(slot, author => author?.supporter?.username_colours))
						.setTooltip(tooltip => {
							Component().text.use('chapter/reaction/supporter-heart').appendTo(tooltip)
							const list = Slot().style.remove('slot').appendTo(tooltip)
							list.use(chapterState, (slot, chapter) => {
								if (!chapter.supporter_reactions?.length)
									return

								const reactions = Random.shuffle(chapter.supporter_reactions)
								const detailed = chapter.supporter_reactions.length < 5

								list.style('view-type-chapter-block-supporter-reaction-list')
									.style.toggle(detailed, 'view-type-chapter-block-supporter-reaction-list--detailed')
									.style.toggle(!detailed, 'view-type-chapter-block-supporter-reaction-list--compressed')

								if (detailed)
									for (const reaction of reactions) {
										const author = chapter.mentions?.find(author => author.vanity === reaction?.author)
										if (!author)
											continue

										Component()
											.style('view-type-chapter-block-supporter-reaction-detailed')
											.append(Icon('supporter-heart')
												.style('view-type-chapter-block-supporter-reaction')
												.and(GradientText, 'heart-gradient', '115deg')
												.useGradient(author?.supporter?.username_colours)
											)
											.append(AuthorLink(author))
											.appendTo(slot)
									}
								else
									for (const reaction of reactions)
										Icon('supporter-heart')
											.style('view-type-chapter-block-supporter-reaction')
											.and(GradientText, 'heart-gradient', '115deg')
											.useGradient(chapter.mentions?.find(author => author.vanity === reaction?.author)?.supporter?.username_colours)
											.appendTo(slot)
							})
						})
						.event.subscribe('click', async () => {
							if (!Session.Auth.loggedIn.value || reactingSupporter.value)
								return

							const params = { ...Chapters.reference(chapterState.value), type: 'heart' } as const
							if (reactedSupporter.value) {
								reactingSupporter.value = true
								const response = await EndpointSupporterUnreactChapter.query({ params })
								reactingSupporter.value = false
								if (toast.handleError(response))
									return

								chapterState.value.supporter_reactions?.filterInPlace(reaction => reaction?.author !== Session.Auth.author.value?.vanity)

								chapterState.emit()
							}
							else {
								reactingSupporter.value = true
								const response = await EndpointSupporterReactChapter.query({ params })
								reactingSupporter.value = false
								if (toast.handleError(response))
									return

								const supporterReactions = chapterState.value.supporter_reactions ??= []
								supporterReactions.push({
									author: Session.Auth.author.value!.vanity,
									reaction_type: 'heart',
								})

								chapterState.emit()
							}
						})
				)
				//#endregion
				////////////////////////////////////

				////////////////////////////////////
				//#region Normal Reaction
				.appendWhen(reactions.map(slot, reactions => !!reactions || !!Session.Auth.author.value),
					Reaction('love', reactions, reactedNormal, reactingNormal)
						.tweak(reaction => reaction.icon.setDisabled(!Session.Auth.author.value, 'not logged in'))
						.setTooltip(tooltip => tooltip.text.use('chapter/reaction/normal-heart'))
						.event.subscribe('click', async () => {
							if (!Session.Auth.loggedIn.value || reactingNormal.value)
								return

							const params = { ...Chapters.reference(chapterState.value), type: 'love' } as const
							if (reactedNormal.value) {
								reactingNormal.value = true
								const response = await EndpointUnreactChapter.query({ params })
								reactingNormal.value = false
								if (toast.handleError(response))
									return

								delete chapterState.value.reacted
								if (chapterState.value.reactions)
									chapterState.value.reactions--

								chapterState.emit()
							}
							else {
								reactingNormal.value = true
								const response = await EndpointReactChapter.query({ params })
								reactingNormal.value = false
								if (toast.handleError(response))
									return

								chapterState.value.reacted = true
								chapterState.value.reactions ??= 0
								chapterState.value.reactions++

								chapterState.emit()
							}
						})
				)
				//#endregion
				////////////////////////////////////

				////////////////////////////////////
				//#region Guest Reaction
				.appendWhen(guestReactions.map(slot, reactions => !!reactions || !Session.Auth.author.value),
					Reaction('guest_heart', guestReactions, reactedGuest, reactingGuest)
						.tweak(reaction => reaction.icon.setDisabled(!!Session.Auth.author.value, 'not a guest'))
						.setTooltip(tooltip => tooltip.text.use('chapter/reaction/guest-heart'))
						.event.subscribe('click', async () => {
							if (Session.Auth.loggedIn.value || reactingGuest.value)
								return

							const params = { ...Chapters.reference(chapterState.value), type: 'love' } as const
							if (reactedGuest.value) {
								reactingGuest.value = true
								const response = await EndpointUnreactChapter.query({ params })
								reactingGuest.value = false
								if (toast.handleError(response))
									return

								delete chapterState.value.reacted
								if (chapterState.value.guest_reactions)
									chapterState.value.guest_reactions--

								chapterState.emit()
							}
							else {
								reactingGuest.value = true
								const response = await EndpointReactChapter.query({ params })
								reactingGuest.value = false
								if (toast.handleError(response))
									return

								chapterState.value.reacted = true
								chapterState.value.guest_reactions ??= 0
								chapterState.value.guest_reactions++

								chapterState.emit()
							}
						})
				)
				//#endregion
				////////////////////////////////////

				//#endregion
				////////////////////////////////////
			)

		for (const actions of [paginator.footer, paginator.headerActions]) {
			actions.style('view-type-chapter-block-paginator-actions')

			Link(`/work/${workData.author}/${workData.vanity}`)
				.and(Button)
				.type('flush')
				.text.use('chapter/action/index')
				.appendTo(actions.middle)

			ReactionButtons()
				.appendToWhen(Viewport.mobile.falsy, actions.middle)

			ReactionButtons()
				.style.toggle(actions === paginator.footer, 'reaction-button-list--footer')
				.appendToWhen(Viewport.mobile.truthy, actions)
		}

		paginator.data.use(paginator, chapter => chapterState.value = chapter)

		const commentState = chapterState.mapManual(chapter => !chapter.root_comment || chapter.insufficient_pledge ? undefined : {
			threadId: chapter.root_comment as UUID,
			threadAuthor: chapter.author,
		}, Objects.deepEquals)
		Slot()
			.use(commentState, (slot, thread) => {
				if (!thread)
					return

				return Comments(thread.threadId, thread.threadAuthor, true)
			})
			.appendTo(view.content)

		return view
	},
})
