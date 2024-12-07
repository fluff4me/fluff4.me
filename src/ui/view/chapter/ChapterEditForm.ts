import type { Chapter } from "api.fluff4.me"
import EndpointChapterCreate from "endpoint/chapter/EndpointChapterCreate"
import EndpointChapterUpdate from "endpoint/chapter/EndpointChapterUpdate"
import type { WorkParams } from "endpoint/work/EndpointWorkGet"
import quilt from "lang/en-nz"
import Session from "model/Session"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Form from "ui/component/core/Form"
import LabelledTable from "ui/component/core/LabelledTable"
import TextEditor from "ui/component/core/TextEditor"
import TextInput from "ui/component/core/TextInput"
import type State from "utility/State"

export default Component.Builder((component, state: State<Chapter | undefined>, workParams: WorkParams) => {
	const block = component.and(Block)
	const form = block.and(Form, block.title)
	form.viewTransition("chapter-edit-form")

	const type = state.value ? "update" : "create"

	form.title.text.use(`view/chapter-edit/${type}/title`)
	form.setName(quilt[`view/chapter-edit/${type}/title`]().toString())
	// if (params.type === "create")
	// 	form.description.text.use("view/work-edit/create/description")

	form.submit.textWrapper.text.use(`view/chapter-edit/${type}/submit`)

	const table = LabelledTable().appendTo(form.content)

	const nameInput = TextInput()
		.setRequired()
		.default.bind(state.map(component, work => work?.name))
		.hint.use("view/chapter-edit/shared/form/name/hint")
	table.label(label => label.text.use("view/chapter-edit/shared/form/name/label"))
		.content((content, label) => content.append(nameInput.setLabel(label)))

	const bodyInput = TextEditor()
		.default.bind(state.map(component, chapter => chapter?.body ?? undefined))
		.hint.use("view/chapter-edit/shared/form/body/hint")
	table.label(label => label.text.use("view/chapter-edit/shared/form/body/label"))
		.content((content, label) => content.append(bodyInput.setLabel(label)))

	form.event.subscribe("submit", async event => {
		event.preventDefault()

		const response = await (() => {
			switch (type) {
				case "create":
					return EndpointChapterCreate.query({
						params: workParams,
						body: {
							name: nameInput.value,
							body: bodyInput.useMarkdown(),
							visibility: "Private",
						},
					})

				case "update": {
					if (!state.value)
						return

					const authorVanity = Session.Auth.author.value?.vanity
					if (!authorVanity)
						return new Error("Cannot update a work when not signed in")

					return EndpointChapterUpdate.query({
						params: {
							...workParams,
							url: state.value.url,
						},
						body: {
							name: nameInput.value,
							body: bodyInput.useMarkdown(),
							visibility: "Private",
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
})
