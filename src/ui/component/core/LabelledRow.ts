import Component from 'ui/Component'
import type Label from 'ui/component/core/Label'
import { AutoLabel } from 'ui/component/core/Label'

interface LabelledRowExtensions {
	label: Label
	content: Component
}

interface LabelledRow extends Component, LabelledRowExtensions { }

const LabelledRow = Component.Builder((row): LabelledRow => {
	row.style('labelled-row')

	let label: Label = AutoLabel().style('labelled-row-label').appendTo(row)
	let content = Component().style('labelled-row-content').appendTo(row)

	return row
		.extend<LabelledRowExtensions>(row => ({
			label, content,
		}))
		.extendMagic('label', row => ({
			get: () => label,
			set: newLabel => {
				if (label === newLabel)
					return

				label.element.replaceWith(newLabel.element)
				label = newLabel
			},
		}))
		.extendMagic('content', row => ({
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
