import Session from 'model/Session'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Errors from 'utility/Errors'

export default ViewDefinition({
	load (params) {
		if (!Session.Auth.hasPrivilege('TagGlobalCreate'))
			throw Errors.Forbidden()

		return undefined
	},
	create: () => {
		const view = View('manage-tags')

		view.breadcrumbs.title.text.use('view/manage-tags/title')
		view.breadcrumbs.description.text.use('view/manage-tags/description')

		return view
	},
})
