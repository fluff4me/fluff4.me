import type Component from "ui/Component"

interface AttributeManipulator<HOST> {
	add (...attributes: string[]): HOST
	set (attribute: string, value: string): HOST
	remove (...attributes: string[]): HOST
	toggle (present: boolean, attribute: string, value: string): HOST
}

function AttributeManipulator (component: Component.SettingUp): AttributeManipulator<Component> {
	const done = component as Component
	return {
		add (...attributes) {
			for (const attribute of attributes)
				component.element.setAttribute(attribute, "")
			return done
		},
		set (attribute, value) {
			component.element.setAttribute(attribute, value)
			return done
		},
		remove (...attributes) {
			for (const attribute of attributes)
				component.element.removeAttribute(attribute)
			return done
		},
		toggle (present, attribute, value) {
			return this[present ? "set" : "remove"](attribute, value)
		},
	}
}

export default AttributeManipulator
