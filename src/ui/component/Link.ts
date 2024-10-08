import type Navigator from "navigation/Navigate"
import type { RoutePath } from "navigation/Routes"
import Component from "ui/Component"
import Env from "utility/Env"

interface LinkExtensions {

}

interface Link extends Component, LinkExtensions { }

let navigate: Navigator
const Link = Object.assign(Component.Builder("a", (component, route: RoutePath) => {
	component.style("link")

	component.attributes.set("href", `${Env.URL_ORIGIN}${route.slice(1)}`)

	component.event.subscribe("click", event => {
		event.preventDefault()
		void navigate.toURL(route)
	})

	return component
}), {
	setNavigator (_navigate: Navigator) {
		navigate = _navigate
	},
})

export default Link
