import Component from 'ui/Component'
import type { InputExtensions } from 'ui/component/core/ext/Input'
import Input from 'ui/component/core/ext/Input'
import RadioButton from 'ui/component/core/RadioButton'
import Applicator from 'ui/utility/Applicator'
import State from 'utility/State'

interface RadioRowExtensions<ID extends string> {
	readonly selection: State<ID | undefined>
	readonly default: Applicator.Optional<this, ID>
	add<NEW_ID extends string> (id: NEW_ID, initialiser: (radio: RadioButton, id: NEW_ID) => unknown): RadioRow<ID | NEW_ID>
}

interface RadioRow<ID extends string = never> extends Input, RadioRowExtensions<ID> { }

const RadioRow = Component.Builder((component: Component): RadioRow => {
	const selection = State<string | undefined>(undefined)
	const options: Record<string, RadioButton> = {}
	let labelFor: State<string | undefined> | undefined
	const row = component.and(Input)
		.style('radio-row')
		.ariaRole('group')
		.extend<RadioRowExtensions<string> & Partial<InputExtensions>>(row => ({
			selection,
			default: Applicator(row, (id?: string) => selection.value = id),
			add (id, initialiser) {
				const button = options[id] = RadioButton()
					.style('radio-row-option')
					.type('flush')
					.tweak(initialiser, id)
					.setId(id)
					.setName(labelFor)
					.use(selection.map(row, selected => selected === id))
					.receiveFocusedClickEvents()
					.event.subscribe('click', event => {
						selection.value = id
						event.preventDefault()
						event.stopImmediatePropagation()
					})
					.appendTo(row)

				button.style.bind(button.checked, 'radio-row-option--selected')
				button.bindDisabled(button.checked, 'selection')

				return row
			},
		}))
		.extend<Partial<InputExtensions>>(row => ({
			setLabel (label) {
				labelFor = label?.for
				for (const option of Object.values(options))
					option.setName(labelFor)

				label?.setInput(row)
				return row
			},
		}))

	return row as RadioRow
})

export default RadioRow
