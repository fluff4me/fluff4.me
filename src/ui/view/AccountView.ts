import Form from "ui/component/Form"
import AccountViewOAuthServices from "ui/view/account/AccountViewOAuthServices"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

export default ViewDefinition({
	create: async () => {
		const view = View("account")

		const services = await AccountViewOAuthServices()
		services.appendTo(view)

		const form = Form()
			.appendTo(view)

		form.header

		return view
	},
})
