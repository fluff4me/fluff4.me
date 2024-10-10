import quilt from "lang/en-nz"
import type Component from "ui/Component"
import type { QuiltHandler, SimpleQuiltKey } from "ui/utility/TextManipulator"

interface AttributeManipulator<HOST> {
	add (...attributes: string[]): HOST
	set (attribute: string, value: string): HOST
	use (attribute: string, keyOrHandler: SimpleQuiltKey | QuiltHandler): HOST
	refresh (): void
	remove (...attributes: string[]): HOST
	toggle (present: boolean, attribute: string, value: string): HOST
}

function AttributeManipulator (component: Component): AttributeManipulator<Component> {
	let translationHandlers: Record<string, SimpleQuiltKey | QuiltHandler> | undefined
	const result: AttributeManipulator<Component> = {
		add (...attributes) {
			for (const attribute of attributes)
				component.element.setAttribute(attribute, "")
			return component
		},
		set (attribute, value) {
			component.element.setAttribute(attribute, value)
			return component
		},
		use (attribute, handler) {
			translationHandlers ??= {}
			translationHandlers[attribute] = handler
			result.refresh()
			return component
		},
		refresh () {
			if (!translationHandlers)
				return

			for (const attribute in translationHandlers) {
				const translationHandler = translationHandlers[attribute]
				const weave = typeof translationHandler === "string" ? quilt[translationHandler]() : translationHandler(quilt)
				component.element.setAttribute(attribute, weave.toString())
			}
		},
		remove (...attributes) {
			for (const attribute of attributes)
				component.element.removeAttribute(attribute)
			return component
		},
		toggle (present, attribute, value) {
			return this[present ? "set" : "remove"](attribute, value)
		},
	}

	return result
}

export default AttributeManipulator
