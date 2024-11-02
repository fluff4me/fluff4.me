import EndpointAuthorCreate from "endpoint/author/EndpointAuthorCreate"
import EndpointAuthorUpdate from "endpoint/author/EndpointAuthorUpdate"
import quilt from "lang/en-nz"
import Session from "model/Session"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Form from "ui/component/core/Form"
import LabelledTable from "ui/component/core/LabelledTable"
import TextEditor from "ui/component/core/TextEditor"
import TextInput from "ui/component/core/TextInput"

type AccountViewFormType =
	| "create"
	| "update"

export default Component.Builder((component, type: AccountViewFormType) => {
	const block = component.and(Block)
	const form = block.and(Form, block.title)

	form.title.text.use(`view/account/${type}/title`)
	form.setName(quilt[`view/account/${type}/title`]().toString())
	if (type === "create")
		form.description.text.use("view/account/create/description")

	form.submit.textWrapper.text.use(`view/account/${type}/submit`)

	const table = LabelledTable().appendTo(form.content)

	const nameInput = TextInput()
		.setRequired()
		.default.bind(Session.Auth.author.map(component, author => author?.name))
	table.label(label => label.text.use("view/account/form/name/label"))
		.content((content, label) => content.append(nameInput.setLabel(label)))

	const vanityInput = TextInput()
		.placeholder.bind(nameInput.state
			.map(component, name => filterVanity(name)))
		.default.bind(Session.Auth.author.map(component, author => author?.vanity))
		.filter(filterVanity)
	table.label(label => label.text.use("view/account/form/vanity/label"))
		.content((content, label) => content.append(vanityInput.setLabel(label)))

	const descriptionInput = TextEditor()
		.default.bind(Session.Auth.author.map(component, author => author?.description.body))
	table.label(label => label.text.use("view/account/form/description/label"))
		.content((content, label) => content.append(descriptionInput.setLabel(label)))

	form.event.subscribe("submit", async event => {
		event.preventDefault()

		const response = await (type === "create" ? EndpointAuthorCreate : EndpointAuthorUpdate).query({
			body: {
				name: nameInput.value,
				vanity: vanityInput.value,
				description: descriptionInput.useMarkdown(),
			},
		})

		if (response instanceof Error) {
			console.error(response)
			return
		}

		Session.setAuthor(response.data)
	})

	return form

	function filterVanity (vanity: string, textBefore = "", isFullText = true) {
		vanity = vanity.replace(/[\W_]+/g, "-")
		if (isFullText)
			vanity = vanity.replace(/^-|-$/g, "")

		if (textBefore.endsWith("-") && vanity.startsWith("-"))
			return vanity.slice(1)

		return vanity
	}
})
