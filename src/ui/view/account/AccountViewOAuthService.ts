import type { AuthService } from "api.fluff4.me"
import Component from "ui/Component"
import Checkbox from "ui/component/Checkbox"

export default Component.Builder((service: AuthService, component: Component = Checkbox()) => component
	.style("account-view-oauth-service")
	.style.var("colour", `#${service.colour.toString(16)}`)
	.append(Component("img")
		.style("account-view-oauth-service-icon")
		.attributes.set("src", service.icon))
	.append(Component()
		.style("account-view-oauth-service-name")
		.text.set(service.name))
)
