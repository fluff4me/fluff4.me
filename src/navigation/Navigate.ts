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
	toRawURL (url: string): boolean
	logIn (): Promise<void>
}

function Navigator (app: App): Navigator {
	let lastURL: URL | undefined
	const navigate = {
		fromURL: async () => {
			if (location.href === lastURL?.href)
				return

			const oldURL = lastURL
			lastURL = new URL(location.href)

			let errored = false
			if (location.pathname !== oldURL?.pathname) {
				const url = location.pathname
				let handled = false
				for (const route of Routes) {
					const params = route.match(url)
					if (!params)
						continue

					await route.handler(app, (!Object.keys(params).length ? undefined : params) as never)
					handled = true
					break
				}

				if (!handled) {
					errored = true
					await app.view.show(ErrorView, { code: 404 })
				}
			}

			if (location.hash && !errored) {
				const id = location.hash.slice(1)
				const element = document.getElementById(id)
				if (!element) {
					console.error(`No element by ID: "${id}"`)
					location.hash = ""
					return
				}

				element.scrollIntoView()
				element.focus()
			}
		},
		toURL: async (url: string) => {
			if (url !== location.pathname)
				history.pushState({}, "", `${Env.URL_ORIGIN}${url.slice(1)}`)

			return navigate.fromURL()
		},
		toRawURL: (url: string) => {
			if (url.startsWith("http")) {
				location.href = url
				return true
			}

			if (url.startsWith("/")) {
				void navigate.toURL(url)
				return true
			}

			if (url.startsWith("#")) {
				const id = url.slice(1)
				const element = document.getElementById(id)
				if (!element) {
					console.error(`No element by ID: "${id}"`)
					return false
				}

				location.hash = url
				return true
			}

			console.error(`Unsupported raw URL to navigate to: "${url}"`)
			return false
		},
		logIn: () => app.logIn(),
	}

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	window.addEventListener("popstate", navigate.fromURL)

	Object.assign(window, { navigate })

	return navigate
}

export default Navigator
