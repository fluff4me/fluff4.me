import Component from "ui/Component"
import TextInput from "ui/component/core/TextInput"

interface TextInputBlockExtensions {
	readonly inputs: TextInput[]
	addInput (initialiser: (input: TextInput) => any): this
}

interface TextInputBlock extends Component, TextInputBlockExtensions { }

const TextInputBlock = Component.Builder("div", (component): TextInputBlock => {
	const inputs: TextInput[] = []

	const block = component
		.style("text-input-block")
		.extend<TextInputBlockExtensions>(block => ({
			inputs,
			addInput: (initialiser: (input: TextInput) => any) => {
				const input: TextInput = TextInput()
					.style("text-input-block-input")
					.tweak(initialiser)
					.event.subscribe("remove", () => {
						inputs.filterInPlace(i => i !== input)
						inputs.at(0)?.style("text-input-block-input--first")
						inputs.at(-1)?.style("text-input-block-input--last")
					})
					.appendTo(block)

				if (!inputs.length)
					input.style("text-input-block-input--first")

				inputs.at(-1)?.style.remove("text-input-block-input--last")
				inputs.push(input)
				input.style("text-input-block-input--last")
				return block
			},
		}))

	return block
})

export default TextInputBlock
