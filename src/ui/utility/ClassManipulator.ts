import type Component from "ui/Component"

interface ClassManipulator<HOST> {
	add (...classes: string[]): HOST
	remove (...classes: string[]): HOST
	toggle (present: boolean, ...classes: string[]): HOST
	copy (component: Component): HOST
	copy (element: HTMLElement): HOST
}

function ClassManipulator (component: Component): ClassManipulator<Component> {
	return {
		add (...classes) {
			component.element.classList.add(...classes)
			return component
		},
		remove (...classes) {
			component.element.classList.remove(...classes)
			return component
		},
		toggle (present, ...classes) {
			return this[present ? "add" : "remove"](...classes)
		},
		copy (element) {
			if ("element" in element)
				element = element.element

			component.element.classList.add(...element.classList)
			return component
		},
	}
}

export default ClassManipulator
