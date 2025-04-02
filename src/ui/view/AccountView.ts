import EndpointAuthSetRequiredCount from 'endpoint/auth/EndpointAuthSetRequiredCount'
import EndpointTOTPVerify from 'endpoint/auth/EndpointTOTPVerify'
import EndpointAuthorDelete from 'endpoint/author/EndpointAuthorDelete'
import Session from 'model/Session'
import Component from 'ui/Component'
import OAuthServices from 'ui/component/auth/OAuthServices'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import CodeInput from 'ui/component/core/CodeInput'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import type Form from 'ui/component/core/Form'
import Heading from 'ui/component/core/Heading'
import LabelledRow from 'ui/component/core/LabelledRow'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import RangeInput from 'ui/component/core/RangeInput'
import Slot from 'ui/component/core/Slot'
import AccountViewForm from 'ui/view/account/AccountViewForm'
import AccountViewPatreonCampaign from 'ui/view/account/AccountViewPatreonCampaign'
import AccountViewTOTP from 'ui/view/account/AccountViewTOTP'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import State from 'utility/State'

export default ViewDefinition({
	async load () {
		const state = State<Session.Auth.State>(Session.Auth.state.value)
		const services = await OAuthServices(state)
		return { state, services }
	},
	create (_, { state, services }) {
		const id = 'account'
		const view = View(id)

		Session.Auth.author.use(view, author =>
			view.breadcrumbs.setBackButton(!author?.vanity ? undefined : `/author/${author.vanity}`,
				button => button.subText.set(author?.name))
		)

		Slot()
			.use(state, () => createForm()?.subviewTransition(id))
			.appendTo(view.content)

		Slot()
			.use(state, (slot, state) => state === 'logged-in'
				&& AccountViewPatreonCampaign(services.data.patreon).subviewTransition(id))
			.appendTo(view.content)

		services.subviewTransition(id)
		services.appendTo(view.content)

		////////////////////////////////////
		//#region Edit Required Count

		const availableCount = Session.state.map(services, session => session?.author?.authorisations?.length ?? 1)
		const requiredCount = Session.state.map(services, session => session?.author?.auth_services_required ?? 1)
		Slot().appendTo(services.content).use(State.UseManual({ availableCount, requiredCount }), (slot, { availableCount, requiredCount }) => {
			if (availableCount <= 1)
				return

			Heading()
				.style('view-type-account-oauth-services-mfa-heading')
				.text.use('view/account/auth/logged-in/mfa/title')
				.appendTo(slot)

			Placeholder()
				.text.use('view/account/auth/logged-in/mfa/description')
				.appendTo(Paragraph().appendTo(slot))

			const row = LabelledRow()
				.style('view-type-account-oauth-services-mfa-required-count-row')
				.appendTo(slot)
			row.label.text.use('view/account/auth/logged-in/mfa/label/required-count')
			const requiredRange = RangeInput(1, availableCount)
				.default.set(requiredCount)
				.appendTo(row.content.style('view-type-account-oauth-services-mfa-required-count-row-content'))

			Button()
				.type('primary')
				.text.use('view/account/auth/logged-in/mfa/action/save')
				.bindDisabled(requiredRange.state.mapManual(newRequired => !newRequired || newRequired === requiredCount), 'no change')
				.event.subscribe('click', async () => {
					const newRequiredCount = requiredRange.state.value ?? 1
					if (newRequiredCount < requiredCount)
						if (!await ConfirmDialog.ensureDangerToken(row, { dangerToken: 'decrease-auth-service-count-required' }))
							return

					const response = await EndpointAuthSetRequiredCount.query({ body: { required_count: requiredRange.state.value ?? 1 } })
					if (toast.handleError(response))
						return

					if (Session.state.value?.author) {
						Session.state.value.author.auth_services_required = newRequiredCount
						Session.state.emit()
					}

					// queue a full session refresh just in case
					Session.refresh()
				})
				.appendTo(row.content)
		})

		//#endregion
		////////////////////////////////////

		////////////////////////////////////
		//#region TOTP Login

		const needsTOTP = Session.state.map(view, session => !!session?.partial_login?.totp_required)
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

				Session.refresh()
			})
			.appendToWhen(needsTOTP, services.footer.right)

		services.footer.appendToWhen(needsTOTP, services)

		//#endregion
		////////////////////////////////////

		AccountViewTOTP(Session.state)
			.subviewTransition(id)
			.appendToWhen(Session.Auth.loggedIn, view.content)

		Slot()
			.use(state, () => createActionRow()?.subviewTransition(id))
			.appendTo(view.content)

		Session.Auth.state.subscribe(view, () =>
			ViewTransition.perform('subview', id, updateAuthState))

		updateAuthState()

		return view

		function updateAuthState (newState = Session.Auth.state.value) {
			state.value = newState
		}

		function createForm (): Form | undefined {
			switch (state.value) {
				case 'has-authorisations':
					return AccountViewForm('create')
				case 'logged-in':
					return AccountViewForm('update')
			}
		}

		function createActionRow (): ActionRow | undefined {
			switch (state.value) {
				case 'logged-in':
					return ActionRow()
						.viewTransition('account-action-row')
						.tweak(row => row.right
							.append(Button()
								.text.use('view/account/action/logout')
								.event.subscribe('click', () => Session.reset()))
							.append(Button()
								.text.use('view/account/action/delete')
								.event.subscribe('click', async () => {
									const result = await ConfirmDialog.prompt(view, {
										dangerToken: 'delete-account',
										bodyTranslation: 'view/account/action/delete/confirm',
									})
									if (!result)
										return

									const response = await EndpointAuthorDelete.query()
									if (toast.handleError(response))
										return

									return Session.reset()
								})))
			}
		}
	},
})
