import type { Authorisation } from 'api.fluff4.me'
import { type AuthService } from 'api.fluff4.me'
import type { DangerTokenType } from 'model/Session'
import Session from 'model/Session'
import Component from 'ui/Component'
import Checkbutton from 'ui/component/core/Checkbutton'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import { mutable } from 'utility/Objects'
import State from 'utility/State'
import type { PromiseOr } from 'utility/Type'

export interface OAuthServiceEvents {
	DangerTokenGranted (dangerToken: DangerTokenType): any
}

interface OAuthServiceExtensions {
	readonly service: AuthService
	readonly stateIndicatorWrapper: Component
	readonly stateIndicator: Component
}

interface OAuthService extends Checkbutton, OAuthServiceExtensions {
	readonly event: EventManipulator<this, Events<Checkbutton, OAuthServiceEvents>>
}

export interface OAuthServiceDefinition {
	onClick?(button: OAuthService): PromiseOr<boolean>
	authorisationState?: State<Authorisation | undefined>
}

const OAuthService = Component.Builder((component, service: AuthService, definition?: OAuthServiceDefinition): OAuthService => {
	const authedAtStart = !!Session.Auth.get(service.name)

	const authorisationState = _
		?? definition?.authorisationState
		?? Session.Auth.authorisations.map(component, authorisations =>
			authorisations.find(authorisation => authorisation.service === service.name))

	const isAuthed = State.Truthy(component, authorisationState)

	const button = component
		.and(Checkbutton)
		.setChecked(authedAtStart)
		.style('oauth-service')
		.ariaRole('button')
		.attributes.remove('aria-checked')
		.setIcon()
		.use(isAuthed)
		.style.bind(isAuthed, 'oauth-service--authenticated')
		.style.setVariable('colour', `#${service.colour.toString(16)}`)
		.append(Component('img')
			.style('oauth-service-icon')
			.attributes.set('src', service.icon))
		.append(Component()
			.style('oauth-service-name')
			.text.set(service.name))
		.extend<OAuthServiceExtensions>(button => ({
			service,
			stateIndicatorWrapper: undefined!,
			stateIndicator: undefined!,
		})) as OAuthService

	button.style.bind(button.disabled, 'button--disabled', 'oauth-service--disabled')

	mutable(button).stateIndicatorWrapper = Component()
		.style('oauth-service-state-wrapper')
		.style.bind(button.hoveredOrFocused, 'oauth-service-state-wrapper--focus')
		.appendTo(button)

	mutable(button).stateIndicator = Component()
		.style('oauth-service-state')
		.style.bind(isAuthed, 'oauth-service-state--authenticated')
		.style.bind(
			State.Map(button, [button.hoveredOrFocused, button.disabled], (focus, disabled) => focus && !disabled),
			'oauth-service-state--focus'
		)
		.appendTo(button.stateIndicatorWrapper)

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
			if (button.disabled.value)
				return

			event.preventDefault()

			if (await definition?.onClick?.(button))
				return

			const auth = Session.Auth.get(service.name)
			if (auth)
				await Session.Auth.unauth(auth.id)
			else
				await Session.Auth.auth(service)
		})
	})

	return button
})

export default OAuthService
