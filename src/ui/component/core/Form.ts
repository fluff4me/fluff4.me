import Component from "ui/Component"
import ActionRow from "ui/component/core/ActionRow"
import Button from "ui/component/core/Button"

interface FormExtensions {
	content: Component
	footer: ActionRow
	submit: Button
}

interface Form extends Component, FormExtensions { }

const Form = Component.Builder((form, label: Component): Form => {
	form.replaceElement("form")
		.style("form")
		.ariaRole("form")
		.ariaLabelledBy(label)

	const content = Component()
		.style("form-content")

	const footer = ActionRow()
		.style("form-footer")

	return form
		.append(content, footer)
		.extend<FormExtensions>(() => ({
			content, footer,
			submit: undefined!,
		}))
		.extendJIT("submit", () => Button()
			.type("primary")
			.attributes.set("type", "submit")
			.appendTo(footer.right))
})

export default Form
