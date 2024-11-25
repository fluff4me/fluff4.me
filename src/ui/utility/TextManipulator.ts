import type Component from "ui/Component"
import StringApplicator from "ui/utility/StringApplicator"

interface TextManipulator<HOST> extends StringApplicator.Optional<HOST> {
}

function TextManipulator (component: Component): TextManipulator<Component> {
	return StringApplicator(component, value => {
		component.element.textContent = value ?? null
		return value
	})
}

export default TextManipulator
