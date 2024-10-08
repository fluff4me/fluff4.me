import Session from "model/Session"
import Navigator from "navigation/Navigate"
import style from "style"
import Component from "ui/Component"
import Link from "ui/component/Link"
import Masthead from "ui/component/Masthead"
import Sidebar from "ui/component/Sidebar"
import UiEventBus from "ui/UiEventBus"
import FocusListener from "ui/utility/FocusListener"
import HoverListener from "ui/utility/HoverListener"
import ViewContainer from "ui/ViewContainer"
import Env from "utility/Env"
import Store from "utility/Store"

interface AppExtensions {
	navigate: Navigator
	sidebar: Sidebar
	view: ViewContainer
}

interface App extends Component, AppExtensions { }

async function App (): Promise<App> {

	if (location.pathname.startsWith("/auth/")) {
		if (location.pathname.endsWith("/error")) {
			const params = new URLSearchParams(location.search)
			// eslint-disable-next-line no-debugger
			debugger
			Store.items.popupError = {
				code: +(params.get("code") ?? "500"),
				message: params.get("message") ?? "Internal Server Error",
			}
		}
		window.close()
	}

	await screen?.orientation?.lock?.("portrait-primary").catch(() => { })

	UiEventBus.subscribe("keydown", event => {
		if (event.use("F6"))
			for (const stylesheet of document.querySelectorAll("link[rel=stylesheet]")) {
				const href = stylesheet.getAttribute("href")!
				const newHref = `${href.slice(0, Math.max(0, href.indexOf("?")) || Infinity)}?${Math.random().toString().slice(2)}`
				stylesheet.setAttribute("href", newHref)
			}

		if (event.use("F4"))
			document.documentElement.classList.add("persist-tooltips")
	})
	UiEventBus.subscribe("keyup", event => {
		if (event.use("F4"))
			document.documentElement.classList.remove("persist-tooltips")
	})

	await Env.load()

	// const path = URL.path ?? URL.hash;
	// if (path === AuthView.id) {
	// 	URL.hash = null;
	// 	URL.path = null;
	// }

	// ViewManager.showByHash(URL.path ?? URL.hash);

	await Session.refresh()

	HoverListener.listen()
	FocusListener.listen()

	document.body.classList.add(...style.body)

	const masthead = Masthead()
	const sidebar = Sidebar()
	const view = ViewContainer()

	const app: App = Component()
		.style("app")
		.append(masthead, sidebar, view)
		.extend<AppExtensions>(app => ({
			masthead, sidebar, view,
			navigate: Navigator(app),
		}))
		.appendTo(document.body)

	Link.setNavigator(app.navigate)

	await app.navigate.fromURL()

	Object.assign(window, { app })
	return app
}

export default App
