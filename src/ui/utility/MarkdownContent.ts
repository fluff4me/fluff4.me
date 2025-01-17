import Component from 'ui/Component'
import Markdown from 'utility/string/Markdown'

interface MarkdownContentExtensions {
	setMarkdownContent (markdown: string, maxLength?: number): this
}

declare module 'ui/Component' {

	interface ComponentExtensions extends MarkdownContentExtensions { }
}

type MarkdownContentHandler = (element: HTMLElement) => unknown
const handlers: MarkdownContentHandler[] = []

type TagNameUppercase = Uppercase<keyof HTMLElementTagNameMap>
const ELEMENT_TYPES_TO_SIMPLIFY_INTO_SPAN = Object.entries({
	SPAN: [
		'DIV',
		'P',
		'UL', 'OL', 'LI',
	],
	STRONG: [
		'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
	],
	EM: [
		'BLOCKQUOTE',
	],
	CODE: [
		'PRE',
	],
} as Record<TagNameUppercase, TagNameUppercase[]>)
	.flatMap(([toTag, fromTags]) => fromTags
		.map(fromTag => [fromTag, toTag] as const))
	.toObject()

const ELEMENT_TYPES_TO_SIMPLIFY_BY_REMOVAL = new Set<TagNameUppercase>([
	'IMG',
	'HR',
	'BR',
	'TABLE',
])

Component.extend(component => component.extend<MarkdownContentExtensions>(component => ({
	setMarkdownContent (markdown, maxLength) {
		console.log(maxLength)
		component.classes.add('markdown')
		component.element.innerHTML = Markdown.render(markdown)

		if (maxLength)
			simplifyTree(component.element, maxLength)

		const walker = document.createTreeWalker(component.element, NodeFilter.SHOW_ELEMENT)
		while (walker.nextNode())
			for (const handler of handlers)
				handler(walker.currentNode as HTMLElement)

		return component
	},
})))

function simplifyTree (root: HTMLElement, maxLength: number) {
	let length = 0
	let clipped = false
	const nodesToRemove: Node[] = []
	const elementsToReplace: HTMLElement[] = []
	let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
	while (walker.nextNode()) {
		const node = walker.currentNode as (HTMLElement | Text) & Partial<HTMLElement> & Partial<Text>
		const tagName = node.tagName as TagNameUppercase
		if (ELEMENT_TYPES_TO_SIMPLIFY_BY_REMOVAL.has(tagName)) {
			nodesToRemove.push(node)
			continue
		}

		if (length >= maxLength) {
			nodesToRemove.push(node)
			clipped = true
			continue
		}

		if (node.nodeType === Node.TEXT_NODE) {
			const nodeLength = node.textContent?.length ?? 0
			length += nodeLength
			const clipLength = Math.max(0, length - maxLength)
			if (clipLength) {
				clipped = true
				node.textContent = node.textContent?.slice(0, nodeLength - clipLength) ?? null
				length = maxLength
			}
		}

		const replacementTagName = ELEMENT_TYPES_TO_SIMPLIFY_INTO_SPAN[tagName]
		if (replacementTagName)
			elementsToReplace.push(node as HTMLElement)
	}

	for (let i = nodesToRemove.length - 1; i >= 0; i--)
		nodesToRemove[i].parentNode?.removeChild(nodesToRemove[i])

	for (let i = elementsToReplace.length - 1; i >= 0; i--) {
		const element = elementsToReplace[i]
		const replacementTagName = ELEMENT_TYPES_TO_SIMPLIFY_INTO_SPAN[element.tagName as TagNameUppercase]
		const replacementTag = document.createElement(replacementTagName)
		replacementTag.replaceChildren(...element.childNodes)
		element.replaceWith(replacementTag)
	}

	const elementsToStrip: HTMLElement[] = []

	walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
	while (walker.nextNode()) {
		const element = walker.currentNode as HTMLElement
		if (element.tagName === 'SPAN')
			continue

		if (element.parentElement?.closest(element.tagName))
			elementsToStrip.push(element)
	}

	for (let i = elementsToStrip.length - 1; i >= 0; i--)
		elementsToStrip[i].replaceWith(...elementsToStrip[i].childNodes)

	if (clipped)
		root.append('…')
}

namespace MarkdownContent {
	export function handle (handler: MarkdownContentHandler) {
		handlers.push(handler)
	}
}

export default MarkdownContent
