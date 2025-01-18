import EndpointNotificationGetAll from 'endpoint/notification/EndpointNotificationGetAll'
import NotificationList from 'ui/component/NotificationList'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: async () => {
		const view = View('notifications')

		const list = await NotificationList(EndpointNotificationGetAll.prep())
		list.appendTo(view)

		return view
	},
})
