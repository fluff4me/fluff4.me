import type { RoutePath } from "navigation/Routes"
import Component from "ui/Component"
import Env from "utility/Env"

interface LinkExtensions {

}

interface Link extends Component, LinkExtensions { }

const Link = Component.Builder("a", (component, route: RoutePath | undefined) => {
	component.style("link")

	if (route !== undefined) {
		component.attributes.set("href", `${Env.URL_ORIGIN}${route.slice(1)}`)

		component.event.subscribe("click", event => {
			event.preventDefault()
			void navigate.toURL(route)
		})
	}

	return component
})

export default Link
