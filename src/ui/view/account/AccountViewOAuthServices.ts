import Component from "ui/Component"
import Block from "ui/component/Block"
import AccountViewOAuthService from "ui/view/account/AccountViewOAuthService"
import EndpointAuthServices from "utility/endpoint/auth/EndpointAuthServices"
import Objects from "utility/Objects"

export default Component.Builder(async component => {
	component.and(Block)

	const block = component
		.style("account-view-oauth-service-container")

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
