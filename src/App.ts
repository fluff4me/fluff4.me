import quilt from "lang/en-nz"
import Session from "model/Session"
import Navigator from "navigation/Navigate"
import style from "style"
import Component from "ui/Component"
import Masthead from "ui/component/Masthead"
import InputBus from "ui/InputBus"
import FocusListener from "ui/utility/FocusListener"
import HoverListener from "ui/utility/HoverListener"
import Mouse from "ui/utility/Mouse"
import Viewport from "ui/utility/Viewport"
import ViewContainer from "ui/view/shared/component/ViewContainer"
import Async from "utility/Async"
import Env from "utility/Env"
import Store from "utility/Store"
import Time from "utility/Time"

interface AppExtensions {
	navigate: Navigator
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

	InputBus.subscribe("down", event => {
		if (event.use("F6"))
			for (const stylesheet of document.querySelectorAll("link[rel=stylesheet]")) {
				const href = stylesheet.getAttribute("href")!
				const newHref = `${href.slice(0, Math.max(0, href.indexOf("?")) || Infinity)}?${Math.random().toString().slice(2)}`
				stylesheet.setAttribute("href", newHref)
			}

		if (event.use("F4"))
			document.documentElement.classList.add("persist-tooltips")
	})
	InputBus.subscribe("up", event => {
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

	await Promise.race([
		Session.refresh(),
		Async.sleep(Time.seconds(2)),
	])

	HoverListener.listen()
	FocusListener.listen()
	Mouse.listen()
	Viewport.listen()

	document.title = quilt["fluff4me/title"]().toString()

	document.body.classList.add(...style.body)

	const view = ViewContainer()
	const masthead = Masthead(view)

	const related = Component()
		.style("app-content-related")

	const content = Component()
		.style("app-content")
		.append(view, related)

	const app: App = Component()
		.style("app")
		.append(masthead, masthead.sidebar, content)
		.extend<AppExtensions>(app => ({
			navigate: Navigator(app),
			view,
		}))
		.appendTo(document.body)

	await app.navigate.fromURL()

	Object.assign(window, { app })
	return app
}

export default App
