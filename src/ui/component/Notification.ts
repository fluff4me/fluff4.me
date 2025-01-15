import type { Notification as NotificationData } from 'api.fluff4.me'
import Component from 'ui/Component'

interface NotificationExtensions {

}

interface Notification extends Component, NotificationExtensions { }

const Notification = Component.Builder((component, data: NotificationData): Notification => {
	const notification = component
		.style('notification')
		.extend<NotificationExtensions>(notification => ({

		}))

	return notification
})

export default Notification
