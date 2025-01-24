import type { Notification as NotificationData } from 'api.fluff4.me'
import EndpointNotificationMarkRead from 'endpoint/notification/EndpointNotificationMarkRead'
import Notifications from 'model/Notifications'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Paginator2 from 'ui/component/core/Paginator2'
import Notification from 'ui/component/Notification'

interface NotificationListExtensions {
	readonly paginator: Paginator2
}

interface NotificationList extends Component, NotificationListExtensions { }

const NotificationList = Component.Builder(async (component, onlyUnread?: true, pageSize?: number): Promise<NotificationList> => {
	const paginator = component.and(Paginator2)
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
			const response = await EndpointNotificationMarkRead.query({ body: { notification_ids: notifs.map(n => n.id) } })
			if (toast.handleError(response))
				return

			// TODO figure out how to update render
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
