import type { TextBody } from 'api.fluff4.me'
import type { Weft } from 'lang/en-nz'
import { WeavingArg } from 'lang/en-nz'
import Component from 'ui/Component'
import { Quilt, QuiltHelper } from 'ui/utility/StringApplicator'
import type { UnsubscribeState } from 'utility/State'
import Markdown from 'utility/string/Markdown'
import MarkdownItHTML from 'utility/string/MarkdownItHTML'

interface MarkdownContentExtensions {
	setMarkdownContent (markdown?: TextBody | string | null, maxLength?: number, simplify?: boolean): this
	useMarkdownContent (markdownHandler: Quilt.SimpleKey | Quilt.Handler): this
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
Component.extend(component => {
	let unuseQuilt: UnsubscribeState | undefined
	component.extend<MarkdownContentExtensions>(component => ({
		setMarkdownContent (markdown, maxLength, simplify) {
			unuseQuilt?.(); unuseQuilt = undefined
			setMarkdownContent(markdown, maxLength, simplify)
			return component
		},
		useMarkdownContent (markdownHandler) {
			unuseQuilt?.()
			unuseQuilt = Quilt.State.use(component, quilt => {
				if (typeof markdownHandler === 'string') {
					const key = markdownHandler
					markdownHandler = quilt => quilt[key]()
				}

				const content = markdownHandler(quilt, QuiltHelper)?.content.map(stringify).join('')
				setMarkdownContent(content)

				function stringify (weft: Weft): string {
					if (!weft.tag) {
						if (Array.isArray(weft.content))
							return weft.content.map(stringify).join('')

						if (typeof weft.content === 'object' && weft.content && !WeavingArg.isRenderable(weft.content))
							return weft.content.content.map(stringify).join('')

						if (typeof weft.content === 'string' || typeof weft.content === 'number')
							return String(weft.content)

						return ''
					}

					return `<weave tag="${weft.tag}">${stringify({ content: weft.content })}</weave>`
				}
			})
			return component
		},
	}))

	function setMarkdownContent (markdown?: TextBody | string | null, maxLength?: number, simplify?: boolean) {
		if (!markdown) {
			component.element.innerHTML = ''
			return
		}

		if (typeof markdown === 'string')
			markdown = { body: markdown }

		component.classes.add('markdown')
		const rendered = Markdown().render(markdown.body)
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

		return
	}
})

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

	export function registerMarkdownWeaveHandler () {
		MarkdownItHTML.defaultOptions.allowedTags.push('weave')
		MarkdownItHTML.defaultOptions.perTagAllowedAttributes.weave = ['tag']

		MarkdownContent.handle((element, context) => {
			if (element.tagName !== 'WEAVE')
				return

			return () => {
				const tag = element.getAttribute('tag')

				let newElement = !tag ? undefined : QuiltHelper.createTagElement(tag)
				newElement ??= document.createElement('span')

				if (element.childNodes.length)
					newElement.replaceChildren(...element.childNodes)

				element.replaceWith(newElement)
			}
		})
	}

}

export default MarkdownContent
