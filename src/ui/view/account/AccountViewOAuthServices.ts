import Component from "ui/Component"
import Block from "ui/component/Block"
import AccountViewOAuthService from "ui/view/account/AccountViewOAuthService"
import EndpointAuthServices from "utility/endpoint/auth/EndpointAuthServices"
import Objects from "utility/Objects"

export enum AccountViewOAuthServicesClasses {
	Main = "account-view-oauth-services",
}

export default Component.Builder(async (component = Block()) => {
	const block = component
		.classes.add(AccountViewOAuthServicesClasses.Main)

	const services = await EndpointAuthServices.query()
	if (services instanceof Error) {
		console.error(services)
		return block
	}

	console.log(services.data)

	for (const service of Objects.values(services.data))
		AccountViewOAuthService(service)
			.appendTo(block)

	return block
})
