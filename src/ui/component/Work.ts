import type { AuthorMetadata, ReportWorkBody, WorkCensorBody, Work as WorkData, WorkMetadata } from 'api.fluff4.me'
import EndpointModerateWorkCensor from 'endpoint/moderation/EndpointModerateWorkCensor'
import EndpointModerateWorkLock from 'endpoint/moderation/EndpointModerateWorkLock'
import EndpointModerateWorkUnlock from 'endpoint/moderation/EndpointModerateWorkUnlock'
import EndpointReportWork from 'endpoint/report/EndpointReportWork'
import Follows from 'model/Follows'
import FormInputLengths from 'model/FormInputLengths'
import Patreon from 'model/Patreon'
import Session from 'model/Session'
import Works, { WORK_STATUS_ICONS } from 'model/Works'
import type { RoutePath } from 'navigation/RoutePath'
import Component from 'ui/Component'
import AuthorLink from 'ui/component/AuthorLink'
import ActionRow from 'ui/component/core/ActionRow'
import Block, { BlockClasses } from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ButtonRow from 'ui/component/core/ButtonRow'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Heading from 'ui/component/core/Heading'
import Icon from 'ui/component/core/Icon'
import Link from 'ui/component/core/Link'
import Popover from 'ui/component/core/Popover'
import RSSButton from 'ui/component/core/RSSButton'
import Slot from 'ui/component/core/Slot'
import Textarea from 'ui/component/core/Textarea'
import TextLabel from 'ui/component/core/TextLabel'
import Timestamp from 'ui/component/core/Timestamp'
import FollowingBookmark from 'ui/component/FollowingBookmark'
import License from 'ui/component/License'
import ModerationDialog, { ModerationCensor, ModerationDefinition } from 'ui/component/ModerationDialog'
import ReportDialog, { ReportDefinition } from 'ui/component/ReportDialog'
import Statistics from 'ui/component/Statistics'
import Tags from 'ui/component/Tags'
import type { TagsState } from 'ui/component/TagsEditor'
import type { Quilt } from 'ui/utility/StringApplicator'
import Env from 'utility/Env'
import State from 'utility/State'
import Time from 'utility/Time'

const WORK_REPORT = ReportDefinition<ReportWorkBody>({
	titleTranslation: 'shared/term/work',
	reasons: {
		'inadequate-tags': true,
		'inappropriate-field': true,
		'spam': true,
		'harassment': true,
		'plagiarism': true,
		'tos-violation': true,
		'work-unlock': false,
	},
})

const WORK_MODERATION = ModerationDefinition((work: WorkMetadata & Partial<WorkData>): ModerationDefinition => ({
	titleTranslation: 'shared/term/work',
	moderatedContentName: work.name,
	custom: [
		{
			type: 'general',
			tweak (slot) {
				const lockReason = State(work.lock_reason)

				slot.use(lockReason, (slot, currentReason) => {
					const row = ButtonRow().appendTo(slot)
					const reasonInput = Textarea().text.set(currentReason).appendTo(row.content)
					if (currentReason) {
						reasonInput.attributes.set('disabled', 'disabled')
						row.button
							.text.use('work/action/unlock')
							.event.subscribe('click', async event => {
								const confirmed = await ConfirmDialog.prompt(event.host, {
									bodyTranslation: null,
									dangerToken: 'moderate',
								})
								if (!confirmed)
									return

								const response = await EndpointModerateWorkUnlock.query({ params: Works.reference(work) })
								if (toast.handleError(response))
									return

								lockReason.value = undefined
							})
					}
					else {
						row.button
							.text.use('work/action/lock')
							.bindDisabled(reasonInput.state.falsy, 'no lock reason')
							.event.subscribe('click', async event => {
								const confirmed = await ConfirmDialog.prompt(event.host, {
									bodyTranslation: null,
									dangerToken: 'moderate',
								})
								if (!confirmed)
									return

								const response = await EndpointModerateWorkLock.query({ params: Works.reference(work), body: { reason: reasonInput.value } })
								if (toast.handleError(response))
									return

								lockReason.value = reasonInput.value
							})
					}
				})
			},
		},
	],
	censor: ModerationCensor<WorkCensorBody>({
		properties: {
			name: ModerationCensor.plaintext(work.name),
			vanity: ModerationCensor.plaintext(work.vanity),
			description: ModerationCensor.plaintext(work.description),
			synopsis: ModerationCensor.markdown(work.synopsis?.body),
			license: ModerationCensor.plaintext(work.license && `${work.license.name}: ${work.license.link}`),
		},
		async censor (censor) {
			const response = await EndpointModerateWorkCensor.query({ params: Works.reference(work), body: censor })
			toast.handleError(response)
		},
	}),
}))

interface WorkFooterExtensions {
	readonly status: State<Component>
	readonly statusIcon: State<Icon>
	readonly chapterCount: Component
	readonly wordCount: Component
	readonly timestampAlternative: State<Component | undefined>
	readonly timestamp: State<Timestamp | undefined>
}

export interface WorkFooter extends ActionRow, WorkFooterExtensions { }

export const WorkFooter = Component.Builder((component, work: State.Or<WorkMetadata & Partial<WorkData>>): WorkFooter => {
	work = State.get(work)

	const footer = component.and(ActionRow).style('work-footer')

	footer.left.style('work-footer-left')

	const status = State<Component>(undefined!)
	const statusIcon = State<Icon>(undefined!)
	Slot().appendTo(footer.left).use(work, (slot, work) => {
		let statusId = work.status
		let noRecentUpdates: 'no-recent-updates' | undefined
		if (statusId === 'Ongoing' && Date.now() - new Date(work.time_last_update ?? 0).getTime() > Time.months(3)) {
			noRecentUpdates = 'no-recent-updates'
			statusId = 'Hiatus'
		}

		const statusLowercase = work.status.toLowerCase() as Lowercase<WorkData['status']>
		return status.value = Component()
			.style('button', 'work-status', `work-status--${statusLowercase}`)
			.append(statusIcon.value = Icon(WORK_STATUS_ICONS[work.status]).style('work-status-icon'))
			.append(Component().text.use(`work/status/${noRecentUpdates ?? statusLowercase}`))
	})

	const chapterCount = TextLabel()
		.tweak(textLabel => textLabel.label.text.use('work/chapters/label'))
		.tweak(textLabel => {
			work.use(textLabel, work => {
				const chapterCount = work.chapter_count_public.toLocaleString(navigator.language)
				if (!work.frequency || work.status === 'Complete' || work.status === 'Cancelled')
					return textLabel.content.text.set(chapterCount)

				let intervalSize: number
				let interval: Quilt.KeyPrefixed<'shared/term/interval'>
				switch (work.frequency.interval) {
					case 1: interval = 'daily', intervalSize = 1; break
					case 7: interval = 'weekly', intervalSize = 7; break
					case 30: interval = 'monthly', intervalSize = 30; break
					default:
						if (work.frequency.interval < 7)
							interval = 'every-x-days', intervalSize = work.frequency.interval
						else if (work.frequency.interval < 30)
							interval = 'every-x-weeks', intervalSize = work.frequency.interval / 7
						else
							interval = 'every-x-months', intervalSize = work.frequency.interval / 30
				}

				intervalSize = Math.round(intervalSize)
				const greatestCommonDivisor = (a: number, b: number): number => b === 0 ? a : greatestCommonDivisor(b, a % b)
				const divisor = greatestCommonDivisor(intervalSize, work.frequency.amount)
				const amount = work.frequency.amount / divisor
				intervalSize /= divisor
				if (interval === 'every-x-days' && intervalSize === 1)
					interval = 'daily'
				else if (interval === 'every-x-weeks' && intervalSize === 1)
					interval = 'weekly'
				else if (interval === 'every-x-months' && intervalSize === 1)
					interval = 'monthly'

				textLabel.content.text.use(quilt => quilt['work/chapters/value'](
					chapterCount,
					amount.toLocaleString(navigator.language),
					quilt[`shared/term/interval/${interval}`](intervalSize.toLocaleString(navigator.language)),
				))
			})
		})
		.appendTo(footer.left)

	const wordCount = work.map(component, work => work.word_count)
	const wordCountComponent = TextLabel()
		.tweak(textLabel => textLabel.label.text.use('work/word-count/label'))
		.tweak(textLabel => textLabel.content.text.bind(wordCount.map(textLabel, wordCount => wordCount.toLocaleString(navigator.language))))
		.appendToWhen(wordCount.truthy, footer.left)

	footer.right.style('work-footer-right')

	const timestamp = State<Timestamp | undefined>(undefined)
	const timestampAlternative = State<Component | undefined>(undefined)
	Slot().appendTo(footer.right).use(work, (slot, work) => {
		timestamp.value = undefined
		timestampAlternative.value = undefined
		if (work.visibility === 'Private')
			slot.append(timestampAlternative.value = Component().style('timestamp', 'work-timestamp').text.use('work/state/private'))
		else if (!work.chapter_count_public)
			slot.append(timestampAlternative.value = Component().style('timestamp', 'work-timestamp').text.use('work/state/private-no-chapters'))
		else if (work.time_last_update)
			slot.append(timestamp.value = Timestamp(work.time_last_update).setSimple().style('work-timestamp'))
	})

	return footer.extend<WorkFooterExtensions>(component => ({
		status,
		statusIcon,
		chapterCount,
		wordCount: wordCountComponent,
		timestampAlternative,
		timestamp,
	}))
})

interface WorkExtensions {
	readonly work: State<WorkMetadata>
	readonly statistics: Slot
	readonly actions: Component
	readonly bookmarkStatus: State<Heading | undefined>
	readonly bookmarkAction: State<Link & Button | undefined>
}

interface Work extends Block, WorkExtensions { }

// let statusI = 0
const Work = Component.Builder((component, workDataIn: State.Or<WorkMetadata & Partial<WorkData>>, authorDataIn?: State.Or<AuthorMetadata>, notFullOverride?: true): Work => {
	const work = State.get(workDataIn)
	const authorStateIn = State.get(authorDataIn)
	const author = State.Map(component, [work, authorStateIn], (work, author) => {
		return author ?? work.synopsis?.mentions[0]
	})

	const isPatreon = work.map(component, work => work.visibility === 'Patreon')
	component
		.viewTransition('work')
		.style('work')
		.style.bind(work.map(component, work => work.visibility === 'Private' || !work.chapter_count_public), 'work--private')
		.style.bind(isPatreon, 'work--patreon')

	const block = component.and(Block)
	const cardColours = State.Map(component, [work, Session.Auth.author], (work, author) =>
		work.author !== Session.Auth.author.value?.vanity || Session.Auth.author.value.supporter?.tier
			? work.card_colours
			: undefined
	)
	block.useGradient(cardColours)
	const isFlush = block.type.state.mapManual(types => types.has('flush'))

	block.header
		.style('work-header')
		.style.bind(isFlush, 'work-header--flush')
		.style.bind(isPatreon, 'work-header--patreon')

	block.title
		.style('work-name')
		.text.bind(work.map(component, work => work.name))
		.setResizeRange(32, Math.min(FormInputLengths.value?.work?.name ?? Infinity, 128))
		.setUnderlineColours(cardColours)

	Slot().use(work, (slot, work) => FollowingBookmark(follows => follows.followingWork(work)))
		.appendTo(block.header)

	block.description
		.style.bind(author.truthy, 'work-author-list')
		.style.bind(State.Every(component, isFlush, author.truthy), 'work-author-list--flush')
		.append(Slot().use(author, (slot, author) => author && AuthorLink(author)
			.style('work-author')
		))

	block.content.style.bind(work.map(component, work => !!work.bookmarks), 'work-actions-and-content')

	const content = Component()
		.style('work-content')
		.appendTo(block.content)

	const actions = Slot()
		.style('work-actions')
		.appendTo(block.content)

	const WorkActionsButton = Component.Builder((component): Button => component
		.and(Button)
		.style('work-actions-action')
		.useGradient(cardColours)
	)

	////////////////////////////////////
	//#region Bookmarks

	const bookmarkStatus = State<Heading | undefined>(undefined)
	const bookmarkAction = State<Link & Button | undefined>(undefined)
	actions.use(work, (slot, work) => {
		bookmarkStatus.value = undefined
		bookmarkAction.value = undefined
		if (!work.bookmarks)
			return

		if (work.bookmarks) {
			const isNew = !work.bookmarks.url_read_last && Date.now() - new Date(work.time_publish ?? 0).getTime() < Time.weeks(1)
			bookmarkStatus.value = Heading()
				.setAestheticStyle(false)
				.style('work-bookmarks-status')
				.style.toggle(!!isNew, 'work-bookmarks-status--new')
				.text.use(quilt => {
					if (!work.bookmarks)
						return undefined

					if (work.bookmarks.read_completed)
						return quilt['work/bookmarks/label/finished']()

					if (work.bookmarks.url_read_last !== work.bookmarks.url_read_furthest)
						return quilt['work/bookmarks/label/progress'](
							(work.bookmarks?.chapters_from_last_patreon ? work.chapter_count_public - work.bookmarks.chapters_from_last_patreon : 1).toLocaleString(navigator.language),
							work.chapter_count_public.toLocaleString(navigator.language),
						)

					if (work.bookmarks.chapters_from_last_patreon) {
						const quantity = work.bookmarks?.chapters_from_last_patreon ?? 1
						return quantity === 1
							? quilt['work/bookmarks/label/new-content-single'](quantity)
							: quilt['work/bookmarks/label/new-content'](quantity)
					}

					if (!work.bookmarks.url_read_last)
						return isNew
							? quilt['work/bookmarks/label/not-tried-new']()
							: quilt['work/bookmarks/label/not-tried']()

					return quilt['work/bookmarks/label/caught-up']()
				})
				.prepend(isNew && Icon('star').style('work-bookmarks-status-icon'))
				.appendTo(slot)

			const link: RoutePath = !work.bookmarks.url_next && !work.bookmarks.read_completed && work.bookmarks.url_read_last
				? `/work/${work.author}/${work.vanity}`
				: `/work/${work.author}/${work.vanity}/chapter/${(!work.bookmarks.read_completed && work.bookmarks.url_next) || work.bookmarks.url_first}`
			bookmarkAction.value = Link(link)
				.and(WorkActionsButton)
				.ariaLabel.use(quilt => quilt[work.bookmarks?.read_completed
					? 'work/action/alt/reread'
					: work.bookmarks?.url_next
						? 'work/action/alt/continue'
						: work.bookmarks?.url_read_last
							? 'work/action/alt/see-all'
							: 'work/action/alt/read'
				](work.name))
				.text.use(work.bookmarks.read_completed
					? 'work/action/label/reread'
					: work.bookmarks.url_next
						? 'work/action/label/continue'
						: work.bookmarks.url_read_last
							? 'work/action/label/see-all'
							: 'work/action/label/read'
				)
				.appendTo(slot)
		}
	})

	//#endregion
	////////////////////////////////////

	const requiredPatreonTier = work.map(component, work => (work.visibility === 'Patreon' && work.patreon?.tiers[0]) || undefined)
	// Component()
	// 	.style('work-patreon-visibility-effect')
	// 	.style.bind(isFlush, 'work-patreon-visibility-effect--flush')
	// 	.prependToWhen(requiredPatreonTier.truthy, component)

	Component()
		.style('work-patreon-visibility-header', 'patreon-icon-before')
		.style.bind(isFlush, 'work-patreon-visibility-header--flush')
		.append(Component()
			.style('work-patreon-visibility-header-label')
			.text.use('work/patreon/label')
		)
		.append(Component()
			.style('work-patreon-visibility-header-tier')
			.text.bind(requiredPatreonTier.map(component, tier => tier && Patreon.translateTier(tier)))
		)
		.appendToWhen(requiredPatreonTier.truthy, content)

	const lockReason = work.map(component, work => work.lock_reason)
	Component()
		.style('work-lock-reason')
		.style.bind(isFlush, 'work-lock-reason--flush')
		.classes.add('markdown')
		.append(Component()
			.style('work-lock-reason-heading')
			.append(Icon('lock'))
			.append(Component().text.use('work/locked/label'))
		)
		.append(Component().text.use('work/locked/description'))
		.append(Component('blockquote').style('work-lock-reason-text').text.bind(lockReason))
		.appendToWhen(lockReason.truthy, content)

	const description = work.map(component, work => work.description)
	const synopsis = work.map(component,
		work => work.synopsis,
		(a, b) => (a?.body === b?.body && a?.mentions.length === b?.mentions.length && a?.mentions[0]?.vanity === b?.mentions[0]?.vanity),
	)
	Slot()
		.use(State.Use(component, { isFlush, description, synopsis }), (slot, { isFlush, description, synopsis }) => {
			const actuallyIsFlush = isFlush

			isFlush ||= notFullOverride ?? false

			const shouldShowDescription = isFlush || (synopsis?.body && description)
			if (shouldShowDescription)
				Component()
					.style('work-description')
					.style.toggle(!synopsis?.body, 'work-description--solo')
					.style.toggle(actuallyIsFlush, 'work-description--flush')
					.style.toggle(!description, 'placeholder')
					.tweak(component => {
						if (description)
							component.text.set(description)
						else
							component.text.use('work/description/empty')
					})
					.appendTo(slot)

			if (!isFlush)
				Component()
					.style('work-synopsis')
					.style.toggle(!synopsis?.body && !description, 'placeholder')
					.append(Slot().tweak(slot => {
						const synopsis2 = synopsis?.body ? synopsis : description
						if (typeof synopsis2 === 'string')
							slot.text.set(synopsis2)
						else if (!synopsis2.body)
							slot.text.use('work/description/empty')
						else
							slot.setMarkdownContent(synopsis2)
					}))
					.appendTo(slot)
		})
		.appendTo(content)

	Tags()
		.set(work as State<TagsState>, {
			initialiseGlobalTags: component => component
				.style.bind(isFlush, 'work-tags--flush'),
			initialiseCustomTags: component => component
				.style.bind(isFlush, 'work-tags--flush'),
		})
		.appendTo(content)

	const license = State.Map(component, [author, work, Session.Auth.account],
		(author, work, account) => (_
			?? work.license
			?? (author?.vanity === account?.vanity ? account?.license : undefined)
			?? undefined
		),
		(a, b) => typeof a === typeof b && a?.name === b?.name && a?.link === b?.link,
	)
	Slot().appendTo(content).use(State.Use(component, { work, author, license }), (slot, { work, author, license }) => {
		if (!work.synopsis)
			return

		return License(author?.name, license)
			.style('work-license')
	})

	block.footer.and(WorkFooter, work)

	RSSButton(work.map(component, work => `${Env.API_ORIGIN}work/${work.author}/${work.vanity}/rss.xml`))
		.appendTo(block.footer.right)

	const workAuthor = work.map(component, work => work.author)
	const isOwnWork = Session.Auth.loggedInAs(component, workAuthor)
	const statistics = work.map(component, work => work.statistics)
	const statisticsWrapper = Slot().appendTo(block.footer).use(State.Use(component, { isOwnWork, statistics }), (slot, { isOwnWork, statistics }) => isOwnWork && statistics
		&& Statistics()
			.style('work-author-statistics')
			.section('shared/stat/section/logged-in', section => section
				.stat('work/stat/reads/label', statistics?.read_count)
				.stat('work/stat/hearts/label', statistics?.reaction_count)
				.stat('work/stat/comments/label', statistics?.comment_count)
			)
			.section('shared/stat/section/logged-out', section => section
				.stat('work/stat/visits/label', statistics?.visits ? BigInt(statistics.visits) : undefined)
				.stat('work/stat/chapter-visits/label', statistics?.chapter_visits ? BigInt(statistics.chapter_visits) : undefined)
			)
	)

	if (!component.is(Popover))
		block.setActionsMenu((popover, button) => {
			popover.subscribeReanchor((actionsMenu, isTablet) => {
				if (isTablet)
					return

				actionsMenu.anchor.reset()
					.anchor.add('off right', 'centre', `.${BlockClasses.Main}`)
					.anchor.orElseHide()
			})

			if (work.value.author === Session.Auth.author.value?.vanity) {
				Button()
					.type('flush')
					.setIcon('pencil')
					.text.use('work/action/label/edit')
					.event.subscribe('click', () => navigate.toURL(`/work/${work.value.author}/${work.value.vanity}/edit`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('plus')
					.text.use('work/action/label/new-chapter')
					.event.subscribe('click', () => navigate.toURL(`/work/${work.value.author}/${work.value.vanity}/chapter/new`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('plus')
					.text.use('view/work-edit/update/action/bulk-chapters')
					.event.subscribe('click', () => navigate.toURL(`/work/${work.value.author}/${work.value.vanity}/chapter/new/bulk`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('trash')
					.text.use('work/action/label/delete')
					.event.subscribe('click', () => Works.delete(work.value, popover))
					.appendTo(popover)
			}
			else if (Session.Auth.loggedIn.value) {
				Button()
					.type('flush')
					.bindIcon(State.Map(popover, [Follows, work], (_, work) => Follows.followingWork(work)
						? 'circle-check-big'
						: 'circle'))
					.text.bind(State.Map(popover, [Follows, work], (_, work) => quilt =>
						Follows.followingWork(work)
							? quilt['work/action/label/unfollow']()
							: quilt['work/action/label/follow']()
					))
					.event.subscribe('click', () => Follows.toggleFollowingWork(work.value))
					.appendTo(popover)

				Button()
					.type('flush')
					.bindIcon(State.Map(popover, [Follows, work], (_, work) => Follows.ignoringWork(work)
						? 'ban'
						: 'circle'))
					.text.bind(State.Map(popover, [Follows, work], (_, work) => quilt =>
						Follows.ignoringWork(work)
							? quilt['work/action/label/unignore']()
							: quilt['work/action/label/ignore']()
					))
					.event.subscribe('click', () => Follows.toggleIgnoringWork(work.value))
					.appendTo(popover)

				if (!Session.Auth.isModerator.value)
					Button()
						.type('flush')
						.setIcon('flag')
						.text.use('work/action/label/report')
						.event.subscribe('click', event => ReportDialog.prompt(event.host, WORK_REPORT, {
							reportedContentName: work.value.name,
							async onReport (body) {
								const response = await EndpointReportWork.query({ body, params: Works.reference(work.value) })
								toast.handleError(response)
							},
						}))
						.appendTo(popover)
			}

			if (Session.Auth.isModerator.value)
				Button()
					.type('flush')
					.setIcon('shield-halved')
					.text.use('work/action/label/moderate')
					.event.subscribe('click', event => ModerationDialog.prompt(event.host, WORK_MODERATION.create(work.value)))
					.appendTo(popover)
		})

	return block.extend<WorkExtensions>(component => ({ work, statistics: statisticsWrapper, actions, bookmarkStatus, bookmarkAction }))
})

export default Work
