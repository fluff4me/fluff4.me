import Component from 'ui/Component'
import type Label from 'ui/component/core/Label'
import { AutoLabel } from 'ui/component/core/Label'
import type TextInput from 'ui/component/core/TextInput'
import TextInputBlock from 'ui/component/core/TextInputBlock'

interface LabelledRowFactory<HOST extends LabelledTextInputBlock> {
	input (inputInitialiser: (input: TextInput, label: Label) => unknown): HOST
}

interface LabelledTextInputBlockExtensions {
	readonly labels: Component
	readonly inputs: TextInputBlock
	label (labelInitialiser: (label: AutoLabel) => Label): LabelledRowFactory<this & LabelledTextInputBlock>
}

interface LabelledTextInputBlock extends Component, LabelledTextInputBlockExtensions { }

const LabelledTextInputBlock = Component.Builder((block): LabelledTextInputBlock => {
	block.style('labelled-text-input-block', 'labelled-row')
		.ariaRole('group')

	const labels = Component()
		.style('labelled-text-input-block-labels')
		.appendTo(block)

	const inputs = TextInputBlock()
		.style('labelled-text-input-block-inputs')
		.appendTo(block)

	let labelInitialiser: ((label: AutoLabel) => Label) | undefined
	let factory: LabelledRowFactory<LabelledTextInputBlock> | undefined

	return block.extend<LabelledTextInputBlockExtensions>(block => ({
		labels,
		inputs,
		label: initialiser => {
			labelInitialiser = initialiser
			return factory ??= {
				input: inputInitialiser => {
					const rowNumber = inputs.inputs.length + 1
					const label = AutoLabel()
						.style('labelled-text-input-block-label')
						.style.setProperty('grid-row', `${rowNumber}`)
						.appendTo(labels)

					labelInitialiser!(label)
					let input!: TextInput
					inputs.addInput(i => input = i
						.style('labelled-text-input-block-input')
						.style.setProperty('grid-row', `${rowNumber}`)
						.tweak(input => inputInitialiser(input.setLabel(label), label))
					)
					input.parent?.style('labelled-text-input-block-input-wrapper')
					labelInitialiser = undefined
					return block
				},
			}
		},
	}))
})

export default LabelledTextInputBlock
