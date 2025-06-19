import type { Notification as NotificationData } from 'api.fluff4.me'
import Notifications from 'model/Notifications'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Paginator from 'ui/component/core/Paginator'
import Notification from 'ui/component/Notification'

interface NotificationListExtensions {
	readonly paginator: Paginator
}

interface NotificationList extends Component, NotificationListExtensions { }

const NotificationList = Component.Builder(async (component, onlyUnread?: true, pageSize?: number): Promise<NotificationList> => {
	const paginator = component.and(Paginator)
		.style('notification-list')

	const list = component
		.extend<NotificationListExtensions>(list => ({
			paginator,
		}))

	Button()
		.setIcon('check-double')
		.type('icon')
		.event.subscribe('click', async () => {
			const notifs = paginator.data.value as NotificationData[]
			await Notifications.markRead(true, ...notifs.map(n => n.id))
		})
		.appendTo(paginator.primaryActions)

	paginator.header.style('notification-list-header')
	paginator.title.style('notification-list-title')
		.text.use('masthead/user/notifications/title')
	paginator.content.style('notification-list-content')
	paginator.footer.style('notification-list-footer')

	await Notifications.await()
	const cache = pageSize === undefined ? Notifications.cache : Notifications.cache.resized(pageSize)
	paginator.set(cache, (slot, notifications) => {
		slot.style('notification-list-page')
		for (const notification of notifications) {
			Notification(notification)
				?.appendTo(slot)
		}
	})

	return list
})

export default NotificationList
