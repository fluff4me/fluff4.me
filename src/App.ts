import UiEventBus from "ui/UiEventBus"
import AccountView from "ui/view/AccountView"
import DebugView from "ui/view/DebugView"
import ViewContainer from "ui/ViewContainer"
import Env from "utility/Env"
import Session from "utility/Session"
import URL from "utility/URL"

interface App {
	view: ViewContainer
}

async function App (): Promise<App> {

	if (location.pathname.startsWith("/auth/")) {
		if (location.pathname.endsWith("/error")) {
			const params = new URLSearchParams(location.search)
			// eslint-disable-next-line no-debugger
			debugger
			localStorage.setItem("Popup-Error-Code", params.get("code") ?? "500")
			localStorage.setItem("Popup-Error-Message", params.get("message") ?? "Internal Server Error")
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

	const view = ViewContainer()
		.appendTo(document.body)

	const app: App = {
		view,
	}

	await app.view.show(URL.path === "debug" ? DebugView : AccountView)

	Object.assign(window, { app })
	return app
}

export default App
