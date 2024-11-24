import ActionRow from "ui/component/core/ActionRow"
import Block from "ui/component/core/Block"
import Button from "ui/component/core/Button"
import AccountView from "ui/view/AccountView"
import View from "ui/view/shared/component/View"
import ViewDefinition from "ui/view/shared/component/ViewDefinition"

export default ViewDefinition({
	create: () => {
		const view = View("require-login")

		const block = Block().appendTo(view)

		block.title.text.use("view/shared/login-required/title")
		block.description.text.use("view/shared/login-required/description")

		const actionRow = ActionRow()
			.appendTo(block)

		Button()
			.type("primary")
			.text.use("view/shared/login-required/action")
			.event.subscribe("click", () => navigate.ephemeral(AccountView, undefined))
			.appendTo(actionRow.right)

		return view
	},
})
