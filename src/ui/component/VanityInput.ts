import Component from 'ui/Component'
import PrefixedInput from 'ui/component/core/PrefixedInput'
import { FilterFunction } from 'ui/component/core/TextInput'

const VanityInput = Component.Builder((component): PrefixedInput => {
	return component.and(PrefixedInput, 'shared/prefix/vanity').filter(FilterVanity)
})

export default VanityInput

export const FilterVanity = FilterFunction((before: string, selection: string, after: string) => {
	before = filterVanitySegment(before)
	selection = filterVanitySegment(selection)
	after = filterVanitySegment(after)

	if (!before && !after)
		selection = selection.replace(/^-|-$/g, '')
	else {
		if (before.startsWith('-'))
			before = before.slice(1)

		if (before.endsWith('-') && selection.startsWith('-'))
			selection = selection.slice(1)

		if (after.endsWith('-'))
			after = after.slice(0, -1)

		if (selection.endsWith('-') && after.startsWith('-'))
			after = after.slice(1)
	}

	return [before, selection, after] as const
})

function filterVanitySegment (segment: string) {
	return segment.replace(/[\W_-]+/g, '-')
}
