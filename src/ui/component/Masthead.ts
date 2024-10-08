import Component from "ui/Component"
import Button from "ui/component/Button"
import Flag from "ui/component/Flag"
import Heading from "ui/component/Heading"
import Link from "ui/component/Link"
import Env from "utility/Env"

interface MastheadExtensions {

}

interface Masthead extends Component, MastheadExtensions { }

const Masthead = Component.Builder("nav", component => {
	component.style("masthead")

	const flag = Flag()
		.style("masthead-home-logo")

	const homeLink = Link("/")
		.append(Heading()
			.and(Button)
			.style("masthead-home")
			.append(flag)
			.append(Component("img")
				.style("masthead-home-logo-wordmark")
				.attributes.set("src", `${Env.URL_ORIGIN}image/logo-wordmark.svg`)
				.attributes.set("alt", "fluff 4 me")))
		.appendTo(component)

	flag.style.bind(homeLink.hoveredOrFocused, "flag--focused")
	flag.style.bind(homeLink.active, "flag--active")
	homeLink.hoveredOrFocused.subscribe(component, focus => flag.wave("home link focus", focus))

	return component.extend<MastheadExtensions>(masthead => ({}))
})

export default Masthead
