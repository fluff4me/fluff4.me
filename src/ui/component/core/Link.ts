import type { RoutePath } from 'navigation/Routes'
import Component from 'ui/Component'
import Env from 'utility/Env'
import State from 'utility/State'

interface LinkExtensions {
	readonly canNavigate: State<boolean>
	setNavigationDisabled (disabled?: boolean): this
}

interface Link extends Component, LinkExtensions { }

const Link = Component.Builder('a', (component, route: RoutePath | undefined): Link => {
	component.style('link')

	const canNavigate = State(true)

	if (route !== undefined) {
		component.attributes.set('href', `${Env.URL_ORIGIN}${route.slice(1)}`)

		component.event.subscribe('click', event => {
			event.preventDefault()

			// const closestButtonOrLink = (event.target as Partial<HTMLElement>).component?.closest([Button, Link])
			// if (closestButtonOrLink !== component)
			// 	return

			if (!canNavigate.value)
				return

			event.stopImmediatePropagation()
			void navigate.toURL(route)
		})
	}

	return component.extend<LinkExtensions>(component => ({
		canNavigate,
		setNavigationDisabled (disabled = true) {
			canNavigate.value = !disabled
			return component
		},
	}))
})

export default Link
