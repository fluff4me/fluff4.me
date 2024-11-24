import MarkdownIt from "markdown-it"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Form from "ui/component/core/Form"
import LabelledTable from "ui/component/core/LabelledTable"
import TextEditor from "ui/component/core/TextEditor"
import View from "ui/view/shared/component/View"
import ViewDefinition from "ui/view/shared/component/ViewDefinition"
import Env from "utility/Env"
import MarkdownItHTML from "utility/string/MarkdownItHTML"

export default ViewDefinition({
	create: () => {
		const view = View("home")

		if (Env.isDev) {
			const block = Block().appendTo(view)
			const form = block.and(Form, block.title)

			const output = Component("div")
			Component("div")
				.attributes.set("contenteditable", "plaintext-only")
				.style.setProperty("white-space", "pre-wrap")
				.style.setProperty("font", "inherit")
				.style.setProperty("background", "#222")
				.style.setProperty("width", "100%")
				.style.setProperty("height", "400px")
				.style.setProperty("padding", "0.5em")
				.style.setProperty("box-sizing", "border-box")
				.event.subscribe("input", event => {
					const text = event.component.element.textContent ?? ""
					const md = new MarkdownIt("commonmark", { html: true, breaks: true })
					MarkdownItHTML.use(md, MarkdownItHTML.Options()
						.disallowTags("img", "figure", "figcaption", "map", "area"))
					console.log(md.parse(text, {}))
					output.element.innerHTML = md.render(text)
				})
				.appendTo(form.content)

			output
				.style.setProperty("font", "inherit")
				.style.setProperty("background", "#222")
				.style.setProperty("width", "100%")
				.style.setProperty("padding", "0.5em")
				.style.setProperty("margin-top", "1em")
				.style.setProperty("box-sizing", "border-box")
				.appendTo(form.content)

			const table = LabelledTable().appendTo(form.content)

			table.label(label => label.text.set("test editor"))
				.content((content, label, row) => {
					const editor = TextEditor()
						.setLabel(label)
						.appendTo(content)
					label.event.subscribe("click", () => editor.document?.focus())
				})
		}

		return view
	},
})
