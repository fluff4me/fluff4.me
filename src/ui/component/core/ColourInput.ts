import Component from 'ui/Component'
import Input from 'ui/component/core/ext/Input'
import Applicator from 'ui/utility/Applicator'
import State from 'utility/State'

interface ColourInputExtensions {
	readonly value: State.Mutable<number>
	readonly default: Applicator.Optional<this, number>
}

interface ColourInput extends Input<HTMLInputElement>, ColourInputExtensions { }

const ColourInput = Component.Builder('input', (component): ColourInput => {
	const value = State<number>(0x000000)
	return (component.replaceElement('input') as Component<HTMLInputElement>)
		.and(Input)
		.style('colour-input')
		.attributes.set('type', 'color')
		.event.subscribe('input', event => {
			value.value = parseInt(event.host.element.value.slice(1), 16)
		})
		.tweak(input => {
			value.use(input, value => input.element.value = `#${value.toString(16).padStart(6, '0')}`)
		})
		.extend<ColourInputExtensions>(input => ({
			value,
			default: Applicator(input, value => input.value.value = value ?? 0x000000),
		}))
})

export default ColourInput
