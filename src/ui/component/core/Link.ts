import { RoutePath } from 'navigation/RoutePath'
import Component from 'ui/Component'
import { HandlesMouseEvents } from 'ui/InputBus'
import type EventManipulator from 'ui/utility/EventManipulator'
import type { Events } from 'ui/utility/EventManipulator'
import MarkdownContent from 'ui/utility/MarkdownContent'
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
	component
		.and(HandlesMouseEvents)
		.style('link')

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
			if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey || event.button !== 0)
				return

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

MarkdownContent.handle((element, context) => {
	if (element.tagName !== 'A')
		return

	let href = element.getAttribute('href')

	if (href?.startsWith(Env.URL_ORIGIN))
		href = href.slice(Env.URL_ORIGIN.length - 1)

	if (!RoutePath.is(href))
		return

	return () => {
		const link = Link(href).text.set(element.textContent ?? '')
		element.replaceWith(link.element)
	}
})

export default Link
