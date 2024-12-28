import type Component from "ui/Component"
import StringApplicator from "ui/utility/StringApplicator"

interface TextManipulator<HOST> extends StringApplicator.Optional<HOST> {
	prepend (text: string): HOST
	append (text: string): HOST
}

function TextManipulator (component: Component): TextManipulator<Component> {
	return Object.assign(
		StringApplicator(component, value => {
			component.element.textContent = value ?? null
			return value
		}),
		{
			prepend (text: string) {
				component.element.prepend(document.createTextNode(text))
				return component
			},
			append (text: string) {
				component.element.append(document.createTextNode(text))
				return component
			},
		}
	)
}

export default TextManipulator
