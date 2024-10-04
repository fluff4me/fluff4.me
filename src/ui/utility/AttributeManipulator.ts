import type Component from "ui/Component"

interface AttributeManipulator<HOST> {
	add (...attributes: string[]): HOST
	set (attribute: string, value: string): HOST
	remove (...attributes: string[]): HOST
	toggle (present: boolean, attribute: string, value: string): HOST
}

function AttributeManipulator (component: Component): AttributeManipulator<Component> {
	return {
		add (...attributes) {
			for (const attribute of attributes)
				component.element.setAttribute(attribute, "")
			return component
		},
		set (attribute, value) {
			component.element.setAttribute(attribute, value)
			return component
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
}

export default AttributeManipulator
