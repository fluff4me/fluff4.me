import EndpointAuthServices from 'endpoint/auth/EndpointAuthServices'
import type { DangerTokenType } from 'model/Session'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import type { OAuthServiceEvents } from 'ui/component/OAuthService'
import AccountViewOAuthService from 'ui/component/OAuthService'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import Objects from 'utility/Objects'
import type State from 'utility/State'

interface OAuthServicesExtensions {
}

interface OAuthServices extends Block, OAuthServicesExtensions {
	readonly event: EventManipulator<this, Events<Block, OAuthServiceEvents>>
}

const OAuthServices = Component.Builder(async (component, state: State<Session.Auth.State>, reauthDangerToken?: DangerTokenType): Promise<OAuthServices> => {
	const block = component
		.and(Block)
		.viewTransition('oauth-services')
		.style('oauth-service-container')
		.style.toggle(!!reauthDangerToken, 'oauth-service-container--reauth-list')
		.extend<OAuthServicesExtensions>(block => ({})) as OAuthServices

	if (reauthDangerToken) {
		block.type('flush')
	}
	else {
		state.use(component, state => {
			block.title.text.use(`view/account/auth/${state}/title`)
			block.description.text.use(`view/account/auth/${state}/description`)
		})
	}

	const list = Component()
		.style('oauth-service-list')
		.appendTo(block)

	const services = await EndpointAuthServices.query()
	if (services instanceof Error) {
		console.error(services)
		return block
	}

	for (const service of Objects.values(services.data))
		if (!reauthDangerToken || Session.Auth.isAuthed(service))
			AccountViewOAuthService(service, reauthDangerToken)
				// .event.subscribe("dangerTokenGranted", event => block.event.emit("dangerTokenGranted"))
				.appendTo(list)

	return block
})

export default OAuthServices
