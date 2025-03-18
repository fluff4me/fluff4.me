import Component from 'ui/Component'
import type Label from 'ui/component/core/Label'
import type { AutoLabel } from 'ui/component/core/Label'
import LabelledRow from 'ui/component/core/LabelledRow'
import Slot from 'ui/component/core/Slot'
import type State from 'utility/State'

interface LabelledRowFactory<HOST extends LabelledTable> {
	if (state: State<boolean>, orElse?: () => unknown): this
	content (initialiser: (content: Component, label: Label, row: LabelledRow) => Component | undefined | void): HOST
}

interface LabelledTableExtensions {
	label (initialiser: (label: AutoLabel, row: LabelledRow) => Label): LabelledRowFactory<this & LabelledTable>
}

interface LabelledTable extends Component, LabelledTableExtensions { }

const LabelledTable = Component.Builder((table): LabelledTable => {
	table.style('labelled-table')

	let nextLabelInitialiser: ((label: AutoLabel, row: LabelledRow) => Label) | undefined
	let orElse: (() => unknown) | undefined
	let factory: LabelledRowFactory<LabelledTable> | undefined

	return table.extend<LabelledTableExtensions>(table => ({
		label: initialiser => {
			nextLabelInitialiser = initialiser
			let state: State<boolean> | undefined
			return factory ??= {
				if (stateIn, elseFn) {
					state = stateIn
					orElse = elseFn
					return factory!
				},
				content: contentInitialiser => {
					const labelInitialiser = nextLabelInitialiser
					nextLabelInitialiser = undefined

					if (state)
						Slot().if(state, create).else(() => { orElse?.() }).appendTo(table)
					else
						create().appendTo(table)

					return table

					function create () {
						const row = LabelledRow()
							.style('labelled-row--in-labelled-table')

						row.label = labelInitialiser!(row.label as AutoLabel, row)
						row.content = contentInitialiser(row.content, row.label, row) ?? row.content

						return row
					}
				},
			}
		},
	}))
})

export default LabelledTable
