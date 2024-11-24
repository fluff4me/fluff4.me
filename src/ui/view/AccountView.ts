import EndpointAuthorDelete from "endpoint/author/EndpointAuthorDelete"
import Session from "model/Session"
import ActionRow from "ui/component/core/ActionRow"
import Button from "ui/component/core/Button"
import type Form from "ui/component/core/Form"
import Slot from "ui/component/core/Slot"
import AccountViewForm from "ui/view/account/AccountViewForm"
import AccountViewOAuthServices from "ui/view/account/AccountViewOAuthServices"
import View from "ui/view/shared/component/View"
import ViewDefinition from "ui/view/shared/component/ViewDefinition"
import ViewTransition from "ui/view/shared/ext/ViewTransition"
import State from "utility/State"

export default ViewDefinition({
	create: async () => {
		const id = "account"
		const view = View(id)

		const state = State<Session.Auth.State>(Session.Auth.state.value)

		Slot()
			.use(state, () => createForm()?.subviewTransition(id))
			.appendTo(view)

		const services = await AccountViewOAuthServices(state)
		services.header.subviewTransition(id)
		services.appendTo(view)

		Slot()
			.use(state, () => createActionRow()?.subviewTransition(id))
			.appendTo(view)

		Session.Auth.state.subscribe(view, () =>
			ViewTransition.perform("subview", id, updateAuthState))

		updateAuthState()

		return view

		function updateAuthState (newState = Session.Auth.state.value) {
			state.value = newState
		}

		function createForm (): Form | undefined {
			switch (state.value) {
				case "has-authorisations":
					return AccountViewForm("create")
				case "logged-in":
					return AccountViewForm("update")
			}
		}

		function createActionRow (): ActionRow | undefined {
			switch (state.value) {
				case "logged-in":
					return ActionRow()
						.viewTransition("account-action-row")
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
