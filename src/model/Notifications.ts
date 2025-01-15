import type { Notification } from 'api.fluff4.me'
import EndpointNotificationGetCount from 'endpoint/notification/EndpointNotificationGetCount'
import EndpointNotificationGetUnread from 'endpoint/notification/EndpointNotificationGetUnread'
import Session from 'model/Session'
import State from 'utility/State'
import Store from 'utility/Store'
import Time from 'utility/Time'

interface NotificationsCache {
	lastCheck?: number
	lastUpdate?: number
	recentUnreads?: Notification[]
	unreadCount?: number
}

declare module 'utility/Store' {
	interface ILocalStorage {
		notifications: NotificationsCache
	}
}

namespace Notifications {

	export const recentUnreads = State<Notification[]>([])
	export const unreadCount = State(0)

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	setInterval(checkNotifications, Time.seconds(5))

	async function checkNotifications () {
		if (!Session.Auth.author.value)
			return

		let notifications = Store.items.notifications

		const now = Date.now()
		if (now - (notifications?.lastCheck ?? 0) < Time.minutes(1))
			return

		const response = await EndpointNotificationGetCount.query()
		notifications ??= {}
		notifications.lastCheck = Date.now()
		Store.items.notifications = notifications

		if (response instanceof Error)
			// TODO 
			return

		const time = new Date(response.data.notification_time_last_modified).getTime()
		if (time <= (notifications.lastUpdate ?? 0))
			return

		const firstPage = await EndpointNotificationGetUnread.query()
		if (firstPage instanceof Error)
			// TODO 
			return

		const count = response.data.unread_notification_count
		notifications.unreadCount = unreadCount.value = count
		notifications.recentUnreads = recentUnreads.value = firstPage.data
		notifications.lastUpdate = time
		Store.items.notifications = notifications
	}
}

export default Notifications
