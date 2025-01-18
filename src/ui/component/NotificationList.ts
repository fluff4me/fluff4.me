import type { Notification as NotificationData } from 'api.fluff4.me'
import type { PreparedPaginatedQueryReturning } from 'endpoint/Endpoint'
import EndpointNotificationMarkRead from 'endpoint/notification/EndpointNotificationMarkRead'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Paginator from 'ui/component/core/Paginator'
import type Slot from 'ui/component/core/Slot'
import Notification from 'ui/component/Notification'

interface NotificationListExtensions {

}

interface NotificationList extends Paginator, NotificationListExtensions { }

const NotificationList = Component.Builder(async (component, query: PreparedPaginatedQueryReturning<NotificationData[]>, initialNotifications?: NotificationData[]): Promise<NotificationList> => {
	const list = component
		.and(Paginator)
		.style('notification-list')
		.extend<NotificationListExtensions>(list => ({

		}))

	Button()
		.setIcon('check-double')
		.event.subscribe('click', async () => {
			const notifs = list.data.value as NotificationData[]
			const response = await EndpointNotificationMarkRead.query({ body: { notification_ids: notifs.map(n => n.id) } })
			if (response instanceof Error)
				return

			// TODO figure out how to update render
		})
		.appendTo(list.primaryActions)

	list.header.style('notification-list-header')
	list.title.style('notification-list-title')
		.text.use('masthead/user/notifications/title')
	list.content.style('notification-list-content')
	list.footer.style('notification-list-footer')

	if (initialNotifications)
		await list.useInitial(initialNotifications, 0, true).thenUse(query).withContent(initialiseNotificationsPage)
	else
		await list.useEndpoint(query, initialiseNotificationsPage)

	return list

	function initialiseNotificationsPage (slot: Slot, notifications: NotificationData[]) {
		slot.style('notification-list-page')
		for (const notification of notifications) {
			Notification(notification)
				?.appendTo(slot)
		}
	}
})

export default NotificationList
