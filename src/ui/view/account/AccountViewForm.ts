import Component from "ui/Component"
import Block from "ui/component/Block"
import Form from "ui/component/Form"

type AccountViewFormType =
	| "create"
	| "update"

export default Component.Builder((component, type: AccountViewFormType) => {
	const form = component.and(Block).and(Form)

	form.title.text.use(`view/account/${type}/title`)
	if (type === "create")
		form.description.text.use("view/account/create/description")

	form.submit.textWrapper.text.use(`view/account/${type}/submit`)

	return form
})
