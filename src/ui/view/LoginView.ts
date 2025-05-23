import EndpointTOTPVerify from 'endpoint/auth/EndpointTOTPVerify'
import Session from 'model/Session'
import Component from 'ui/Component'
import OAuthServices from 'ui/component/auth/OAuthServices'
import Button from 'ui/component/core/Button'
import CodeInput from 'ui/component/core/CodeInput'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import AccountViewForm from 'ui/view/account/AccountViewForm'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import Errors from 'utility/Errors'
import State from 'utility/State'

const REDIRECT_ACCOUNT: Errors.Redirection = Errors.redirection('/account')

export default ViewDefinition({
	async load () {
		if (Session.Auth.state.value === 'logged-in')
			return REDIRECT_ACCOUNT()

		const state = State<Session.Auth.State>(Session.Auth.state.value)
		const services = await OAuthServices(state)
		return { state, services }
	},
	create (_, { state, services }) {
		const id = 'login'
		const view = View(id)

		AccountViewForm('create')
			.subviewTransition(id)
			.appendToWhen(state.equals('has-authorisations'), view.content)

		services.subviewTransition(id).appendTo(view.content)

		////////////////////////////////////
		//#region TOTP Login

		const needsTOTP = Session.state.map(view, session => !!session?.partial_login?.totp_required && !session.partial_login.additional_auth_services_required)
		const totpCodeInput = CodeInput()
			.event.subscribe('Enter', () => loginButton.element.click())

		Component()
			.style('view-type-account-totp-login-wrapper')
			.append(Paragraph()
				.append(Placeholder()
					.text.use('view/account/totp/login/description')))
			.append(totpCodeInput)
			.appendToWhen(needsTOTP, services.content)

		const loginButton = Button()
			.type('primary')
			.text.use('view/account/totp/login/action/login')
			.event.subscribe('click', async () => {
				const response = await EndpointTOTPVerify.query({ body: { token: totpCodeInput.state.value } })
				if (toast.handleError(response))
					return

				void Session.refresh()
			})
			.appendToWhen(needsTOTP, services.footer.right)

		services.footer.appendToWhen(needsTOTP, services)

		//#endregion
		////////////////////////////////////

		Session.Auth.state.subscribe(view, () =>
			ViewTransition.perform('subview', id, updateAuthState))

		state.match(view, 'logged-in', () => navigate.toURL('/account'))

		return view

		function updateAuthState (newState = Session.Auth.state.value) {
			state.value = newState
		}
	},
})
