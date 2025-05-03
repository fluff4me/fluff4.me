import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import ColourInput from 'ui/component/core/ColourInput'
import Input from 'ui/component/core/ext/Input'
import Slot from 'ui/component/core/Slot'
import InputBus from 'ui/InputBus'
import Applicator from 'ui/utility/Applicator'
import State from 'utility/State'

interface GradientInputExtensions {
	readonly value: State.Mutable<readonly number[]>
	readonly default: Applicator.Optional<this, number[]>
}

interface GradientInput extends Input, GradientInputExtensions { }

const GradientInput = Component.Builder((component): GradientInput => {
	const value = State<number[]>([], (newValue, oldValue) => true
		&& newValue.length === oldValue.length
		&& newValue.every((value, index) => value === oldValue[index])
	)
	const stopsState = value.mapManual(stops => stops.slice(), (oldStops, newStops) => oldStops?.length === newStops.length)
	let refocus: number | undefined
	return component.and(Input)
		.style('gradient-input')
		.append(Slot().use(stopsState, (slot, stops) => {
			const stopButtons: ColourInput[] = []
			for (let i = 0; i < stops.length; i++) {
				const stop = stops[i]
				Component()
					.style('gradient-input-stop')
					.append(ColourInput()
						.tweak(input => {
							stopButtons[i] = input
							input.value.value = stop
							input.value.subscribe(slot, stop => {
								value.value[i] = stop
								value.emit()
							})

							if (refocus === i) {
								input.onRooted(() => input.focus())
								refocus = undefined
							}

							InputBus.until(input, bus => bus.subscribe('down', event => {
								if (event.targetComponent !== input)
									return

								if (!event.use('Backspace') && !event.use('Delete'))
									return

								refocus = event.key === 'Backspace' ? Math.max(0, i - 1) : i
								value.value.splice(i, 1)
								value.emit()
							}))
						})
						.event.subscribe('mousedown', event => {
							if (event.button !== 1)
								return

							event.preventDefault()
							value.value.splice(i, 1)
							value.emit()
						})
					)
					.appendTo(slot)
			}

			if (stops.length < 5)
				Button()
					.setIcon('plus')
					.style('gradient-input-add-stop')
					.event.subscribe('click', () => {
						refocus = stops.length
						value.value.push(0x000000)
						value.emit()
					})
					.tweak(button => {
						if (refocus === stops.length) {
							button.onRooted(() => button.focus())
							refocus = undefined
						}
					})
					.appendTo(slot)
		}))
		.extend<GradientInputExtensions>(input => ({
			value,
			default: Applicator(input, value => input.value.value = !value?.length ? [] : value),
		}))
})

export default GradientInput
