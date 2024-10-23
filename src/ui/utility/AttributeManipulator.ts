import quilt from "lang/en-nz"
import type Component from "ui/Component"
import { QuiltHelper, type Quilt } from "ui/utility/TextManipulator"

interface AttributeManipulator<HOST> {
	get (attribute: string): string | undefined
	/** Adds the given attributes with no values */
	add (...attributes: string[]): HOST
	/** Sets the attribute to `value`, or removes the attribute if `value` is `undefined` */
	set (attribute: string, value?: string): HOST
	use (attribute: string, keyOrHandler: Quilt.SimpleKey | Quilt.Handler): HOST
	getUsing (attribute: string): Quilt.SimpleKey | Quilt.Handler | undefined
	refresh (): void
	remove (...attributes: string[]): HOST
	toggle (present: boolean, attribute: string, value?: string): HOST
	copy (component: Component): HOST
	copy (element: HTMLElement): HOST
}

function AttributeManipulator (component: Component): AttributeManipulator<Component> {
	let translationHandlers: Record<string, Quilt.SimpleKey | Quilt.Handler> | undefined
	const result: AttributeManipulator<Component> = {
		get (attribute) {
			return component.element.getAttribute(attribute) ?? undefined
		},
		add (...attributes) {
			for (const attribute of attributes) {
				delete translationHandlers?.[attribute]
				component.element.setAttribute(attribute, "")
			}
			return component
		},
		set (attribute, value) {
			delete translationHandlers?.[attribute]
			if (value === undefined)
				component.element.removeAttribute(attribute)
			else
				component.element.setAttribute(attribute, value)
			return component
		},
		getUsing (attribute) {
			return translationHandlers?.[attribute]
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
				const weave = typeof translationHandler === "string" ? quilt[translationHandler]() : translationHandler(quilt, QuiltHelper)
				component.element.setAttribute(attribute, weave.toString())
			}
		},
		remove (...attributes) {
			for (const attribute of attributes) {
				delete translationHandlers?.[attribute]
				component.element.removeAttribute(attribute)
			}
			return component
		},
		toggle (present, attribute, value = "") {
			return this[present ? "set" : "remove"](attribute, value)
		},
		copy (element) {
			if ("element" in element)
				element = element.element

			for (const attribute of element.attributes)
				component.element.setAttribute(attribute.name, attribute.value)

			return component
		},
	}

	return result
}

export default AttributeManipulator
