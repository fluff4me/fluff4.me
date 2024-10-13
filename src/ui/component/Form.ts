import Component from "ui/Component"
import Button from "ui/component/Button"

interface FormExtensions {
	content: Component
	footer: Component
	submit: Button
}

interface Form extends Component, FormExtensions { }

const Form = Component.Builder((form, label: Component): Form => {
	form.style("form")
		.ariaRole("form")
		.ariaLabelledBy(label)

	const content = Component()
		.style("form-content")

	const footer = Component()
		.style("form-footer")

	return form
		.append(content, footer)
		.extend<FormExtensions>(() => ({
			content, footer,
			submit: undefined!,
		}))
		.extendJIT("submit", () => Button()
			.style("form-submit")
			.appendTo(footer))
})

export default Form
