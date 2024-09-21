import type Component from "ui/Component"

interface TextManipulator<HOST> {
	set (text: string): HOST
}

function TextManipulator (component: Component.SettingUp): TextManipulator<Component> {
	const done = component as Component
	return {
		set (text) {
			component.element.textContent = text
			return done
		},
	}
}

export default TextManipulator
