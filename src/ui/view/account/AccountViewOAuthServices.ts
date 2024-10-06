import Component from "ui/Component"
import Block from "ui/component/Block"
import AccountViewOAuthService from "ui/view/account/AccountViewOAuthService"
import EndpointAuthServices from "utility/endpoint/auth/EndpointAuthServices"
import Objects from "utility/Objects"

export default Component.Builder(async component => {
	const block = component
		.and(Block)
		.style("account-view-oauth-service-container")

	block.title.text.use("view/account/auth/title")
	block.description.text.use("view/account/auth/description")

	const list = Component()
		.style("account-view-oauth-service-list")
		.appendTo(block)

	const services = await EndpointAuthServices.query()
	if (services instanceof Error) {
		console.error(services)
		return block
	}

	console.log(services.data)

	for (const service of Objects.values(services.data))
		AccountViewOAuthService(service)
			.appendTo(list)

	return block
})
