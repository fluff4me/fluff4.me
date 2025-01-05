import { type AuthService } from 'api.fluff4.me'
import type { DangerTokenType } from 'model/Session'
import Session from 'model/Session'
import Component from 'ui/Component'
import Checkbutton from 'ui/component/core/Checkbutton'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import State from 'utility/State'

export interface OAuthServiceEvents {
	dangerTokenGranted (dangerToken: DangerTokenType): any
}

interface OAuthServiceExtensions {
}

interface OAuthService extends Checkbutton, OAuthServiceExtensions {
	readonly event: EventManipulator<this, Events<Checkbutton, OAuthServiceEvents>>
}

const OAuthService = Component.Builder((component, service: AuthService, reauthDangerToken?: DangerTokenType): OAuthService => {
	const authedAtStart = !!Session.Auth.get(service.name)

	const authorisationState = Session.Auth.authorisations.map(component, authorisations =>
		authorisations.find(authorisation => authorisation.service === service.name))

	const isAuthed = State.Truthy(component, authorisationState)

	const button = component
		.and(Checkbutton)
		.setChecked(authedAtStart)
		.style('oauth-service')
		.ariaRole('button')
		.attributes.remove('aria-checked')
		.style.bind(isAuthed, 'oauth-service--authenticated')
		.style.setVariable('colour', `#${service.colour.toString(16)}`)
		.append(Component('img')
			.style('oauth-service-icon')
			.attributes.set('src', service.icon))
		.append(Component()
			.style('oauth-service-name')
			.text.set(service.name))
		.extend<OAuthServiceExtensions>(button => ({})) as OAuthService

	if (!reauthDangerToken)
		Component()
			.style('oauth-service-state')
			.style.bind(isAuthed, 'oauth-service-state--authenticated')
			.style.bind(button.hoveredOrFocused, 'oauth-service-state--focus')
			.appendTo(Component()
				.style('oauth-service-state-wrapper')
				.style.bind(button.hoveredOrFocused, 'oauth-service-state-wrapper--focus')
				.appendTo(button))

	const username = Component()
		.style('oauth-service-username')
		.style.bind(isAuthed, 'oauth-service-username--has-username')
		.ariaHidden()
		.appendTo(button)

	authorisationState.use(button, authorisation => {
		button.ariaLabel.use(quilt => quilt[`view/account/auth/service/accessibility/${authorisation ? 'disconnect' : 'connect'}`](service.name, authorisation?.display_name))
		username.text.set(authorisation?.display_name ?? '')
	})

	button.onRooted(() => {
		button.event.subscribe('click', async event => {
			event.preventDefault()

			if (reauthDangerToken) {
				if (!Session.Auth.canRequestDangerToken())
					return

				const granted = await Session.Auth.requestDangerToken(reauthDangerToken, service)
				if (granted)
					button.event.bubble('dangerTokenGranted', reauthDangerToken)
				else;
				// TODO show notification
				return
			}

			let auth = Session.Auth.get(service.name)
			if (auth)
				await Session.Auth.unauth(auth.id)
			else
				await Session.Auth.auth(service)

			auth = Session.Auth.get(service.name)
			event.component.setChecked(!!auth)
		})
	})

	return button
})

export default OAuthService
