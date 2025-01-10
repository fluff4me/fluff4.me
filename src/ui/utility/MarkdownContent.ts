import Component from 'ui/Component'
import Markdown from 'utility/string/Markdown'

interface MarkdownContentExtensions {
	setMarkdownContent (markdown: string): this
}

declare module 'ui/Component' {

	interface ComponentExtensions extends MarkdownContentExtensions { }
}

type MarkdownContentHandler = (element: HTMLElement) => unknown
const handlers: MarkdownContentHandler[] = []

Component.extend(component => component.extend<MarkdownContentExtensions>(component => ({
	setMarkdownContent (markdown) {
		component.classes.add('markdown')
		component.element.innerHTML = Markdown.render(markdown)
		for (const node of [...component.element.querySelectorAll('*')])
			for (const handler of handlers)
				handler(node as HTMLElement)
		return component
	},
})))

namespace MarkdownContent {
	export function handle (handler: MarkdownContentHandler) {
		handlers.push(handler)
	}
}

export default MarkdownContent
