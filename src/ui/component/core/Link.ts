import type { RoutePath } from 'navigation/Routes'
import Component from 'ui/Component'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import Env from 'utility/Env'
import State from 'utility/State'

export interface LinkEvents {
	Navigate (): any
}

interface LinkExtensions {
	readonly canNavigate: State<boolean>
	setNavigationDisabled (disabled?: boolean): this
}

interface Link extends Component, LinkExtensions {
	readonly event: EventManipulator<this, Events<Component, LinkEvents>>
}

const Link = Component.Builder('a', (component, route: RoutePath | undefined): Link => {
	component.style('link')

	const canNavigate = State(true)

	const link: Link = component.extend<LinkExtensions>(link => ({
		canNavigate,
		setNavigationDisabled (disabled = true) {
			canNavigate.value = !disabled
			return link
		},
	}))

	if (route !== undefined) {
		link.attributes.set('href', `${Env.URL_ORIGIN}${route.slice(1)}`)

		link.event.subscribe('click', event => {
			event.preventDefault()

			// const closestButtonOrLink = (event.target as Partial<HTMLElement>).component?.closest([Button, Link])
			// if (closestButtonOrLink !== component)
			// 	return

			if (!canNavigate.value)
				return

			event.stopImmediatePropagation()
			void navigate.toURL(route)
			link.event.emit('Navigate')
		})
	}

	return link
})

export default Link
