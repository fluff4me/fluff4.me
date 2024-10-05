import Component from "ui/Component"

export enum FormClasses {
	Main = "form",
	Header = "form-header",
	Content = "form-content",
	Footer = "form-footer",
}

interface FormExtensions {
	header: Component
	content: Component
	footer: Component
}

interface Form extends Component, FormExtensions { }

const Form = Component.Builder((container): Form => {
	const header = Component()
		.classes.add(FormClasses.Header)

	const content = Component()
		.classes.add(FormClasses.Content)

	const footer = Component()
		.classes.add(FormClasses.Footer)

	return container
		.classes.add(FormClasses.Main)
		.append(header, content, footer)
		.extend(() => ({ header, content, footer }))
})

export default Form
