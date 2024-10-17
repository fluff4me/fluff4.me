import Component from "ui/Component"
import type Label from "ui/component/core/Label"
import { AutoLabel } from "ui/component/core/Label"
import ViewTransition from "ui/view/component/ViewTransition"

interface LabelledRowExtensions {
	label: Label
	content: Component
}

interface LabelledRow extends Component, LabelledRowExtensions { }

const LabelledRow = Component.Builder((row): LabelledRow => {
	row.style("labelled-row")
	row.and(ViewTransition.HasSubview)

	let label: Label = AutoLabel().appendTo(row)
	let content = Component().style("labelled-row-content").appendTo(row)

	return row
		.extend<LabelledRowExtensions>(row => ({
			label, content,
		}))
		.extendMagic("label", row => ({
			get: () => label,
			set: newLabel => {
				if (label === newLabel)
					return

				label.element.replaceWith(newLabel.element)
				label = newLabel
			},
		}))
		.extendMagic("content", row => ({
			get: () => content,
			set: newContent => {
				if (content === newContent)
					return

				content.element.replaceWith(newContent.element)
				content = newContent
			},
		}))

})

export default LabelledRow
