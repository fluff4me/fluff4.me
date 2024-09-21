import type { AuthService } from "api.fluff4.me"
import Component from "ui/Component"
import Button from "ui/component/Button"

export enum AccountViewOAuthServiceClasses {
	Main = "account-view-oauth-service",
	_Authenticated = "account-view-oauth-service--authenticated",
	Icon = "account-view-oauth-service-icon",
	Name = "account-view-oauth-service-name",
}

export default Component.Builder((service: AuthService, component: Component = Button()) => component
	.classes.add(AccountViewOAuthServiceClasses.Main)
	.append(Component("img")
		.classes.add(AccountViewOAuthServiceClasses.Icon)
		.attributes.set("src", service.icon))
	.append(Component()
		.classes.add(AccountViewOAuthServiceClasses.Name)
		.text.set(service.name))
)
