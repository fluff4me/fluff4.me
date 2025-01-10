import Component from 'ui/Component'
import TextInput from 'ui/component/core/TextInput'

interface TextInputBlockExtensions {
	readonly inputs: TextInput[]
	addInput (initialiser: (input: TextInput) => unknown): this
}

interface TextInputBlock extends Component, TextInputBlockExtensions { }

const TextInputBlock = Component.Builder((component): TextInputBlock => {
	const inputs: TextInput[] = []

	const block = component
		.style('text-input-block')
		.extend<TextInputBlockExtensions>(block => ({
			inputs,
			addInput: (initialiser: (input: TextInput) => unknown) => {
				const input: TextInput = TextInput()
					.style('text-input-block-input')
					.tweak(initialiser)
					.tweak(input => input.removed.awaitManual(true, () => {
						inputs.filterInPlace(i => i !== input)
						const firstInput = inputs.at(0)
						firstInput?.style('text-input-block-input--first')
						firstInput?.previousSibling?.remove() // remove previous divider if it exists
						inputs.at(-1)?.style('text-input-block-input--last')
						inputs.at(-1)?.parent?.style('text-input-block-input-wrapper--last')
					}))
					.appendTo(Component()
						.style('text-input-block-input-wrapper')
						.appendTo(block))

				if (!inputs.length)
					input.style('text-input-block-input--first')

				inputs.at(-1)?.style.remove('text-input-block-input--last')
				inputs.at(-1)?.parent?.style.remove('text-input-block-input-wrapper--last')
				inputs.push(input)
				input.style('text-input-block-input--last')
				input.parent?.style('text-input-block-input-wrapper--last')
				return block
			},
		}))

	return block
})

export default TextInputBlock
