import Component from "ui/Component"
import Button from "ui/component/Button"
import Heading from "ui/component/Heading"
import Link from "ui/component/Link"
import Flag from "ui/component/masthead/Flag"
import type Sidebar from "ui/component/Sidebar"
import type ViewContainer from "ui/ViewContainer"
import Env from "utility/Env"

interface MastheadExtensions {

}

interface Masthead extends Component, MastheadExtensions { }

const Masthead = Component.Builder("nav", (masthead, sidebar: Sidebar, view: ViewContainer) => {
	masthead.style("masthead")

	Button()
		.style("masthead-skip-nav")
		.text.use("masthead/skip-navigation")
		.event.subscribe("click", view.focus)
		.appendTo(masthead)

	const left = Component()
		.append(Button()
			.style("masthead-left-hamburger")
			.tabIndex("programmatic")
			.ariaHidden()
			.event.subscribe("click", sidebar.toggle))
		.style("masthead-left")
		.appendTo(masthead)

	sidebar.style.bind(masthead.hasFocused, "sidebar--visible-due-to-keyboard-navigation")

	const flag = Flag()
		.style("masthead-home-logo")

	const homeLink = Link("/")
		.ariaLabel("fluff4me/alt")
		.append(Heading()
			.and(Button)
			.style("masthead-home")
			.append(flag)
			.append(Component("img")
				.style("masthead-home-logo-wordmark")
				.attributes.set("src", `${Env.URL_ORIGIN}image/logo-wordmark.svg`)))
		.appendTo(left)

	flag.style.bind(homeLink.hoveredOrFocused, "flag--focused")
	flag.style.bind(homeLink.active, "flag--active")
	homeLink.hoveredOrFocused.subscribe(masthead, focus => flag.wave("home link focus", focus))

	Component()
		.style("masthead-search")
		.appendTo(masthead)

	Component()
		.style("masthead-user")
		.append(Button()
			.style("masthead-user-notifications")
			.ariaLabel("masthead/user/notifications/alt"))
		.append(Button()
			.style("masthead-user-profile")
			.ariaLabel("masthead/user/profile/alt"))
		.appendTo(masthead)

	return masthead.extend<MastheadExtensions>(masthead => ({}))
})

export default Masthead
