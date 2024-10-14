import EndpointAuthorDelete from "endpoint/author/EndpointAuthorDelete"
import Session from "model/Session"
import ActionRow from "ui/component/ActionRow"
import Button from "ui/component/Button"
import type Form from "ui/component/Form"
import Slot from "ui/component/Slot"
import AccountViewForm from "ui/view/account/AccountViewForm"
import AccountViewOAuthServices from "ui/view/account/AccountViewOAuthServices"
import ViewTransition from "ui/view/component/ViewTransition"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

export default ViewDefinition({
	create: async () => {
		const view = View("account")

		let form: Form | undefined
		const formSlot = Slot()
			.appendTo(view)

		const services = await AccountViewOAuthServices()
		services.appendTo(view)

		let actionRow: ActionRow | undefined
		const actionRowSlot = Slot()
			.appendTo(view)

		Session.Auth.state.subscribe(view, () =>
			ViewTransition.perform("subview", updateAuthState))

		updateAuthState()

		return view

		function updateAuthState (state = Session.Auth.state.value) {
			form?.remove()
			form = createForm(state)?.appendTo(formSlot)
			actionRow?.remove()
			actionRow = createActionRow(state)?.appendTo(actionRowSlot)
			services.state.value = state
		}

		function createForm (state: Session.Auth.State): Form | undefined {
			switch (state) {
				case "has-authorisations":
					return AccountViewForm("create")
				case "logged-in":
					return AccountViewForm("update")
			}
		}

		function createActionRow (state: Session.Auth.State): ActionRow | undefined {
			switch (state) {
				case "logged-in":
					return ActionRow()
						.tweak(row => row.right
							.append(Button()
								.text.use("view/account/action/logout")
								.event.subscribe("click", () => Session.reset()))
							.append(Button()
								.text.use("view/account/action/delete")
								.event.subscribe("click", async () => {
									const response = await EndpointAuthorDelete.query()
									if (response instanceof Error) {
										console.error(response)
										return
									}

									return Session.reset()
								})))
			}
		}
	},
})
