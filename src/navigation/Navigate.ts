import type App from "App"
import type { RoutePath } from "navigation/Routes"
import Routes from "navigation/Routes"
import ErrorView from "ui/view/ErrorView"
import Env from "utility/Env"

declare global {
	export const navigate: Navigator
}

interface Navigator {
	fromURL (): Promise<void>
	toURL (route: RoutePath): Promise<void>
}

function Navigator (app: App): Navigator {
	const navigate = {
		fromURL: async () => {
			const url = document.location.pathname
			for (const route of Routes) {
				const params = route.match(url)
				if (!params)
					continue

				await route.handler(app, params)
				return
			}

			await app.view.show(ErrorView, { code: 404 })
		},
		toURL: async (url: string) => {
			if (url !== document.location.pathname)
				history.pushState({}, "", `${Env.URL_ORIGIN}${url.slice(1)}`)

			return navigate.fromURL()
		},
	}

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	window.addEventListener("popstate", navigate.fromURL)

	Object.assign(window, { navigate })

	return navigate
}

export default Navigator
