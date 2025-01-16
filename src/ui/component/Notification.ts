import type { ManifestNotificationTypes, Notification as NotificationData } from 'api.fluff4.me'
import type { Weave, WeavingArg } from 'lang/en-nz'
import quilt from 'lang/en-nz'
import Component from 'ui/Component'
import Link from 'ui/component/core/Link'

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

interface NotificationExtensions {

}

interface Notification extends Component, NotificationExtensions { }

const Notification = Component.Builder((component, data: NotificationData): Notification | undefined => {
	const translationFunction = notificationQuilt[`notification/${data.type as NotificationType}`]
	if (!translationFunction)
		return undefined

	const notification = component
		.style('notification')
		.extend<NotificationExtensions>(notification => ({

		}))

	const TRIGGERED_BY = !data.triggered_by ? undefined : Link(`/author/${data.triggered_by.vanity}`).text.set(data.triggered_by.name)
	const AUTHOR = !data.author ? undefined : Link(`/author/${data.author.vanity}`).text.set(data.author.name)
	const WORK = !data.author || !data.work ? undefined : Link(`/work/${data.author.vanity}/${data.work.vanity}`).text.set(data.work.name)
	const CHAPTER = !data.author || !data.work || !data.chapter ? undefined : Link(`/work/${data.author.vanity}/${data.work.vanity}/${data.chapter.url}`).text.set(data.chapter.name)

	Component()
		.text.set(translationFunction?.({ TRIGGERED_BY, AUTHOR, WORK, CHAPTER }))
		.appendTo(notification)

	return notification
})

export default Notification
