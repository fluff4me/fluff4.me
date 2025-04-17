import type { TextBody } from 'api.fluff4.me'
import Component from 'ui/Component'
import Markdown from 'utility/string/Markdown'

interface MarkdownContentExtensions {
	setMarkdownContent (markdown?: TextBody | string | null, maxLength?: number, simplify?: boolean): this
}

declare module 'ui/Component' {

	interface ComponentExtensions extends MarkdownContentExtensions { }
}

type MarkdownContentHandler = (element: HTMLElement, context: MarkdownContext) => (() => unknown) | undefined
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

type MarkdownContext = Omit<TextBody, 'body'>

const MENTION_OPEN_TAG_REGEX = /(?<=<mention[^>]*>)/g
Component.extend(component => component.extend<MarkdownContentExtensions>(component => ({
	setMarkdownContent (markdown, maxLength, simplify) {
		if (!markdown) {
			component.element.innerHTML = ''
			return component
		}

		if (typeof markdown === 'string')
			markdown = { body: markdown }

		component.classes.add('markdown')
		const rendered = Markdown.render(markdown.body)
		component.element.innerHTML = rendered
			.replace(MENTION_OPEN_TAG_REGEX, '</mention>')

		if (maxLength)
			simplifyTree(component.element, maxLength, simplify ?? !!maxLength)

		const queuedChanges: (() => unknown)[] = []
		const walker = document.createTreeWalker(component.element, NodeFilter.SHOW_ELEMENT)
		while (walker.nextNode())
			for (const handler of handlers) {
				const change = handler(walker.currentNode as HTMLElement, markdown)
				if (change)
					queuedChanges.push(change)
			}

		for (const change of queuedChanges)
			change()

		if (component.element.lastElementChild?.tagName.length === 2 && component.element.lastElementChild.tagName[0] === 'H')
			Component('p').appendTo(component)

		return component
	},
})))

function simplifyTree (root: HTMLElement, maxLength: number, simplify: boolean) {
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
		if (replacementTagName && simplify)
			elementsToReplace.push(node as HTMLElement)
	}

	for (let i = nodesToRemove.length - 1; i >= 0; i--)
		nodesToRemove[i].parentNode?.removeChild(nodesToRemove[i])

	if (simplify)
		for (let i = elementsToReplace.length - 1; i >= 0; i--) {
			const element = elementsToReplace[i]
			const replacementTagName = ELEMENT_TYPES_TO_SIMPLIFY_INTO_SPAN[element.tagName as TagNameUppercase]
			const replacementTag = document.createElement(replacementTagName)
			replacementTag.replaceChildren(...element.childNodes)
			element.replaceWith(replacementTag)
		}

	const elementsToStrip: HTMLElement[] = []

	walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
	if (simplify)
		while (walker.nextNode()) {
			const element = walker.currentNode as HTMLElement
			if (element.tagName === 'SPAN')
				continue

			if (element.parentElement?.closest(element.tagName))
				elementsToStrip.push(element)
		}

	for (let i = elementsToStrip.length - 1; i >= 0; i--)
		elementsToStrip[i].replaceWith(...elementsToStrip[i].childNodes)

	if (clipped) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
		let lastTextNode: Text | null = null
		while (walker.nextNode())
			lastTextNode = walker.currentNode as Text

		if (lastTextNode)
			lastTextNode.nodeValue += '…'
		else
			root.append('…')
	}
}

namespace MarkdownContent {
	export function handle (handler: MarkdownContentHandler) {
		handlers.push(handler)
	}

	export function trim (markdown: string) {
		return markdown.trim()
			.replace(/^(?:\s|<br>)+/, '')
			.replace(/(?:\s|<br>)+$/, '')
	}
}

export default MarkdownContent
