import type { Notification as NotificationData } from 'api.fluff4.me'
import type { PreparedPaginatedQueryReturning } from 'endpoint/Endpoint'
import Component from 'ui/Component'
import Paginator from 'ui/component/core/Paginator'
import type Slot from 'ui/component/core/Slot'
import Notification from 'ui/component/Notification'

interface NotificationListExtensions {

}

interface NotificationList extends Component, NotificationListExtensions { }

const NotificationList = Component.Builder(async (component, query: PreparedPaginatedQueryReturning<NotificationData[]>, initialNotifications?: NotificationData[]): Promise<NotificationList> => {
	const list = component
		.and(Paginator)
		.type('flush')
		.style('notification-list')
		.extend<NotificationListExtensions>(list => ({

		}))

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
		for (const notification of notifications) {
			Notification(notification)
				?.appendTo(slot)
		}
	}
})

export default NotificationList
