import type { Author, Notification } from 'api.fluff4.me'
import EndpointNotificationGetAll from 'endpoint/notification/EndpointNotificationGetAll'
import EndpointNotificationGetCount from 'endpoint/notification/EndpointNotificationGetCount'
import EndpointNotificationMarkRead from 'endpoint/notification/EndpointNotificationMarkRead'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import State from 'utility/State'
import Store from 'utility/Store'
import Time from 'utility/Time'

interface NotificationsCache {
	lastCheck?: number
	lastUpdate?: number
	cache?: Notification[]
	authors?: Author[]
	hasMore?: boolean
	unreadCount?: number
}

declare module 'utility/Store' {
	interface ILocalStorage {
		notifications: NotificationsCache
	}
}

namespace Notifications {

	let simpleCache = Store.items.notifications?.cache ?? []
	const pageSize = 25
	export const cache = PagedListData(pageSize, {
		async get (page) {
			const start = page * pageSize
			const end = (page + 1) * pageSize

			if (simpleCache.length < start) {
				const response = await EndpointNotificationGetAll.query(undefined, { page, page_size: pageSize })
				if (toast.handleError(response))
					return false

				const notifications = response.data
				if (!notifications.length)
					return null

				simpleCache.push(...notifications)
				simpleCache.sort(...sortNotifs)
				Store.items.notifications = { ...Store.items.notifications, cache: simpleCache }
			}

			return simpleCache.slice(start, end)
		},
	})
	export const hasMore = State(Store.items.notifications?.hasMore ?? false)
	export const unreadCount = State(Store.items.notifications?.unreadCount ?? 0)
	export const lastUpdate = State(Store.items.notifications?.lastUpdate ?? 0)

	export function clear () {
		if (Store.items.notifications)
			Store.items.notifications = { ...Store.items.notifications, lastCheck: 0, lastUpdate: 0 }
	}

	export function check () {
		if (Store.items.notifications)
			Store.items.notifications = { ...Store.items.notifications, lastCheck: 0 }

		return checkNotifications()
	}

	export async function await () {
		await checkNotifications()
	}

	export async function markRead (read: boolean, ...ids: string[]) {
		const response = await EndpointNotificationMarkRead.query({ body: { notification_ids: ids } })
		if (toast.handleError(response))
			return false

		for (const notification of simpleCache)
			if (ids.includes(notification.id))
				notification.read = read

		Store.items.notifications = { ...Store.items.notifications, cache: simpleCache }
		for (const page of cache.pages)
			if (Array.isArray(page.value) && page.value.some(n => ids.includes(n.id)))
				page.emit()

		return true
	}

	const sortNotifs = [
		(notif: Notification) => -+notif.read,
		(notif: Notification) => -new Date(notif.created_time).getTime(),
	]

	let activeCheck: Promise<void> | undefined

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	setInterval(checkNotifications, Time.seconds(5))

	async function checkNotifications () {
		if (activeCheck)
			return await activeCheck

		if (!Session.Auth.author.value)
			return

		let notifications = Store.items.notifications

		const now = Date.now()
		if (now - (notifications?.lastCheck ?? 0) < Time.minutes(1))
			return

		notifications ??= {}

		let resolve!: () => void
		activeCheck = new Promise(r => resolve = r)
		try {
			const response = await EndpointNotificationGetCount.query()
			if (toast.handleError(response))
				return

			const time = new Date(response.data.notification_time_last_modified).getTime()
			if (time <= (notifications.lastUpdate ?? 0))
				return

			const firstPage = await EndpointNotificationGetAll.query()
			if (toast.handleError(firstPage))
				return

			const count = response.data.unread_notification_count
			notifications.unreadCount = unreadCount.value = count
			notifications.cache = simpleCache = firstPage.data.sort(...sortNotifs)
			notifications.hasMore = hasMore.value = firstPage.has_more
			notifications.lastUpdate = lastUpdate.value = time
			cache.clear()
		}
		finally {
			notifications.lastCheck = Date.now()
			Store.items.notifications = notifications

			resolve()
			activeCheck = undefined
		}
	}
}

Object.assign(window, { Notifications })

export default Notifications
