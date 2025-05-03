import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import LoginView from 'ui/view/LoginView'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('require-login')

		const block = Block().appendTo(view.content)

		block.title.text.use('view/shared/login-required/title')
		block.description.text.use('view/shared/login-required/description')

		const actionRow = ActionRow()
			.appendTo(block)

		Button()
			.type('primary')
			.text.use('view/shared/login-required/action')
			.event.subscribe('click', () => navigate.ephemeral(LoginView, undefined))
			.appendTo(actionRow.right)

		return view
	},
})
