import Component from 'ui/Component'
import PrefixedInput from 'ui/component/core/PrefixedInput'
import { FilterFunction } from 'ui/component/core/TextInput'

const CurrencyInput = Component.Builder((component): PrefixedInput => {
	return component.and(PrefixedInput, 'shared/prefix/currency').filter(FilterCurrency)
})

export default CurrencyInput

export const FilterCurrency = FilterFunction((before, selected, after) => {
	[before, selected, after] = FilterFunction.DECIMAL(before, selected, after)
	if (!before && !selected && !after)
		return [before, selected, after]

	let decimalIndex = before.indexOf('.') + 1
	before = !decimalIndex ? before : before.slice(0, decimalIndex + 2)

	if (!decimalIndex) {
		decimalIndex = selected.indexOf('.') + 1
		if (decimalIndex) decimalIndex += before.length
	}
	selected = !decimalIndex ? selected : selected.slice(0, decimalIndex + 2 - before.length)

	if (!decimalIndex) {
		decimalIndex = after.indexOf('.') + 1
		if (decimalIndex) decimalIndex += before.length + selected.length
	}
	const centsLength = decimalIndex + 2 - before.length - selected.length
	after = !decimalIndex ? `${after}.00` : after.slice(0, centsLength).padEnd(centsLength, '0')

	return [before, selected, after]
})
