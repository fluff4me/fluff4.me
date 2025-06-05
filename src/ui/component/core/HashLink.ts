import Component from 'ui/Component'
import MarkdownContent from 'ui/utility/MarkdownContent'

const HashLink = Component.Builder((component): Component => {
	return component
		.style('link', 'link-hash')
})

MarkdownContent.handle((element, context) => {
	if (element.tagName !== 'A')
		return

	const href = element.getAttribute('href')
	if (!href?.startsWith('#'))
		return

	return () => {
		Component().replaceElement(element, true).and(HashLink)
	}
})

export default HashLink
