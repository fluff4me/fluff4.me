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
		.style.bind(component.attributes.get('href').truthy, 'link-external--has')

	const text = Component()
		.appendTo(component)

	const isMaskedLink = text.text.state.mapManual(text => !!text && text !== href && /^https?:?\/\/?/.test(text))

	component
		.style.bind(isMaskedLink, 'link-external--is-masked')
		.extendJIT('text', component => text.text.rehost(component))

	if (href !== undefined)
		component.attributes.set('href', href)

	Component()
		.style('link-external-real-domain', 'link-external--has')
		.text.bind(component.attributes.get('href').mapManual(href => `[${href}]`))
		.appendToWhen(isMaskedLink, component)

	return component
})

MarkdownContent.handle((element, context) => {
	if (element.tagName !== 'A')
		return

	let href = element.getAttribute('href')

	if (href?.startsWith(Env.URL_ORIGIN))
		href = href.slice(Env.URL_ORIGIN.length - 1)

	if (href?.startsWith('#'))
		return

	if (!href || RoutePath.is(href))
		return

	return () => {
		Component().replaceElement(element, true).and(ExternalLink, href)
	}
})

export default ExternalLink
