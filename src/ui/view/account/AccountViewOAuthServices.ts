import EndpointAuthServices from "endpoint/auth/EndpointAuthServices"
import Session from "model/Session"
import Component from "ui/Component"
import Block from "ui/component/Block"
import AccountViewOAuthService from "ui/view/account/AccountViewOAuthService"
import ViewTransition from "ui/view/component/ViewTransition"
import Objects from "utility/Objects"
import State from "utility/State"

interface AccountViewOAuthServicesExtensions {
	state: State<Session.Auth.State>
}

interface AccountViewOAuthServices extends Component, AccountViewOAuthServicesExtensions { }

const AccountViewOAuthServices = Component.Builder(async (component): Promise<AccountViewOAuthServices> => {
	const state = State<Session.Auth.State>(Session.Auth.state.value)

	const block = component
		.and(Block)
		.style("account-view-oauth-service-container")
		.extend<AccountViewOAuthServicesExtensions>(() => ({ state }))

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
