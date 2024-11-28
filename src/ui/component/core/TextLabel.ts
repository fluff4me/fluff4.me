import Component from "ui/Component"

interface TextLabelExtensions {
	readonly label: Component
	readonly content: Component
}

interface TextLabel extends Component, TextLabelExtensions { }

const TextLabel = Component.Builder((component): TextLabel => {
	component.style("text-label")

	const label = Component()
		.style("text-label-label")

	const punctuation = Component()
		.style("text-label-punctuation")
		.text.set(": ")

	const content = Component()
		.style("text-label-content")

	return component
		.append(label, punctuation, content)
		.extend<TextLabelExtensions>(() => ({
			label, content,
		}))
})

export default TextLabel
