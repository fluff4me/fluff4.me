import type Component from "ui/Component"

interface TextManipulator<HOST> {
	set (text: string): HOST
}

function TextManipulator (component: Component): TextManipulator<Component> {
	return {
		set (text) {
			component.element.textContent = text
			return component
		},
	}
}

export default TextManipulator
