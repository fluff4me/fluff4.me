import type { AuthServices } from 'api.fluff4.me'
import EndpointAuthServices from 'endpoint/auth/EndpointAuthServices'
import type { DangerTokenType } from 'model/Session'
import Session from 'model/Session'
import Component from 'ui/Component'
import type { OAuthServiceEvents } from 'ui/component/auth/OAuthService'
import AccountViewOAuthService from 'ui/component/auth/OAuthService'
import Block from 'ui/component/core/Block'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import Objects, { mutable } from 'utility/Objects'
import State from 'utility/State'

interface OAuthServicesExtensions {
	readonly data: AuthServices
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
		.extend<OAuthServicesExtensions>(block => ({
			data: undefined!,
		})) as OAuthServices

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
		.appendTo(block.content)

	const services = await EndpointAuthServices.query()
	if (toast.handleError(services)) {
		console.error(services)
		return block
	}

	mutable(block).data = services.data

	Slot()
		.use(Session.has, (slot, session) => {
			if (!session)
				return Component()
					.and(Placeholder)
					.text.use('view/account/auth/none/needs-session')
					.appendTo(slot)

			for (const service of Objects.values(services.data))
				if (!service.disabled)
					if (!reauthDangerToken || Session.Auth.isAuthed(service))
						AccountViewOAuthService(service,
							{
								async onClick (button) {
									if (!reauthDangerToken)
										return false

									if (!Session.Auth.canRequestDangerToken())
										return true

									const granted = await Session.Auth.requestDangerToken(reauthDangerToken, service)
									if (granted)
										button.event.bubble('DangerTokenGranted', reauthDangerToken)
									else;
									// TODO show notification
									return true
								},
							})
							.bindDisabled(State
								.Use(component, { authorisations: Session.Auth.authorisations, author: Session.Auth.author })
								.map(component, ({ authorisations, author }) => true
									&& !reauthDangerToken
									&& !!author
									&& authorisations.length === 1
									&& authorisations[0].service === service.name
								), 'singly-authed-service')
							// .event.subscribe("dangerTokenGranted", event => block.event.emit("dangerTokenGranted"))
							.tweak(service => {
								if (reauthDangerToken)
									service.stateIndicatorWrapper.remove()
							})
							.appendTo(slot)
		})
		.appendTo(list)

	return block
})

ConfirmDialog.setOauthServicesComponent(OAuthServices)
export default OAuthServices
