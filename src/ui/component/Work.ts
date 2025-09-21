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
import Component from 'ui/Component'
import AuthorLink from 'ui/component/AuthorLink'
import ActionRow from 'ui/component/core/ActionRow'
import Block, { BlockClasses } from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ButtonRow from 'ui/component/core/ButtonRow'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Icon from 'ui/component/core/Icon'
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
	readonly status: Component
	readonly statusIcon: Icon
	readonly chapterCount: Component
	readonly wordCount?: Component
	readonly timestampAlternative?: Component
	readonly timestamp?: Timestamp
}

export interface WorkFooter extends ActionRow, WorkFooterExtensions { }

export const WorkFooter = Component.Builder((component, work: WorkMetadata & Partial<WorkData>): WorkFooter => {
	const footer = component.and(ActionRow)

	footer.left.style('work-footer-left')

	const statusLowercase = work.status.toLowerCase() as Lowercase<WorkData['status']>
	const status = Component()
		.style('button', 'work-status', `work-status--${statusLowercase}`)
		.append(Component().text.use(`work/status/${statusLowercase}`))
		.appendTo(footer.left)

	const statusIcon = Icon(WORK_STATUS_ICONS[work.status]).style('work-status-icon')
		.prependTo(status)

	const chapterCount = TextLabel()
		.tweak(textLabel => textLabel.label.text.use('work/chapters/label'))
		.tweak(textLabel => {
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

			textLabel.content.text.use(quilt => quilt['work/chapters/value'](
				chapterCount,
				work.frequency!.amount.toLocaleString(navigator.language),
				quilt[`shared/term/interval/${interval}`](intervalSize.toLocaleString(navigator.language)),
			))
		})
		.appendTo(footer.left)

	const wordCount = !work.word_count ? undefined
		: TextLabel()
			.tweak(textLabel => textLabel.label.text.use('work/word-count/label'))
			.tweak(textLabel => textLabel.content.text.set(work.word_count.toLocaleString(navigator.language)))
			.appendTo(footer.left)

	footer.right.style('work-footer-right')

	let timestamp: Timestamp | undefined
	let timestampAlternative: Component | undefined
	if (work.visibility === 'Private')
		footer.right.append(timestampAlternative = Component().style('timestamp', 'work-timestamp').text.use('work/state/private'))
	else if (!work.chapter_count_public)
		footer.right.append(timestampAlternative = Component().style('timestamp', 'work-timestamp').text.use('work/state/private-no-chapters'))
	else if (work.time_last_update)
		footer.right.append(timestamp = Timestamp(work.time_last_update).setSimple().style('work-timestamp'))

	return footer.extend<WorkFooterExtensions>(component => ({
		status,
		statusIcon,
		chapterCount,
		wordCount,
		timestampAlternative,
		timestamp,
	}))
})

interface WorkExtensions {
	readonly work: WorkMetadata
	readonly statistics: Slot
}

interface Work extends Block, WorkExtensions { }

// let statusI = 0
const Work = Component.Builder((component, work: WorkMetadata & Partial<WorkData>, author?: AuthorMetadata, notFullOverride?: true): Work => {
	author = author ?? work.synopsis?.mentions[0]

	component
		.viewTransition('work')
		.style('work')
		.style.toggle(work.visibility === 'Private' || !work.chapter_count_public, 'work--private')
		.style.toggle(work.visibility === 'Patreon', 'work--patreon')

	const block = component.and(Block)
	const cardColours = work.author !== Session.Auth.author.value?.vanity || Session.Auth.author.value.supporter?.tier
		? work.card_colours
		: undefined
	block.useGradient(cardColours)
	const isFlush = block.type.state.mapManual(types => types.has('flush'))

	block.header
		.style('work-header')
		.style.bind(isFlush, 'work-header--flush')
		.style.toggle(work.visibility === 'Patreon', 'work-header--patreon')

	block.title
		.style('work-name')
		.text.set(work.name)
		.setResizeRange(32, Math.min(FormInputLengths.value?.work?.name ?? Infinity, 128))

	FollowingBookmark(follows => follows.followingWork(work))
		.appendTo(block.header)

	if (author)
		block.description
			.style('work-author-list')
			.style.bind(isFlush, 'work-author-list--flush')
			.append(AuthorLink(author)
				.style('work-author'))

	block.content.style('work-content')

	if (work.visibility === 'Patreon' && work.patreon?.tiers[0]) {
		// Component()
		// 	.style('work-patreon-visibility-effect')
		// 	.style.bind(isFlush, 'work-patreon-visibility-effect--flush')
		// 	.prependTo(component)

		Component()
			.style('work-patreon-visibility-header', 'patreon-icon-before')
			.style.bind(isFlush, 'work-patreon-visibility-header--flush')
			.append(Component()
				.style('work-patreon-visibility-header-label')
				.text.use('work/patreon/label')
			)
			.append(Component()
				.style('work-patreon-visibility-header-tier')
				.text.use(Patreon.translateTier(work.patreon.tiers[0]))
			)
			.appendTo(block.content)
	}

	if (work.lock_reason)
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
			.append(Component('blockquote').style('work-lock-reason-text').text.set(work.lock_reason))
			.appendTo(block.content)

	Slot()
		.use(isFlush, (slot, isFlush) => {
			const actuallyIsFlush = isFlush

			isFlush ||= notFullOverride ?? false

			const shouldShowDescription = isFlush || (work.synopsis?.body && work.description)
			if (shouldShowDescription)
				Component()
					.style('work-description')
					.style.toggle(actuallyIsFlush, 'work-description--flush')
					.style.toggle(!work.description, 'placeholder')
					.tweak(component => {
						if (work.description)
							component.text.set(work.description)
						else
							component.text.use('work/description/empty')
					})
					.appendTo(slot)

			if (!isFlush)
				Component()
					.style('work-synopsis')
					.style.toggle(!work.synopsis?.body && !work.description, 'placeholder')
					.append(Slot().tweak(slot => {
						const synopsis = work.synopsis?.body ? work.synopsis : work.description
						if (typeof synopsis === 'string')
							slot.text.set(synopsis)
						else if (!synopsis.body)
							slot.text.use('work/description/empty')
						else
							slot.setMarkdownContent(synopsis)
					}))
					.appendTo(slot)
		})
		.appendTo(block.content)

	Tags()
		.set(work as TagsState, {
			initialiseGlobalTags: component => component
				.style.bind(isFlush, 'work-tags--flush'),
			initialiseCustomTags: component => component
				.style.bind(isFlush, 'work-tags--flush'),
		})
		.appendTo(block.content)

	if (work.synopsis)
		License(author?.name, work.license ?? (author?.vanity === Session.Auth.account.value?.vanity ? Session.Auth.account.value?.license : undefined))
			.style('work-license')
			.appendTo(block.content)

	block.footer.and(WorkFooter, work)

	RSSButton(`${Env.API_ORIGIN}work/${work.author}/${work.vanity}/rss.xml`)
		.appendTo(block.footer.right)

	const isOwnWork = Session.Auth.loggedInAs(component, work.author)
	const statistics = Slot().appendTo(block.footer).if(isOwnWork, slot => work.statistics && Statistics()
		.style('work-author-statistics')
		.section('shared/stat/section/logged-in', section => section
			.stat('work/stat/reads/label', work.statistics?.read_count)
			.stat('work/stat/hearts/label', work.statistics?.reaction_count)
			.stat('work/stat/comments/label', work.statistics?.comment_count)
		)
		.section('shared/stat/section/logged-out', section => section
			.stat('work/stat/visits/label', work.statistics?.visits ? BigInt(work.statistics.visits) : undefined,
				label => label.content.append(Component()
					.text.use(quilt => quilt['shared/stat/tracking-since'](Timestamp('19 June 2025 21:53 GMT+12')))
				)
			)
			.stat('work/stat/chapter-visits/label', work.statistics?.chapter_visits ? BigInt(work.statistics.chapter_visits) : undefined,
				label => label.content.append(Component()
					.text.use(quilt => quilt['shared/stat/tracking-since'](Timestamp('19 June 2025 21:53 GMT+12')))
				)
			)
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

			if (author && author.vanity === Session.Auth.author.value?.vanity) {
				Button()
					.type('flush')
					.setIcon('pencil')
					.text.use('work/action/label/edit')
					.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/edit`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('plus')
					.text.use('work/action/label/new-chapter')
					.event.subscribe('click', () => navigate.toURL(`/work/${author.vanity}/${work.vanity}/chapter/new`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('plus')
					.text.use('view/work-edit/update/action/bulk-chapters')
					.event.subscribe('click', () => navigate.toURL(`/work/${work.author}/${work.vanity}/chapter/new/bulk`))
					.appendTo(popover)

				Button()
					.type('flush')
					.setIcon('trash')
					.text.use('work/action/label/delete')
					.event.subscribe('click', () => Works.delete(work, popover))
					.appendTo(popover)
			}
			else if (Session.Auth.loggedIn.value) {
				Button()
					.type('flush')
					.bindIcon(Follows.map(popover, () => Follows.followingWork(work)
						? 'circle-check-big'
						: 'circle'))
					.text.bind(Follows.map(popover, () => quilt =>
						Follows.followingWork(work)
							? quilt['work/action/label/unfollow']()
							: quilt['work/action/label/follow']()
					))
					.event.subscribe('click', () => Follows.toggleFollowingWork(work))
					.appendTo(popover)

				Button()
					.type('flush')
					.bindIcon(Follows.map(popover, () => Follows.ignoringWork(work)
						? 'ban'
						: 'circle'))
					.text.bind(Follows.map(popover, () => quilt =>
						Follows.ignoringWork(work)
							? quilt['work/action/label/unignore']()
							: quilt['work/action/label/ignore']()
					))
					.event.subscribe('click', () => Follows.toggleIgnoringWork(work))
					.appendTo(popover)

				if (!Session.Auth.isModerator.value)
					Button()
						.type('flush')
						.setIcon('flag')
						.text.use('work/action/label/report')
						.event.subscribe('click', event => ReportDialog.prompt(event.host, WORK_REPORT, {
							reportedContentName: work.name,
							async onReport (body) {
								const response = await EndpointReportWork.query({ body, params: Works.reference(work) })
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
					.event.subscribe('click', event => ModerationDialog.prompt(event.host, WORK_MODERATION.create(work)))
					.appendTo(popover)
		})

	return block.extend<WorkExtensions>(component => ({ work, statistics }))
})

export default Work
