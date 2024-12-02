import EndpointAuthServices from "endpoint/auth/EndpointAuthServices"
import Session from "model/Session"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import AccountViewOAuthService from "ui/component/OAuthService"
import Objects from "utility/Objects"
import type State from "utility/State"

interface OAuthServicesExtensions {
}

interface OAuthServices extends Block, OAuthServicesExtensions { }

export type OAuthServicesDisplayMode =
	| "auth-block"
	| "reauth-list"

const OAuthServices = Component.Builder(async (component, state: State<Session.Auth.State>, mode: OAuthServicesDisplayMode): Promise<OAuthServices> => {
	const block = component
		.and(Block)
		.viewTransition("oauth-services")
		.style("oauth-service-container")
		.style.toggle(mode === "reauth-list", "oauth-service-container--reauth-list")

	if (mode === "auth-block") {
		state.use(component, state => {
			block.title.text.use(`view/account/auth/${state}/title`)
			block.description.text.use(`view/account/auth/${state}/description`)
		})
	} else {
		block.type("flush")
	}

	const list = Component()
		.style("oauth-service-list")
		.appendTo(block)

	const services = await EndpointAuthServices.query()
	if (services instanceof Error) {
		console.error(services)
		return block
	}

	for (const service of Objects.values(services.data))
		if (mode === "auth-block" || Session.Auth.isAuthed(service))
			AccountViewOAuthService(service, mode)
				.appendTo(list)

	return block
})

export default OAuthServices
