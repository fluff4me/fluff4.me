import Session from "model/Session"
import Component from "ui/Component"
import AccountViewFormCreate from "ui/view/account/AccountViewFormCreate"
import AccountViewFormUpdate from "ui/view/account/AccountViewFormUpdate"
import AccountViewOAuthServices from "ui/view/account/AccountViewOAuthServices"
import ViewTransition from "ui/view/component/ViewTransition"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

export default ViewDefinition({
	create: async () => {
		const view = View("account")

		const accountFormSlot = Component()
			.appendTo(view)

		let form: Component | undefined

		const services = await AccountViewOAuthServices()
		services.appendTo(view)

		Session.Auth.state.subscribe(view, () =>
			ViewTransition.perform("subview", updateAuthState))

		updateAuthState()

		return view

		function updateAuthState (state = Session.Auth.state.value) {
			form?.remove()
			form = createForm(state)?.appendTo(accountFormSlot)
		}

		function createForm (state: Session.Auth.State): Component | undefined {
			switch (state) {
				case "has-authorisations":
					return AccountViewFormCreate()
				case "logged-in":
					return AccountViewFormUpdate()
			}
		}
	},
})
