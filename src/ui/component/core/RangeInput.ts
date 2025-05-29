import Component from 'ui/Component'
import Input from 'ui/component/core/ext/Input'
import Applicator from 'ui/utility/Applicator'
import State from 'utility/State'

interface RangeInputExtensions {
	readonly input: Component<HTMLInputElement>
	readonly display: Component
	readonly state: State.Mutable<number | undefined>
	readonly liveState: State<number>
	readonly default: Applicator<this, number>
}

interface RangeInput extends Input, RangeInputExtensions { }

const RangeInput = Component.Builder((component, min: number, max: number, step = 1): RangeInput => {
	const input = Component('input')
		.style('range-input-input')
		.attributes.set('type', 'range')

	const inputElement = input.element
	inputElement.min = `${min}`
	inputElement.max = `${max}`
	inputElement.step = `${step}`

	const state = State<number | undefined>(undefined)

	const internalState = State<number>(inputElement.valueAsNumber)
	inputElement.addEventListener('input', () => internalState.value = inputElement.valueAsNumber)

	const display = Component()
		.style('range-input-display')
		.text.bind(internalState.mapManual(value => value.toString()))

	const defaultValue = State<number>(0)
	const range: RangeInput = component
		.and(Input)
		.style('range-input')
		.tabIndex('auto')
		.append(input, display)
		.extend<RangeInputExtensions>(range => ({
			input,
			display,
			state,
			liveState: internalState,
			default: Applicator(range, 0, value => defaultValue.value = value),
		}))

	State.MapManual([state, defaultValue], (value, defaultValue) => internalState.value = inputElement.valueAsNumber = value ?? defaultValue)

	input.event.subscribe('change', () => internalState.value = state.value = inputElement.valueAsNumber)

	return range
})

export default RangeInput
