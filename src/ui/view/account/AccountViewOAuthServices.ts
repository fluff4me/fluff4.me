import EndpointAuthServices from "endpoint/auth/EndpointAuthServices"
import type Session from "model/Session"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import AccountViewOAuthService from "ui/view/account/AccountViewOAuthService"
import ViewTransition from "ui/view/component/ViewTransition"
import Objects from "utility/Objects"
import type State from "utility/State"

interface AccountViewOAuthServicesExtensions {
}

interface AccountViewOAuthServices extends Component, AccountViewOAuthServicesExtensions { }

const AccountViewOAuthServices = Component.Builder(async (component, state: State<Session.Auth.State>): Promise<AccountViewOAuthServices> => {
	const block = component
		.and(Block)
		.style("account-view-oauth-service-container")

	block.header.and(ViewTransition.HasSubview)
	state.use(component, state => {
		block.title.text.use(`view/account/auth/${state}/title`)
		block.description.text.use(`view/account/auth/${state}/description`)
	})

	const list = Component()
		.style("account-view-oauth-service-list")
		.appendTo(block)

	const services = await EndpointAuthServices.query()
	if (services instanceof Error) {
		console.error(services)
		return block
	}

	for (const service of Objects.values(services.data))
		AccountViewOAuthService(service)
			.appendTo(list)

	return block
})

export default AccountViewOAuthServices
