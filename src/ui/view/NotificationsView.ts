import NotificationList from 'ui/component/NotificationList'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	async load () {
		const list = await NotificationList()
		return { list }
	},
	create (_, { list }) {
		const view = View('notifications')
		list.appendTo(view.content)
		return view
	},
})
