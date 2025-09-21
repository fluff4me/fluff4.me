import type { AuthorCensorBody, Author as AuthorData, AuthorMetadata, ReportAuthorBody } from 'api.fluff4.me'
import EndpointAuthorGet from 'endpoint/author/EndpointAuthorGet'
import EndpointModerateAuthorCensor from 'endpoint/moderation/EndpointModerateAuthorCensor'
import EndpointModerateAuthorDelete from 'endpoint/moderation/EndpointModerateAuthorDelete'
import EndpointModerateAuthorGrantSupporter from 'endpoint/moderation/EndpointModerateAuthorGrantSupporter'
import EndpointReportAuthor from 'endpoint/report/EndpointReportAuthor'
import Follows from 'model/Follows'
import Session from 'model/Session'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ButtonRow from 'ui/component/core/ButtonRow'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import GradientText from 'ui/component/core/ext/GradientText'
import ExternalLink from 'ui/component/core/ExternalLink'
import LabelledRow from 'ui/component/core/LabelledRow'
import Loading from 'ui/component/core/Loading'
import Placeholder from 'ui/component/core/Placeholder'
import Popover from 'ui/component/core/Popover'
import RangeInput from 'ui/component/core/RangeInput'
import RSSButton from 'ui/component/core/RSSButton'
import Slot from 'ui/component/core/Slot'
import TextInput, { FilterFunction } from 'ui/component/core/TextInput'
import TextLabel from 'ui/component/core/TextLabel'
import Timestamp from 'ui/component/core/Timestamp'
import FollowingBookmark from 'ui/component/FollowingBookmark'
import License from 'ui/component/License'
import ModerationDialog, { ModerationCensor, ModerationDefinition } from 'ui/component/ModerationDialog'
import ReportDialog, { ReportDefinition } from 'ui/component/ReportDialog'
import Async from 'utility/Async'
import Env from 'utility/Env'
import { mutable } from 'utility/Objects'
import State from 'utility/State'

const AUTHOR_REPORT = ReportDefinition<ReportAuthorBody>({
	titleTranslation: 'shared/term/author',
	reasons: {
		'inappropriate-field': true,
		'spam': true,
		'harassment': true,
		'impersonation': true,
		'phishing': true,
		'tos-violation': true,
	},
})

const AUTHOR_MODERATION = ModerationDefinition((author: AuthorMetadata & Partial<AuthorData>): ModerationDefinition => ({
	titleTranslation: 'shared/term/author',
	moderatedContentName: author.name,
	custom: [
		{
			type: 'general',
			tweak (slot) {
				const row = ButtonRow().appendTo(slot)

				const rangeInput = RangeInput(0, 15)
					.appendTo(row.content)

				const months = TextInput()
					.style.remove('text-input')
					.style('range-input-display')
					.filter(FilterFunction.NUMERIC)
					.default.set('0')

				rangeInput.display.element.replaceWith(months.element)
				mutable(rangeInput).display = months

				rangeInput.liveState.use(months, value => {
					switch (value) {
						case 15: months.value = '9999'; break
						case 14: months.value = `${12 * 3}`; break
						case 13: months.value = `${12 * 2}`; break
						default: months.value = `${value ?? 0}`; break
					}
				})

				row.button
					.text.use('shared/prompt/moderation/action/grant-supporter')
					.bindDisabled(months.state.map(slot, months => !+months), 'no months to give')
					.event.subscribe('click', async event => {
						const confirmed = await ConfirmDialog.prompt(event.host, {
							bodyTranslation: quilt => quilt['shared/prompt/moderation/action/grant-supporter/body'](author.name, months.value),
							dangerToken: 'moderate',
						})
						if (!confirmed)
							return

						const response = await EndpointModerateAuthorGrantSupporter.query({ params: { vanity: author.vanity }, body: { months: +months.value } })
						toast.handleError(response)
					})
			},
		},
	],
	async delete () {
		const response = await EndpointModerateAuthorDelete.query({ params: { vanity: author.vanity } })
		toast.handleError(response)
	},
	censor: ModerationCensor<AuthorCensorBody>({
		properties: {
			name: ModerationCensor.plaintext(author.name),
			vanity: ModerationCensor.plaintext(author.vanity),
			pronouns: ModerationCensor.plaintext(author.pronouns),
			description: ModerationCensor.markdown(author.description?.body),
			support_link: ModerationCensor.plaintext(author.support_link),
			support_message: ModerationCensor.plaintext(author.support_message),
			license: ModerationCensor.plaintext(author.license && `${author.license.name}: ${author.license.link}`),
		},
		async censor (censor) {
			const response = await EndpointModerateAuthorCensor.query({ params: { vanity: author.vanity }, body: censor })
			toast.handleError(response)
		},
	}),
}))

export const AuthorSubtitle = Component.Builder((component, author: State<AuthorMetadata> | AuthorMetadata) => {
	author = State.get(author)
	return component.and(Slot).use(author, (slot, author) => slot
		.append(Component()
			.style('author-vanity')
			.text.set(`@${author.vanity}`)
		)
		.append(author.pronouns && Slot()
			.text.append(' · ')
			.append(Component()
				.style('author-pronouns')
				.text.set(author.pronouns)
			)
		)
	)
})

interface AuthorFooterExtensions {
	readonly workCount?: TextLabel
	readonly wordCount?: TextLabel
	readonly timeJoin: TextLabel
}

export interface AuthorFooter extends ActionRow, AuthorFooterExtensions { }

export const AuthorFooter = Component.Builder((component, author: AuthorMetadata & Partial<AuthorData>): AuthorFooter => {
	const footer = component.and(ActionRow)

	const workCount = !author.work_count ? undefined
		: TextLabel()
			.tweak(textLabel => textLabel.label.text.use('work/work-count/label'))
			.tweak(textLabel => textLabel.content.text.set(author.work_count.toLocaleString(navigator.language)))
			.appendTo(footer.left)

	const wordCount = !author.word_count ? undefined
		: TextLabel()
			.tweak(textLabel => textLabel.label.text.use('work/word-count/label'))
			.tweak(textLabel => textLabel.content.text.set(author.word_count.toLocaleString(navigator.language)))
			.appendTo(footer.left)

	const timeJoin = TextLabel()
		.tweak(textLabel => textLabel.label.text.use('author/time-join/label'))
		.tweak(textLabel => Timestamp(author.time_join)
			.style('author-timestamp')
			.appendTo(textLabel.content))
		.appendTo(footer.right)

	return footer.extend<AuthorFooterExtensions>(footer => ({
		workCount,
		wordCount,
		timeJoin,
	}))
})

interface AuthorExtensions {
	readonly bio: Component
	loadFull (): Promise<void>
}

interface Author extends Block, AuthorExtensions { }

const Author = Component.Builder((component, authorIn: AuthorMetadata & Partial<AuthorData>): Author => {
	const author = State(authorIn)

	component
		.viewTransition('author')
		.style('author')

	const block = component.and(Block)

	const cardColours = author.map(block, author => author.supporter?.card_colours)
	block.useGradient(cardColours)

	block.title
		.style('author-name')
		.text.set(author.value.name)
		.tweak(title => title.textWrapper
			.style('author-name-text')
			.and(GradientText)
			.useGradient(author.map(block.title, author => author.supporter?.username_colours))
		)
		.setUnderlineColours(cardColours)

	block.description.append(AuthorSubtitle(author))

	FollowingBookmark(follows => follows.followingAuthor(author.value.vanity))
		.appendTo(block.header)

	block.footer.and(AuthorFooter, author.value)

	RSSButton(`${Env.API_ORIGIN}author/${author.value.vanity}/rss.xml`)
		.appendTo(block.footer.right)

	const loading = Loading()
	loading.appendToWhen(loading.enabled, block.content)

	loading.enabled.value = false

	const bio = Component()
		.style('author-description')
		.tweak(wrapper => {
			author.useManual(author => {
				wrapper.removeContents()
				Slot().appendTo(wrapper).tweak(slot => {
					const body = author.description?.body
					if (body)
						slot.setMarkdownContent(author.description)
					else
						slot.and(Placeholder).text.use('author/description/empty')
				})
			})
		})
		.appendToWhen(author.mapManual(author => !!author.description), block.content)

	Slot()
		.use(author, (slot, author) => author.support_link
			&& ExternalLink(author.support_link)
				.style('author-support-link')
				.text.set(author.support_message || author.support_link)
		)
		.appendTo(block.content)

	Slot().appendTo(block.content).use(author, (slot, author) => author.license
		&& LabelledRow()
			.style('author-license')
			.tweak(row => row.label.text.use('author/default-license'))
			.tweak(row => row.content.and(License, author.name, author.license))
	)

	if (!component.is(Popover))
		block.setActionsMenu(popover => {
			Session.Auth.author.use(popover, self => {
				if (self?.vanity === author.value.vanity) {
					Button()
						.type('flush')
						.setIcon('pencil')
						.text.use('author/action/label/edit')
						.event.subscribe('click', () => navigate.toURL('/account'))
						.appendTo(popover)
				}
				else if (Session.Auth.loggedIn.value) {
					Button()
						.type('flush')
						.bindIcon(Follows.map(popover, () => Follows.followingAuthor(author.value.vanity)
							? 'circle-check-big'
							: 'circle'))
						.text.bind(Follows.map(popover, () => quilt =>
							Follows.followingAuthor(author.value.vanity)
								? quilt['author/action/label/unfollow']()
								: quilt['author/action/label/follow']()
						))
						.event.subscribe('click', () => Follows.toggleFollowingAuthor(author.value.vanity))
						.appendTo(popover)

					Button()
						.type('flush')
						.bindIcon(Follows.map(popover, () => Follows.ignoringAuthor(author.value.vanity)
							? 'ban'
							: 'circle'))
						.text.bind(Follows.map(popover, () => quilt =>
							Follows.ignoringAuthor(author.value.vanity)
								? quilt['author/action/label/unignore']()
								: quilt['author/action/label/ignore']()
						))
						.event.subscribe('click', () => Follows.toggleIgnoringAuthor(author.value.vanity))
						.appendTo(popover)

					if (!Session.Auth.isModerator.value)
						Button()
							.type('flush')
							.setIcon('flag')
							.text.use('author/action/label/report')
							.event.subscribe('click', event => ReportDialog.prompt(event.host, AUTHOR_REPORT, {
								reportedContentName: author.value.name,
								async onReport (body) {
									const response = await EndpointReportAuthor.query({ body, params: { vanity: author.value.vanity } })
									toast.handleError(response)
								},
							}))
							.appendTo(popover)
				}

				if (Session.Auth.isModerator.value)
					Button()
						.type('flush')
						.setIcon('shield-halved')
						.text.use('author/action/label/moderate')
						.event.subscribe('click', event => ModerationDialog.prompt(event.host, AUTHOR_MODERATION.create(author.value)))
						.appendTo(popover)
			})
		})

	let loadedFull = false
	return block.extend<AuthorExtensions>(block => ({
		bio,
		async loadFull () {
			if (loadedFull || loading.enabled.value)
				return

			if (author.value.description) {
				loadedFull = true
				author.emit()
				return
			}

			loading.enabled.value = true
			await Async.sleep(1000)
			const response = await EndpointAuthorGet.query({ params: author.value })
			loading.enabled.value = false
			if (response instanceof Error)
				return

			loadedFull = true
			Object.assign(author.value, response.data)
			author.emit()
		},
	}))
})

export default Author
