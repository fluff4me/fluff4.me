import { RoutePath } from 'navigation/RoutePath'
import Component from 'ui/Component'
import { HandlesMouseEvents } from 'ui/InputBus'
import MarkdownContent from 'ui/utility/MarkdownContent'
import Env from 'utility/Env'

interface ExternalLinkExtensions {

}

interface ExternalLink extends Component, ExternalLinkExtensions { }

const ExternalLink = Component.Builder('a', (component, href: string | undefined) => {
	component
		.and(HandlesMouseEvents)
		.style('link', 'link-external')
		.style.bind(component.attributes.get('href').mapManual(href => !!href), 'link-external--has')

	if (href !== undefined)
		component.attributes.set('href', href)

	return component
})

MarkdownContent.handle((element, context) => {
	if (element.tagName !== 'A')
		return

	let href = element.getAttribute('href')

	if (href?.startsWith(Env.URL_ORIGIN))
		href = href.slice(Env.URL_ORIGIN.length - 1)

	if (!href || RoutePath.is(href))
		return

	return () => {
		const link = ExternalLink(href).text.set(element.textContent ?? '')
		element.replaceWith(link.element)
	}
})

export default ExternalLink
