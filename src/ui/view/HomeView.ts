import Block from "ui/component/core/Block"
import Form from "ui/component/core/Form"
import LabelledTable from "ui/component/core/LabelledTable"
import TextEditor from "ui/component/core/TextEditor"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"

export default ViewDefinition({
	create: () => {
		const view = View("home")

		const block = Block().appendTo(view)
		const form = block.and(Form, block.title)

		const table = LabelledTable().appendTo(form.content)

		table.label(label => label.text.set("test editor"))
			.content((content, label, row) => {
				const editor = TextEditor()
					.setLabel(label)
					.appendTo(content)
				label.event.subscribe("click", () => editor.document?.focus())
			})

		return view
	},
})
