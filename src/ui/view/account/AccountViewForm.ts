import Component from "ui/Component"
import Block from "ui/component/Block"
import Form from "ui/component/Form"

type AccountViewFormType =
	| "create"
	| "update"

export default Component.Builder((component, type: AccountViewFormType) => {
	const block = component.and(Block).and(Form)

	block.title.text.use(`view/account/${type}/title`)
	// block.description.text.use("view/account/create/description")

	Form()
		.appendTo(block)

	return block
})
