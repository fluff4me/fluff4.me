import type { AuthService } from "api.fluff4.me"
import Session from "model/Session"
import Component from "ui/Component"
import Checkbutton from "ui/component/Checkbutton"

export default Component.Builder((component, service: AuthService) => {
	const authedAtStart = !!Session.Auth.get(service.name)

	const button = component
		.and(Checkbutton)
		.setChecked(authedAtStart)
		.style("account-view-oauth-service")
		.style.toggle(authedAtStart, "account-view-oauth-service--authenticated")
		.style.var("colour", `#${service.colour.toString(16)}`)
		.append(Component("img")
			.style("account-view-oauth-service-icon")
			.attributes.set("src", service.icon))
		.append(Component()
			.style("account-view-oauth-service-name")
			.text.set(service.name))
		.append()

	const state = Component()
		.style("account-view-oauth-service-state")
		.style.toggle(authedAtStart, "account-view-oauth-service-state--authenticated")
		.style.bind(button.hoveredOrFocused, "account-view-oauth-service-state--focus")
		.appendTo(button)

	button.event.subscribe("setChecked", (event, checked) => {
		event.component.style.toggle(checked, "account-view-oauth-service--authenticated")
		state.style.toggle(checked, "account-view-oauth-service-state--authenticated")
	})

	button.event.subscribe("click", async event => {
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
