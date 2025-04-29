interface PopupRoute {
	route: string | RegExp
	handler (match: RegExpMatchArray): void
}

function PopupRoute (route: PopupRoute['route'], handler: PopupRoute['handler']): PopupRoute {
	return { route, handler }
}

namespace PopupRoute {
	export function is (route: PopupRoute | PopupRoute[]): route is PopupRoute {
		return 'route' in route && 'handler' in route
	}

	export function match (route: PopupRoute['route'], pathname: string): RegExpMatchArray | undefined {
		if (typeof route === 'string')
			return route === pathname ? [pathname] : undefined

		return pathname.match(route) ?? undefined
	}

	export function collect (...routes: (PopupRoute | PopupRoute[])[]): PopupRoute[] {
		return routes.reduce<PopupRoute[]>((acc, route) => {
			if (PopupRoute.is(route)) {
				acc.push(route)
				return acc
			}

			return [...acc, ...route]
		}, [])
	}

}

export default PopupRoute
