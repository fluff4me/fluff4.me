import type { ManifestNotificationTypes, Notification as NotificationData } from 'api.fluff4.me'
import type { Weave, WeavingArg } from 'lang/en-nz'
import quilt from 'lang/en-nz'
import Authors from 'model/Authors'
import Chapters from 'model/Chapters'
import Comments from 'model/Comments'
import Notifications from 'model/Notifications'
import TextBody from 'model/TextBody'
import Works from 'model/Works'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Timestamp from 'ui/component/core/Timestamp'
import State from 'utility/State'

type NotificationType = keyof ManifestNotificationTypes

interface NotificationTranslationInput {
	TRIGGERED_BY: WeavingArg
	AUTHOR: WeavingArg
	CHAPTER: WeavingArg
	WORK: WeavingArg
}

const notificationQuilt = quilt as (
	({
		[TYPE in NotificationType as `notification/${TYPE}` extends keyof typeof quilt ? `notification/${TYPE}` : never]: `notification/${TYPE}` extends keyof typeof quilt ? typeof quilt[`notification/${TYPE}`] : never
	}) extends infer TRANSLATED ?

	({
		[TYPE in NotificationType as `notification/${TYPE}` extends keyof typeof quilt ? never : `notification/${TYPE}`]?: (input: NotificationTranslationInput) => Weave
	}) extends infer PLACEHOLDER ?

	TRANSLATED & PLACEHOLDER extends infer COMBINED ? { [KEY in keyof COMBINED]: COMBINED[KEY] } : never

	: never : never
)

interface NotificationChildrenExtensions {
	readonly readButton: Button
}

interface Notification extends Component, NotificationChildrenExtensions { }

const Notification = Component.Builder('a', (component, data: NotificationData): Notification | undefined => {
	const translationFunction = notificationQuilt[`notification/${data.type as NotificationType}`]
	if (!translationFunction)
		return undefined

	const read = State(data.read)

	const notification = component
		.style('notification')
		.style.bind(read, 'notification--read')

	const triggeredBy = Authors.resolve(data.triggered_by, Notifications.authors.value)
	const TRIGGERED_BY = !triggeredBy ? undefined : Link(`/author/${triggeredBy.vanity}`).text.set(triggeredBy.name)
	const author = Authors.resolve(data.author, Notifications.authors.value)
	const AUTHOR = !author ? undefined : Link(`/author/${author.vanity}`).text.set(author.name)
	const work = Works.resolve(data.work, Notifications.works.value)
	const WORK = !work ? undefined : Link(`/work/${work.author}/${work.vanity}`).text.set(work.name)
	const chapter = Chapters.resolve(data.chapter, Notifications.chapters.value)
	const CHAPTER = !chapter ? undefined : Link(`/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}`).text.set(chapter.name)

	const justMarkedUnread = State(false)
	const readButton = Button()
		.setIcon('check')
		.type('icon')
		.style('notification-read-button')
		.style.bind(read, 'notification-read-button--read')
		.style.bind(justMarkedUnread, 'notification-read-button--just-marked-unread')
		.tweak(button => button.icon!.style('notification-read-button-icon'))
		.event.subscribe('click', async event => {
			event.preventDefault()
			event.stopImmediatePropagation()

			if (!await Notifications.markRead(!read.value, data.id))
				return

			read.value = !read.value
			if (!read.value) {
				justMarkedUnread.value = true
				readButton.hoveredOrFocused.await(component, false, () => justMarkedUnread.value = false)
			}
		})
		.appendTo(notification)

	Component()
		.style('notification-label')
		.append(
			Component().text.set(translationFunction?.({ TRIGGERED_BY, AUTHOR, WORK, CHAPTER })),
			document.createTextNode('   '),
			Timestamp(data.created_time).style('notification-timestamp'),
		)
		.appendTo(notification)

	const comment = Comments.resolve(data.comment, Notifications.comments.value)
	if (comment) {
		Component()
			.style('markdown')
			.append(comment.body && Component('blockquote')
				.style('notification-comment')
				.setMarkdownContent(TextBody.resolve(comment.body, Notifications.authors.value), 64))
			.appendTo(notification)

		if (chapter)
			notification.and(Link, `/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}`)
	}

	return notification
		.extend<NotificationChildrenExtensions>(notification => ({
			readButton,
		}))
})

export default Notification
