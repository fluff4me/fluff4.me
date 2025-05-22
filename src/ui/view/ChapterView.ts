import type { ChapterReference, Work as WorkData, WorkFull } from 'api.fluff4.me'
import EndpointChapterGet from 'endpoint/chapter/EndpointChapterGet'
import EndpointChapterGetPaged from 'endpoint/chapter/EndpointChapterGetPaged'
import Endpoint from 'endpoint/Endpoint'
import EndpointHistoryAddChapter from 'endpoint/history/EndpointHistoryAddChapter'
import EndpointPatreonPatronRemove from 'endpoint/patreon/EndpointPatreonPatronRemove'
import EndpointReactChapter from 'endpoint/reaction/EndpointReactChapter'
import EndpointUnreactChapter from 'endpoint/reaction/EndpointUnreactChapter'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import Chapters from 'model/Chapters'
import PagedData from 'model/PagedData'
import Session from 'model/Session'
import TextBody from 'model/TextBody'
import Component from 'ui/Component'
import OAuthService from 'ui/component/auth/OAuthService'
import OAuthServices from 'ui/component/auth/OAuthServices'
import Chapter from 'ui/component/Chapter'
import Comments from 'ui/component/Comments'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import ExternalLink from 'ui/component/core/ExternalLink'
import Heading from 'ui/component/core/Heading'
import Link from 'ui/component/core/Link'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Reaction from 'ui/component/Reaction'
import Tags from 'ui/component/Tags'
import type { TagsState } from 'ui/component/TagsEditor'
import Work from 'ui/component/Work'
import Viewport from 'ui/utility/Viewport'
import PaginatedView from 'ui/view/shared/component/PaginatedView'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTitle from 'ui/view/shared/ext/ViewTitle'
import Maths from 'utility/maths/Maths'
import Popup from 'utility/Popup'
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

		return { workData: response.data as WorkData & Partial<WorkFull>, initialChapterResponse }
	},
	create (params: ChapterReference, { workData, initialChapterResponse }) {
		const view = PaginatedView('chapter')

		const author = workData.synopsis?.mentions.find(author => author.vanity === params.author)
		delete workData.synopsis
		delete workData.custom_tags

		view.breadcrumbs.setBackButton(
			`/work/${params.author}/${params.work}`,
			button => button.subText.set(workData.name),
		)

		Link(`/work/${author?.vanity}/${workData.vanity}`)
			.and(Work, workData, author)
			.viewTransition('chapter-view-work')
			.style('view-type-chapter-work')
			.setContainsHeading()
			.appendTo(view.content)

		const chapterState = State(initialChapterResponse.data)
		const isOwn = Session.Auth.loggedInAs(view, params.author)
		const sufficientPledge = chapterState.mapManual(chapter => !chapter.insufficient_pledge)
		const shouldShowPatreon = State.Some(view, isOwn.truthy, sufficientPledge.falsy)

		const chapters = PagedData.fromEndpoint(EndpointChapterGetPaged.prep({ params }))
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
				paginator.title
					.and(ViewTitle)
					.style('view-type-chapter-block-title')
					.text.bind(chapterState.mapManual(chapter => chapter.name))

				paginator.primaryActions.style('view-type-chapter-block-actions')

				const number = chapterState.mapManual(chapter => Maths.parseIntOrUndefined(chapter.url))
				Slot()
					.if(number.mapManual(number => number !== undefined), () => Heading()
						.setAestheticStyle(false)
						.style('view-type-chapter-block-number-label')
						.text.bind(number.mapManual(number => quilt => quilt['view/chapter/number/label'](number))))
					.prependTo(paginator.header)
			})
			.appendTo(view.content)
			.tweak(p => p.page.value = initialChapterResponse.page)
			.set(chapters, (slot, chapter, page, chapters, paginator) => {
				paginator.setURL(`/work/${params.author}/${params.work}/chapter/${chapter.url}`)

				if (Session.Auth.loggedIn.value)
					void EndpointHistoryAddChapter.query({ params: chapter })

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

				const isPatreon = chapter.visibility === 'Patreon'
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
										.text.use(quilt => quilt['shared/term/patreon-tier']({
											NAME: chapter.patreon?.tiers[0].tier_name ?? '',
											PRICE: `$${((chapter.patreon?.tiers[0].amount ?? 0) / 100).toFixed(2)}`,
										})),
									Slot()
										.style.remove('slot')
										.style('view-type-chapter-block-patreon-header-actions')
										.if(isOwn.falsy, slot => {
											if (!chapter.patreon)
												return

											Slot()
												.if(Session.Auth.loggedIn, slot => {
													Button()
														.style('view-type-chapter-block-patreon-header-button')
														.text.bind(Session.Auth.author.map(slot, author =>
															!author?.patreon_patron
																? quilt => quilt['view/chapter/action/auth-to-patreon']()
																: quilt => quilt['view/chapter/action/unlink-patreon'](author.patreon_patron!.display_name)))
														.event.subscribe('click', () => authAsPatron(slot))
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
		paginator.footer.style('view-type-chapter-block-paginator-actions')

		paginator.setActionsMenu(popover => Chapter.initActions(popover, chapterState, workData, author, true))

		Link(`/work/${params.author}/${params.work}`)
			.and(Button)
			.type('flush')
			.text.use('chapter/action/index')
			.appendTo(paginator.footer.middle)

		const reactions = chapterState.mapManual(chapter => chapter.reactions ?? 0)
		const reacted = chapterState.mapManual(chapter => !!chapter.reacted)
		Slot()
			.if(sufficientPledge, () => Reaction('love', reactions, reacted)
				.event.subscribe('click', async () => {
					if (!author?.vanity)
						return

					const params = { ...Chapters.reference(chapterState.value), type: 'love' } as const
					if (reacted.value) {
						const response = await EndpointUnreactChapter.query({ params })
						if (toast.handleError(response))
							return

						delete chapterState.value.reacted
						if (chapterState.value.reactions)
							chapterState.value.reactions--
						chapterState.emit()
					}
					else {
						const response = await EndpointReactChapter.query({ params })
						if (toast.handleError(response))
							return

						chapterState.value.reacted = true
						chapterState.value.reactions ??= 0
						chapterState.value.reactions++
						chapterState.emit()
					}
				}))
			.appendTo(paginator.footer.middle)

		paginator.data.use(paginator, chapter => chapterState.value = chapter)

		const commentState = chapterState.mapManual(chapter => !chapter.root_comment || chapter.insufficient_pledge ? undefined : {
			threadId: chapter.root_comment as UUID,
			threadAuthor: chapter.author,
		})
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

const PopupPatron = Popup({
	translation: 'view/chapter/dialog/patron/popup/title',
	url: Endpoint.path('/auth/patreon/patron/begin'),
	width: 600,
	height: 900,
})

function authAsPatron (owner: State.Owner) {
	void ConfirmDialog.prompt(owner, {
		titleTranslation: 'view/chapter/dialog/patron/title',
		bodyTranslation: 'view/chapter/dialog/patron/description',
		confirmButtonTranslation: 'view/chapter/dialog/patron/done',
		cancelButtonTranslation: false,
		async tweak (dialog) {
			const patron = Session.Auth.author.map(dialog, author => author?.patreon_patron ?? undefined)
			const services = await OAuthServices(State('none'))

			OAuthService(services.data.patreon,
				{
					authorisationState: patron,
					async onClick () {
						if (patron.value)
							await unlink()
						else
							await relink()
						return true
					},
				})
				.appendTo(dialog.content)

			async function relink () {
				await PopupPatron.show(dialog).toastError()
				await Session.refresh()
			}

			async function unlink () {
				await EndpointPatreonPatronRemove.query()
				await Session.refresh()
			}
		},
	})
}
