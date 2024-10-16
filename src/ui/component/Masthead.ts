import Session from "model/Session"
import Component from "ui/Component"
import Button from "ui/component/Button"
import Heading from "ui/component/Heading"
import Link from "ui/component/Link"
import Flag from "ui/component/masthead/Flag"
import type Sidebar from "ui/component/Sidebar"
import Slot from "ui/component/Slot"
import type ViewContainer from "ui/ViewContainer"
import Env from "utility/Env"

interface MastheadExtensions {

}

interface Masthead extends Component, MastheadExtensions { }

const Masthead = Component.Builder("header", (masthead, sidebar: Sidebar, view: ViewContainer) => {
	masthead.style("masthead")

	Button()
		.style("masthead-skip-nav")
		.text.use("masthead/skip-navigation")
		.event.subscribe("click", view.focus)
		.appendTo(masthead)

	const left = Component()
		.append(Component()
			.and(Button)
			.style("masthead-left-hamburger")
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
			.ariaLabel("masthead/user/profile/alt")
			.popover("hover", popover => popover
				.anchor.add("aligned right", "off bottom")
				.append(Slot()
					.use(Session.Auth.author, (slot, author) => {
						if (!author) {
							return Button()
								.text.use("masthead/user/profile/popover/login")
								.event.subscribe("click", () => navigate.toURL("/account"))
								.appendTo(slot)
						}

						Button()
							.text.use("masthead/user/profile/popover/profile")
							.event.subscribe("click", () => navigate.toURL(`/author/${author.vanity}`))
							.appendTo(slot)

						Button()
							.text.use("masthead/user/profile/popover/account")
							.event.subscribe("click", () => navigate.toURL("/account"))
							.appendTo(slot)
					}))))
		.appendTo(masthead)

	return masthead.extend<MastheadExtensions>(masthead => ({}))
})

export default Masthead
