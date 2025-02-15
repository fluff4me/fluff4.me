import type App from 'App'
import type { RoutePath } from 'navigation/RoutePath'
import Routes from 'navigation/Routes'
import EventManipulator from 'ui/utility/EventManipulator'
import ErrorView from 'ui/view/ErrorView'
import type ViewContainer from 'ui/view/shared/component/ViewContainer'
import Env from 'utility/Env'

declare global {
	export const navigate: Navigator
}

export interface NavigatorEvents {
	Navigate (route: RoutePath | undefined): void
}

interface Navigator {
	event: EventManipulator<this, NavigatorEvents>
	isURL (glob: string): boolean
	fromURL (): Promise<void>
	toURL (route: RoutePath): Promise<void>
	setURL (route: RoutePath): void
	toRawURL (url: string): boolean
	ephemeral: ViewContainer['showEphemeral']
}

function Navigator (): Navigator {
	let lastURL: URL | undefined
	const navigate = {
		event: undefined! as Navigator['event'],
		isURL: (glob: string) => {
			const pattern = glob
				.replace(/(?<=\/)\*(?!\*)/g, '[^/]*')
				.replace(/\/\*\*/g, '.*')
			return new RegExp(`^${pattern}$`).test(location.pathname)
		},
		fromURL: async () => {
			if (location.href === lastURL?.href)
				return

			if (!app)
				throw new Error('Cannot navigate yet, no app instance')

			const oldURL = lastURL
			lastURL = new URL(location.href)

			let matchedRoute: RoutePath | undefined
			let errored = false
			if (location.pathname !== oldURL?.pathname) {
				const url = location.pathname
				let handled = false
				for (const route of Routes) {
					const params = route.match(url)
					if (!params)
						continue

					matchedRoute = route.path

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
					location.hash = ''
					return
				}

				element.scrollIntoView()
				element.focus()
			}

			navigate.event.emit('Navigate', matchedRoute)
		},
		toURL: async (url: string) => {
			navigate.setURL(url)
			return navigate.fromURL()
		},
		setURL: (url: string) => {
			if (url !== location.pathname)
				history.pushState({}, '', `${Env.URL_ORIGIN}${url.slice(1)}`)
		},
		toRawURL: (url: string) => {
			if (url.startsWith('http')) {
				location.href = url
				return true
			}

			if (url.startsWith('/')) {
				void navigate.toURL(url)
				return true
			}

			if (url.startsWith('#')) {
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
		ephemeral: (...args: unknown[]) => {
			if (!app)
				throw new Error('Cannot show ephemeral view yet, no app instance')

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
			return (app.view.showEphemeral as any)(...args)
		},
	}

	navigate.event = EventManipulator(navigate)

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	window.addEventListener('popstate', navigate.fromURL)

	Object.assign(window, { navigate })
	return navigate
}

let app: App | undefined
namespace Navigator {
	export function setApp (instance: App) {
		app = instance
	}
}

export default Navigator
