import Session from "model/Session"
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

	const nameInput = TextInput()
	table.label(label => label.text.use("view/account/form/name/label"))
		.content((content, label) => content.append(nameInput
			.setLabel(label)
			.setRequired()
			.default.bind(Session.Auth.author.map(author => author?.name))))

	table.label(label => label.text.use("view/account/form/vanity/label"))
		.content((content, label) => content.append(TextInput()
			.setLabel(label)
			.placeholder.bind(nameInput.state
				.map(name => filterVanity(name)))
			.default.bind(Session.Auth.author.map(author => author?.vanity))
			.filter(filterVanity)))

	table.label(label => label.text.use("view/account/form/description/label"))
		.content((content, label) => content.append(TextInput()
			.setLabel(label)))

	return form

	function filterVanity (vanity: string, textBefore = "", isFullText = true) {
		vanity = vanity.toLowerCase().replace(/[\W_]+/g, "-")
		if (isFullText)
			vanity = vanity.replace(/^-|-$/g, "")

		if (textBefore.endsWith("-") && vanity.startsWith("-"))
			return vanity.slice(1)

		return vanity
	}
})
