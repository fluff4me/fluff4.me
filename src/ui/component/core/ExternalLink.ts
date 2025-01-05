import Component from 'ui/Component'

interface ExternalLinkExtensions {

}

interface ExternalLink extends Component, ExternalLinkExtensions { }

const ExternalLink = Component.Builder('a', (component, href: string | undefined) => {
	component.style('link', 'link-external')

	if (href !== undefined)
		component.attributes.set('href', href)

	return component
})

export default ExternalLink
