import Component from 'ui/Component'
import MarkdownContent from 'ui/utility/MarkdownContent'
import type { ComponentName } from 'ui/utility/StyleManipulator'
import TextManipulator from 'ui/utility/TextManipulator'
import Define from 'utility/Define'
import Maths from 'utility/maths/Maths'
import State from 'utility/State'

interface ComponentHeadingExtensions {
	containsHeading (): boolean
	setContainsHeading (): this
}

declare module 'ui/Component' {
	interface ComponentExtensions extends ComponentHeadingExtensions { }
}

export enum HeadingClasses {
	_ContainsHeading = '_contains-heading',
}

Component.extend(component => component.extend<ComponentHeadingExtensions>(component => ({
	containsHeading: () => component.classes.has(HeadingClasses._ContainsHeading),
	setContainsHeading () {
		component.classes.add(HeadingClasses._ContainsHeading)
		return component
	},
})))

type HeadingStylePrefix = keyof {
	[KEY in ComponentName as (
		KEY extends `${infer PREFIX}-1` ?
		PREFIX | `${PREFIX}-2` | `${PREFIX}-3` | `${PREFIX}-4` | `${PREFIX}-5` | `${PREFIX}-6` extends ComponentName ?
		| PREFIX
		: never : never
	)]: true
}

interface HeadingExtensions {
	updateLevel (): this
	/** Rather than using a heading style based on the actual level of this heading, instead use the style of another heading level */
	setAestheticLevel (level?: HeadingLevel): this
	/** Rather than using the default `heading-#` style, instead use a custom heading style */
	setAestheticStyle (style?: HeadingStylePrefix): this
	setResizeRange (idealLength?: number, maxLength?: number): this
	clearResizeRange (): this
}

interface Heading extends Component, HeadingExtensions { }

const Heading = Component.Builder('h1', (component): Heading => {
	component.style('heading')

	const textWrapper = Component()
		.style('heading-text')
		.appendTo(component)

	Define.set(component, 'text', TextManipulator(component, textWrapper))

	let initial = true
	let aestheticLevel: HeadingLevel | undefined
	let aestheticStyle: HeadingStylePrefix | undefined
	interface ResizeRange {
		minLength: number
		maxLength: number
	}
	const resizeRange = State<ResizeRange | undefined>(undefined)

	State.Map(component, [component.text.state, resizeRange], (...args) => args)
		.use(component, ([text, resizeRange]) => {
			component.setId(text?.toString().toLowerCase().replace(/\W+/g, '-'))

			if (!resizeRange)
				return

			const length = text?.length ?? 0
			const t = 1 - Maths.clamp1(Maths.unlerp(resizeRange.minLength, resizeRange.maxLength, length))
			const size = Maths.lerp(0.5, 1, t)
			textWrapper.style.setProperty('font-size', `${size}em`)
		})

	component.tabIndex('programmatic')

	component.receiveAncestorInsertEvents()
	component.event.subscribe(['insert', 'ancestorInsert'], updateHeadingLevel)
	component.rooted.subscribeManual(updateHeadingLevel)

	return component.extend<HeadingExtensions>(heading => ({
		setAestheticLevel (level) {
			const style = aestheticStyle ?? 'heading'

			const oldLevel = getHeadingLevel(component.element)
			if (isStyledHeadingLevel(oldLevel))
				component.style.remove(`${style}-${oldLevel}`)

			if (aestheticLevel)
				component.style.remove(`${style}-${aestheticLevel}`)

			aestheticLevel = level
			if (isStyledHeadingLevel(aestheticLevel))
				component.style(`${style}-${aestheticLevel}`)

			return heading
		},
		setAestheticStyle (style) {
			const level = aestheticLevel ?? getHeadingLevel(component.element)
			if (isStyledHeadingLevel(level))
				component.style.remove(`${aestheticStyle ?? 'heading'}`, `${aestheticStyle ?? 'heading'}-${level}`)

			aestheticStyle = style
			if (isStyledHeadingLevel(level))
				component.style(`${style ?? 'heading'}`, `${style ?? 'heading'}-${level}`)

			return heading
		},
		updateLevel: () => {
			updateHeadingLevel()
			return heading
		},
		setResizeRange (minLength, maxLength) {
			resizeRange.value = minLength === undefined || maxLength === undefined ? undefined : { minLength, maxLength }
			return heading
		},
		clearResizeRange () {
			resizeRange.value = undefined
			return heading
		},
	}))

	function updateHeadingLevel () {
		const newLevel = computeHeadingLevel(component.element)
		const oldLevel = getHeadingLevel(component.element)

		const isSameLevel = newLevel === oldLevel
		if (isSameLevel && !initial)
			return

		const style = aestheticStyle ?? 'heading'

		initial = false
		if (isStyledHeadingLevel(oldLevel))
			component.style.remove(`${style}-${oldLevel}`)

		const isStyledLevel = isStyledHeadingLevel(newLevel)
		if (!aestheticLevel && isStyledLevel)
			component.style(`${style}-${newLevel}`)

		if (aestheticLevel)
			component.style(`${style}-${aestheticLevel}`)

		if (isSameLevel)
			return

		component.event.unsubscribe(['insert', 'ancestorInsert'], updateHeadingLevel)
		component.replaceElement(isStyledLevel ? `h${newLevel}` : 'span')
		component.attributes.toggle(!isStyledLevel, 'role', 'heading')
		component.attributes.toggle(!isStyledLevel && typeof newLevel === 'number', 'aria-level', `${newLevel}`)
		component.event.subscribe(['insert', 'ancestorInsert'], updateHeadingLevel)
	}
})

////////////////////////////////////
//#region Util

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
function computeHeadingLevel (node?: Node): number | undefined {
	let currentNode = node
	let incrementHeading = false

	while (currentNode) {
		const heading = getPreviousSiblingHeading(currentNode)
		if (heading) {
			const level = getHeadingLevel(heading)
			if (!incrementHeading && level !== 1)
				return level

			if (level === undefined || level > 6)
				return level

			return level + 1
		}

		currentNode = currentNode.parentNode ?? undefined
		incrementHeading ||= true
	}

	return 1
}

function getPreviousSiblingHeading (node?: Node): HTMLElement | undefined {
	let sibling = node

	while (sibling) {
		sibling = sibling.previousSibling ?? undefined
		if (sibling?.nodeType !== Node.ELEMENT_NODE)
			continue

		const siblingElement = sibling as HTMLElement
		if (isHeadingElement(siblingElement))
			return siblingElement

		if (siblingElement.getAttribute('role') === 'heading')
			return siblingElement

		if (siblingElement.tagName === 'HGROUP') {
			const [heading] = siblingElement.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, [role=\'heading\']')
			if (heading)
				return heading
		}

		if (siblingElement.component?.containsHeading()) {
			const [heading] = siblingElement.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, [role=\'heading\']')
			if (heading)
				return heading
		}
	}
}

function isHeadingElement (value: unknown): value is HTMLHeadingElement {
	if (!value || typeof value !== 'object' || !('tagName' in value))
		return false

	const element = value as HTMLElement
	return element.tagName[0] === 'H' && element.tagName.length === 2 && !isNaN(+element.tagName[1])
}

function getHeadingLevel (element: HTMLElement): number | undefined {
	return +element.tagName.slice(1) || +element.getAttribute('aria-level')! || undefined
}

function isStyledHeadingLevel (level: unknown): level is HeadingLevel {
	return typeof level === 'number' && level >= 1 && level <= 6
}

//#endregion
////////////////////////////////////

MarkdownContent.handle(element => {
	if (!isHeadingElement(element))
		return undefined

	return () => {
		const level = getHeadingLevel(element)

		const heading = Heading().setAestheticStyle('markdown-heading')

		Component.removeContents(heading.element)
		heading.element.replaceChildren(...element.childNodes)
		element.replaceWith(heading.element)
		heading.emitInsert()

		if (isStyledHeadingLevel(level))
			heading.setAestheticLevel(level)
	}
})

export default Heading
