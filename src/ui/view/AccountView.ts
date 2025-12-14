import EndpointAuthSetRequiredCount from 'endpoint/auth/EndpointAuthSetRequiredCount'
import EndpointAuthorsDelete from 'endpoint/authors/EndpointAuthorsDelete'
import Session from 'model/Session'
import OAuthServices from 'ui/component/auth/OAuthServices'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Heading from 'ui/component/core/Heading'
import LabelledRow from 'ui/component/core/LabelledRow'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import RangeInput from 'ui/component/core/RangeInput'
import Slot from 'ui/component/core/Slot'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import AccountViewForm from 'ui/view/account/AccountViewForm'
import AccountViewPatreonCampaign from 'ui/view/account/AccountViewPatreonCampaign'
import AccountViewSupporter from 'ui/view/account/AccountViewSupporter'
import AccountViewTOTP from 'ui/view/account/AccountViewTOTP'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Errors from 'utility/Errors'
import State from 'utility/State'

const REDIRECT_LOGIN: Errors.Redirection = Errors.redirection('/login')

interface AccountViewParams {
	tab?: string
}

export default ViewDefinition({
	async load () {
		if (Session.Auth.state.value !== 'logged-in')
			return REDIRECT_LOGIN()

		const services = await OAuthServices(Session.Auth.state)
		return { services }
	},
	create ({ tab }: AccountViewParams | undefined = {}, { services }) {
		const id = 'account'
		const view = View(id)

		const state = Session.Auth.state

		const isMainView = navigate.isURL('/account/**')
		if (isMainView)
			Session.Auth.author.use(view, author =>
				view.breadcrumbs.setBackButton(!author?.vanity ? undefined : `/author/${author.vanity}`,
					button => button.subText.set(author?.name))
			)

		const tabinator = Tabinator()
			.setMajor()
			.appendTo(view.content)

		Tab('profile')
			.setIcon('circle-user')
			.text.use('view/account/tab/profile')
			.tweak(tab => AccountViewForm('update')
				.subviewTransition(id)
				.appendTo(tab.content))
			.addTo(tabinator)

		Tab('patreon')
			.setIcon('patreon')
			.text.use('view/account/tab/patreon')
			.tweak(tab => Slot()
				.use(state, (slot, state) => state === 'logged-in'
					&& AccountViewPatreonCampaign(services.data.patreon).subviewTransition(id))
				.appendTo(tab.content))
			.addTo(tabinator)

		////////////////////////////////////
		//#region Supporter

		Tab('supporter')
			.setIcon('heart')
			.text.use('view/account/tab/supporter')
			.tweak(tab => AccountViewSupporter().appendTo(tab.content))
			.addTo(tabinator)

		//#endregion
		////////////////////////////////////

		////////////////////////////////////
		//#region Security

		Tab('security')
			.setIcon('shield-halved')
			.text.use('view/account/tab/security')
			.tweak(tab => {
				services
					.subviewTransition(id)
					.appendTo(tab.content)

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
							void Session.refresh()
						})
						.appendTo(row.content)
				})

				//#endregion
				////////////////////////////////////

				AccountViewTOTP(Session.state)
					.subviewTransition(id)
					.appendToWhen(Session.Auth.loggedIn, tab.content)
			})
			.addTo(tabinator)

		//#endregion
		////////////////////////////////////

		////////////////////////////////////
		//#region More

		Tab('more')
			.setIcon('ellipsis-vertical')
			.tweak(tab => tab.icon?.style('button-icon--unpad-left'))
			.text.use('view/account/tab/more')
			.tweak(tab =>
				Slot()
					.use(state, slot => slot
						.append(ActionRow()
							.style('view-type-account-more-row')
							.tweak(row => row.left.append(Button()
								.text.use('view/account/action/logout')
								.event.subscribe('click', () => Session.reset()))
							))
						.append(ActionRow()
							.style('view-type-account-more-row')
							.tweak(row => row.left.append(Button()
								.text.use('view/account/action/delete')
								.event.subscribe('click', async () => {
									const result = await ConfirmDialog.prompt(view, {
										dangerToken: 'delete-account',
										bodyTranslation: 'view/account/action/delete/confirm',
									})
									if (!result)
										return

									const response = await EndpointAuthorsDelete.query()
									if (toast.handleError(response))
										return

									return Session.reset()
								}))
							))
					)
					.appendTo(tab.content))
			.addTo(tabinator)

		//#endregion
		////////////////////////////////////

		if (isMainView)
			tabinator.bindURL(tab, tab => tab ? `/account/${tab}` : '/account')

		state.equals('logged-in').match(view, false, () => navigate.toURL('/login'))

		return view
	},
})
