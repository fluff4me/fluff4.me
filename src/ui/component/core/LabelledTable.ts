import Component from 'ui/Component'
import type Label from 'ui/component/core/Label'
import type { AutoLabel } from 'ui/component/core/Label'
import LabelledRow from 'ui/component/core/LabelledRow'

interface LabelledRowFactory<HOST extends LabelledTable> {
	content (initialiser: (content: Component, label: Label, row: LabelledRow) => Component | undefined | void): HOST
}

interface LabelledTableExtensions {
	label (initialiser: (label: AutoLabel, row: LabelledRow) => Label): LabelledRowFactory<this & LabelledTable>
}

interface LabelledTable extends Component, LabelledTableExtensions { }

const LabelledTable = Component.Builder((table): LabelledTable => {
	table.style('labelled-table')

	let labelInitialiser: ((label: AutoLabel, row: LabelledRow) => Label) | undefined
	let factory: LabelledRowFactory<LabelledTable> | undefined

	return table.extend<LabelledTableExtensions>(table => ({
		label: initialiser => {
			labelInitialiser = initialiser
			return factory ??= {
				content: contentInitialiser => {
					const row = LabelledRow()
						.style('labelled-row--in-labelled-table')
						.appendTo(table)
					row.label = labelInitialiser!(row.label as AutoLabel, row)
					row.content = contentInitialiser(row.content, row.label, row) ?? row.content
					labelInitialiser = undefined
					return table
				},
			}
		},
	}))
})

export default LabelledTable
