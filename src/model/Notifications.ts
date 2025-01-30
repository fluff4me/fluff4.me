import type { Author, ChapterLite, CommentResolved, Notification, Work } from 'api.fluff4.me'
import EndpointNotificationGetAll from 'endpoint/notification/EndpointNotificationGetAll'
import EndpointNotificationGetCount from 'endpoint/notification/EndpointNotificationGetCount'
import EndpointNotificationMarkRead from 'endpoint/notification/EndpointNotificationMarkRead'
import EndpointNotificationMarkUnread from 'endpoint/notification/EndpointNotificationMarkUnread'
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
	works?: Work[]
	chapters?: ChapterLite[]
	comments?: CommentResolved[]
	hasMore?: boolean
	unreadCount?: number
}

declare module 'utility/Store' {
	interface ILocalStorage {
		notifications: NotificationsCache
	}
}

namespace Notifications {

	Session.setClearedWithSessionChange('notifications', () => {
		cache.clear()
		simpleCache = []
		authors.value = []
		works.value = []
		chapters.value = []
		comments.value = []
		hasMore.value = false
		unreadCount.value = 0
		lastUpdate.value = 0
	})

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

				const data = response.data
				if (!data.notifications.length)
					return null

				simpleCache.push(...data.notifications)
				simpleCache.sort(...sortNotifs)

				authors.value = [...Store.items.notifications?.authors ?? [], ...data.authors]
				works.value = [...Store.items.notifications?.works ?? [], ...data.works]
				chapters.value = [...Store.items.notifications?.chapters ?? [], ...data.chapters]
				comments.value = [...Store.items.notifications?.comments ?? [], ...data.comments]

				Store.items.notifications = {
					...Store.items.notifications,
					cache: simpleCache,
					authors: authors.value,
					works: works.value,
					chapters: chapters.value,
					comments: comments.value,
				}
			}

			return simpleCache.slice(start, end)
		},
	})
	export const authors = State(Store.items.notifications?.authors ?? [])
	export const works = State(Store.items.notifications?.works ?? [])
	export const chapters = State(Store.items.notifications?.chapters ?? [])
	export const comments = State(Store.items.notifications?.comments ?? [])
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
		const endpoint = read ? EndpointNotificationMarkRead : EndpointNotificationMarkUnread
		const response = await endpoint.query({ body: { notification_ids: ids } })
		if (toast.handleError(response))
			return false

		let modifiedCount = 0
		for (const notification of simpleCache)
			if (ids.includes(notification.id))
				if (notification.read !== read) {
					notification.read = read
					modifiedCount++
				}

		if (!modifiedCount)
			return true

		unreadCount.value += read ? -modifiedCount : modifiedCount

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
			notifications.cache = simpleCache = firstPage.data.notifications.sort(...sortNotifs)
			notifications.authors = authors.value = firstPage.data.authors
			notifications.works = works.value = firstPage.data.works
			notifications.chapters = chapters.value = firstPage.data.chapters
			notifications.comments = comments.value = firstPage.data.comments
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
