import Component from "ui/Component"
import Block from "ui/component/Block"
import Form from "ui/component/Form"
import LabelledTable from "ui/component/LabelledTable"
import TextInput from "ui/component/TextInput"

type AccountViewFormType =
	| "create"
	| "update"

export default Component.Builder((component, type: AccountViewFormType) => {
	const block = component.and(Block)
	const form = block.and(Form, block.title)

	form.title.text.use(`view/account/${type}/title`)
	if (type === "create")
		form.description.text.use("view/account/create/description")

	form.submit.textWrapper.text.use(`view/account/${type}/submit`)

	const table = LabelledTable().appendTo(form.content)

	let nameInput!: TextInput
	table.label(label => label.text.use("view/account/form/name/label"))
		.content((content, label) => content.append(nameInput = TextInput()
			.setLabel(label)
			.setRequired()))

	table.label(label => label.text.use("view/account/form/vanity/label"))
		.content((content, label) => content.append(TextInput()
			.setLabel(label)
			.placeholder.bind(nameInput.state
				.map(name => name.toLowerCase().replace(/\W+/, "-")))))

	table.label(label => label.text.use("view/account/form/description/label"))
		.content((content, label) => content.append(TextInput()
			.setLabel(label)))

	return form
})
