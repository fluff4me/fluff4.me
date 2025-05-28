import type { ManifestNotificationTypes, Notification as NotificationData } from 'api.fluff4.me'
import type { Weave, WeavingArg } from 'lang/en-nz'
import Authors from 'model/Authors'
import Chapters from 'model/Chapters'
import Comments from 'model/Comments'
import Notifications from 'model/Notifications'
import TextBody from 'model/TextBody'
import Works from 'model/Works'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Icon from 'ui/component/core/Icon'
import Link from 'ui/component/core/Link'
import Slot from 'ui/component/core/Slot'
import Timestamp from 'ui/component/core/Timestamp'
import AuthorPopover from 'ui/component/popover/AuthorPopover'
import { Quilt } from 'ui/utility/StringApplicator'
import State from 'utility/State'
import Type from 'utility/Type'

type NotificationType = keyof ManifestNotificationTypes

Type.assert<Quilt[`notification/${keyof { [KEY in NotificationType as KEY extends `report-${string}` ? KEY : never]: true }}`]>()

interface NotificationTranslationInput {
	TRIGGERED_BY: WeavingArg
	AUTHOR: WeavingArg
	CHAPTER: WeavingArg
	WORK: WeavingArg
}

function notif (quilt: Quilt): (
	({
		[TYPE in NotificationType as `notification/${TYPE}` extends keyof typeof quilt ? `notification/${TYPE}` : never]: `notification/${TYPE}` extends keyof typeof quilt ? typeof quilt[`notification/${TYPE}`] : never
	}) extends infer TRANSLATED ?

	({
		[TYPE in NotificationType as `notification/${TYPE}` extends keyof typeof quilt ? never : `notification/${TYPE}`]?: (input: NotificationTranslationInput) => Weave
	}) extends infer PLACEHOLDER ?

	TRANSLATED & PLACEHOLDER extends infer COMBINED ? { [KEY in keyof COMBINED]: COMBINED[KEY] } : never

	: never : never
) {
	return quilt
}

interface NotificationChildrenExtensions {
	readonly readButton: State<Button | undefined>
}

interface Notification extends Component, NotificationChildrenExtensions { }

const Notification = Component.Builder('a', (component, data: NotificationData): Notification | undefined => {
	const read = State(data.read)
	const readButtonState = State<Button | undefined>(undefined)

	const notification = component.and(Slot).use(Quilt.State, (slot, quilt) => {
		const translationFunction = notif(quilt)[`notification/${data.type as NotificationType}`]
		if (!translationFunction) {
			console.warn(`Untranslated notification type ${data.type}`, data)
			return
		}

		const triggeredBy = Authors.resolve(data.triggered_by, Notifications.authors.value)
		const TRIGGERED_BY = !triggeredBy ? undefined : Link(`/author/${triggeredBy.vanity}`)
			.style.toggle(data.type.startsWith('report-'), 'notification-reporter')
			.text.set(triggeredBy.name)
			.setPopover('hover', popover => popover.and(AuthorPopover, triggeredBy))

		const author = Authors.resolve(data.author, Notifications.authors.value)
		const AUTHOR = !author ? undefined : Link(`/author/${author.vanity}`)
			.text.set(author.name)
			.setPopover('hover', popover => popover.and(AuthorPopover, author))

		const work = Works.resolve(data.work, Notifications.works.value)
		const WORK = !work ? undefined : Link(`/work/${work.author}/${work.vanity}`).text.set(work.name)
		const chapter = Chapters.resolve(data.chapter, Notifications.chapters.value)
		const CHAPTER = !chapter ? undefined : Link(`/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}`).text.set(chapter.name)

		const COMMENT = !!data.comment

		const notification = Component()
			.style('notification')
			.style.bind(read, 'notification--read')

		const justMarkedUnread = State(false)
		const readButton = readButtonState.value = Button()
			.setIcon('check')
			.type('icon')
			.style('notification-read-button')
			.style.bind(read, 'notification-read-button--read')
			.style.bind(justMarkedUnread, 'notification-read-button--just-marked-unread')
			.tweak(button => button.icon!.style('notification-read-button-icon'))
			.event.subscribe('click', async event => {
				event.preventDefault()
				event.stopImmediatePropagation()
				await toggleRead()
			})
			.appendTo(notification)

		Component()
			.style('notification-label')
			.append(
				data.type.startsWith('report-') && Icon('shield-halved').style('notification-type-icon'),
				Component().text.use(quilt => translationFunction({ TRIGGERED_BY, AUTHOR, WORK, CHAPTER, COMMENT })),
				document.createTextNode('   '),
				Timestamp(data.created_time).style('notification-timestamp'),
			)
			.appendTo(notification)

		const comment = Comments.resolve(data.comment, Notifications.comments.value)
		if (comment) {
			Component()
				.style('markdown', 'notification-comment-wrapper')
				.append(comment.body && Component('blockquote')
					.style('notification-comment')
					.setMarkdownContent(TextBody.resolve(comment.body, Notifications.authors.value), 64))
				.appendTo(notification)

			if (chapter)
				notification.and(Link, `/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}`)
					.event.subscribe('Navigate', toggleRead)
		}

		if (data.type.startsWith('report-') && data.string_128)
			Component()
				.style('notification-report-reason')
				.append(Component().style('notification-report-reason-label').text.use('notification/report/label/reason'))
				.append(Component().style('notification-report-reason-text').text.set(data.string_128))
				.appendTo(notification)

		return notification

		async function toggleRead () {
			if (!await Notifications.markRead(!read.value, data.id))
				return

			read.value = !read.value
			if (!read.value) {
				justMarkedUnread.value = true
				readButton.hoveredOrFocused.match(component, false, () => justMarkedUnread.value = false)
			}
		}
	})

	return notification
		.extend<NotificationChildrenExtensions>(notification => ({
			readButton: readButtonState,
		}))
})

export default Notification
