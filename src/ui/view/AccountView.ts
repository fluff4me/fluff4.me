import EndpointAuthorDelete from 'endpoint/author/EndpointAuthorDelete'
import Session from 'model/Session'
import OAuthServices from 'ui/component/auth/OAuthServices'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import type Form from 'ui/component/core/Form'
import Slot from 'ui/component/core/Slot'
import AccountViewForm from 'ui/view/account/AccountViewForm'
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

		// Slot()
		// 	.use(state, (slot, state) => state === 'logged-in'
		// 		&& AccountViewPatreonCampaign(services.data.patreon).subviewTransition(id))
		// 	.appendTo(view.content)

		services.subviewTransition(id)
		services.appendTo(view.content)

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
									const result = await ConfirmDialog.prompt(view, { dangerToken: 'delete-account' })
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
