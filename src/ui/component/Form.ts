import Component from "ui/Component"

interface FormExtensions {
	content: Component
	footer: Component
}

interface Form extends Component, FormExtensions { }

const Form = Component.Builder((container): Form => {
	container.style("form")

	const content = Component()
		.style("form-content")

	const footer = Component()
		.style("form-footer")

	return container
		.append(content, footer)
		.extend(() => ({ content, footer }))
})

export default Form
