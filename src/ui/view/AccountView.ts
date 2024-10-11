import Session from "model/Session"
import Component from "ui/Component"
import type Block from "ui/component/Block"
import AccountViewFormCreate from "ui/view/account/AccountViewFormCreate"
import AccountViewFormUpdate from "ui/view/account/AccountViewFormUpdate"
import AccountViewOAuthServices from "ui/view/account/AccountViewOAuthServices"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

export default ViewDefinition({
	create: async () => {
		const view = View("account")

		const accountFormSlot = Component()
			.appendTo(view)

		let formBlock: Block | undefined

		const services = await AccountViewOAuthServices()
		services.appendTo(view)

		Session.Auth.state.subscribe(view, () => {
			document.startViewTransition(updateAuthState)
		})

		updateAuthState()

		return view

		function updateAuthState (state = Session.Auth.state.value) {
			formBlock?.remove()
			createForm(state)?.appendTo(accountFormSlot)
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
