import EndpointAuthorDelete from "endpoint/author/EndpointAuthorDelete"
import Session from "model/Session"
import ActionRow from "ui/component/core/ActionRow"
import Button from "ui/component/core/Button"
import type Form from "ui/component/core/Form"
import Slot from "ui/component/core/Slot"
import AccountViewForm from "ui/view/account/AccountViewForm"
import AccountViewOAuthServices from "ui/view/account/AccountViewOAuthServices"
import ViewTransition from "ui/view/component/ViewTransition"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"
import State from "utility/State"

export default ViewDefinition({
	create: async () => {
		const view = View("account")

		const state = State<Session.Auth.State>(Session.Auth.state.value)

		Slot()
			.use(state, (slot, state) => { createForm(state)?.appendTo(slot) })
			.appendTo(view)

		const services = await AccountViewOAuthServices(state)
		services.appendTo(view)

		Slot()
			.use(state, (slot, state) => { createActionRow(state)?.appendTo(slot) })
			.appendTo(view)

		Session.Auth.state.subscribe(view, () =>
			ViewTransition.perform("subview", updateAuthState))

		updateAuthState()

		return view

		function updateAuthState (newState = Session.Auth.state.value) {
			state.value = newState
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
