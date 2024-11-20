import type { WorkFull } from "api.fluff4.me"
import EndpointWorkCreate from "endpoint/work/EndpointWorkCreate"
import EndpointWorkUpdate from "endpoint/work/EndpointWorkUpdate"
import quilt from "lang/en-nz"
import Session from "model/Session"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Form from "ui/component/core/Form"
import LabelledTable from "ui/component/core/LabelledTable"
import Textarea from "ui/component/core/Textarea"
import TextEditor from "ui/component/core/TextEditor"
import TextInput from "ui/component/core/TextInput"
import type State from "utility/State"

export default Component.Builder((component, state: State<WorkFull | undefined>) => {
	const block = component.and(Block)
	const form = block.and(Form, block.title)
	form.viewTransition("work-edit-form")

	const type = state.value ? "update" : "create"

	form.title.text.use(`view/work-edit/${type}/title`)
	form.setName(quilt[`view/work-edit/${type}/title`]().toString())
	// if (params.type === "create")
	// 	form.description.text.use("view/work-edit/create/description")

	form.submit.textWrapper.text.use(`view/work-edit/${type}/submit`)

	const table = LabelledTable().appendTo(form.content)

	const nameInput = TextInput()
		.setRequired()
		.default.bind(state.map(component, work => work?.name))
	table.label(label => label.text.use("view/work-edit/shared/form/name/label"))
		.content((content, label) => content.append(nameInput.setLabel(label)))

	const vanityInput = TextInput()
		.placeholder.bind(nameInput.state
			.map(component, name => filterVanity(name)))
		.default.bind(state.map(component, work => work?.vanity))
		.filter(filterVanity)
	table.label(label => label.text.use("view/work-edit/shared/form/vanity/label"))
		.content((content, label) => content.append(vanityInput.setLabel(label)))

	const descriptionInput = Textarea()
	table.label(label => label.text.use("view/work-edit/shared/form/description/label"))
		.content((content, label) => content.append(descriptionInput.setLabel(label)))

	const synopsisInput = TextEditor()
		.default.bind(state.map(component, work => work?.synopsis.body))
	table.label(label => label.text.use("view/work-edit/shared/form/synopsis/label"))
		.content((content, label) => content.append(synopsisInput.setLabel(label)))

	form.event.subscribe("submit", async event => {
		event.preventDefault()

		const response = await (() => {
			switch (type) {
				case "create":
					return EndpointWorkCreate.query({
						body: {
							name: nameInput.value,
							vanity: vanityInput.value,
							description: descriptionInput.value,
							synopsis: synopsisInput.useMarkdown(),
						},
					})

				case "update": {
					if (!state.value)
						return

					const authorVanity = Session.Auth.author.value?.vanity
					if (!authorVanity)
						return new Error("Cannot update a work when not signed in")

					return EndpointWorkUpdate.query({
						params: {
							author: authorVanity,
							vanity: state.value.vanity,
						},
						body: {
							name: nameInput.value,
							vanity: vanityInput.value,
							description: synopsisInput.useMarkdown(),
						},
					})
				}
			}
		})()

		if (response instanceof Error) {
			console.error(response)
			return
		}

		state.value = response?.data
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
