import Component from "ui/Component"

interface HeadingExtensions {
	updateLevel (): this
}

interface Heading extends Component, HeadingExtensions { }

const Heading = Component.Builder("h1", (component) => {
	component.style("heading")

	component.text.state.use(component, text => component.id(text.toString().toLowerCase().replace(/\W+/g, "-")))

	component.tabIndex("programmatic")

	component.receiveAncestorInsertEvents()
	component.event.subscribe(["insert", "ancestorInsert"], updateHeadingLevel)
	component.rooted.subscribeManual(updateHeadingLevel)

	let initial = true

	return component.extend<HeadingExtensions>(heading => ({
		updateLevel: () => {
			updateHeadingLevel()
			return heading
		},
	}))

	function updateHeadingLevel () {
		const headingLevel = computeHeadingLevel(component.element)
		const isSameLevel = component.element.tagName === headingLevel.toUpperCase()
		if (isSameLevel && !initial)
			return

		initial = false
		const oldLevel = getHeadingLevel(component.element.tagName)
		if (oldLevel)
			component.style.remove(`heading-${oldLevel}`)

		const newLevel = getHeadingLevel(headingLevel)
		if (newLevel)
			component.style(`heading-${newLevel}`)

		if (isSameLevel)
			return

		component.event.unsubscribe(["insert", "ancestorInsert"], updateHeadingLevel)
		component.replaceElement(headingLevel)
		component.event.subscribe(["insert", "ancestorInsert"], updateHeadingLevel)
	}
})

function getHeadingLevel (tagName: string) {
	return `${+tagName.slice(1) as HeadingLevel || ""}` as `${HeadingLevel}` | ""
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
type HeadingTagName = `h${HeadingLevel}`
function computeHeadingLevel (node?: Node): HeadingTagName | "span" {
	let currentNode = node
	let incrementHeading = false

	while (currentNode) {
		const heading = getPreviousSiblingHeading(currentNode)
		if (heading) {
			const level = +heading.tagName.slice(1)
			if (!incrementHeading)
				return `h${level}` as HeadingTagName

			if (level >= 6)
				return "span"

			return `h${level + 1}` as HeadingTagName
		}

		currentNode = currentNode.parentNode ?? undefined
		incrementHeading ||= true
	}

	return "h1"
}

function getPreviousSiblingHeading (node?: Node): HTMLHeadingElement | undefined {
	let sibling = node

	while (sibling) {
		sibling = sibling.previousSibling ?? undefined
		if (sibling?.nodeType !== Node.ELEMENT_NODE)
			continue

		const siblingElement = sibling as Element
		if (siblingElement.tagName[0] === "H" && siblingElement.tagName.length === 2 && !isNaN(+siblingElement.tagName[1]))
			return siblingElement as HTMLHeadingElement
	}
}

export default Heading
