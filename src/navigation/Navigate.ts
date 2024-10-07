import type App from "App"
import Routes from "navigation/Routes"
import ErrorView from "ui/view/ErrorView"

interface Navigator {
	fromURL (): Promise<void>
}

function Navigator (app: App): Navigator {
	return {
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
	}
}

export default Navigator
