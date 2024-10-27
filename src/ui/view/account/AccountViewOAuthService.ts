import { type AuthService } from "api.fluff4.me"
import Session from "model/Session"
import Component from "ui/Component"
import Checkbutton from "ui/component/core/Checkbutton"
import State from "utility/State"

export default Component.Builder((component, service: AuthService) => {
	const authedAtStart = !!Session.Auth.get(service.name)

	const authorisationState = State.Map(component, Session.Auth.authorisations, authorisations =>
		authorisations.find(authorisation => authorisation.service === service.name))

	const isAuthed = State.Truthy(component, authorisationState)

	const button = component
		.and(Checkbutton)
		.setChecked(authedAtStart)
		.style("account-view-oauth-service")
		.ariaRole("button")
		.style.bind(isAuthed, "account-view-oauth-service--authenticated")
		.style.setVariable("colour", `#${service.colour.toString(16)}`)
		.append(Component("img")
			.style("account-view-oauth-service-icon")
			.attributes.set("src", service.icon))
		.append(Component()
			.style("account-view-oauth-service-name")
			.text.set(service.name))

	Component()
		.style("account-view-oauth-service-state")
		.style.bind(isAuthed, "account-view-oauth-service-state--authenticated")
		.style.bind(button.hoveredOrFocused, "account-view-oauth-service-state--focus")
		.appendTo(Component()
			.style("account-view-oauth-service-state-wrapper")
			.style.bind(button.hoveredOrFocused, "account-view-oauth-service-state-wrapper--focus")
			.appendTo(button))

	const username = Component()
		.style("account-view-oauth-service-username")
		.style.bind(isAuthed, "account-view-oauth-service-username--has-username")
		.ariaHidden()
		.appendTo(button)

	authorisationState.use(button, authorisation => {
		button.ariaLabel.use(quilt => quilt[`view/account/auth/service/accessibility/${authorisation ? "disconnect" : "connect"}`](service.name, authorisation?.display_name))
		username.text.set(authorisation?.display_name ?? "")
	})

	button.event.subscribe("click", async event => {
		event.preventDefault()

		let auth = Session.Auth.get(service.name)
		if (auth)
			await Session.Auth.unauth(auth.id)
		else
			await Session.Auth.auth(service)

		auth = Session.Auth.get(service.name)
		event.component.setChecked(!!auth)
	})

	return button
})
