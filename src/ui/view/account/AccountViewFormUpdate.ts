import Component from "ui/Component"
import Block from "ui/component/Block"
import Form from "ui/component/Form"

export default Component.Builder(component => {
	const block = component.and(Block).and(Form)

	block.title.text.use("view/account/update/title")
	// block.description.text.use("view/account/update/description")

	Form()
		.appendTo(block)

	return block
})
