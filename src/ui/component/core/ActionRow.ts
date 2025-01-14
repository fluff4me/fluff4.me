import Component from 'ui/Component'

interface ActionRowExtensions {
	readonly left: Component
	readonly middle: Component
	readonly right: Component
}

interface ActionRow extends Component, ActionRowExtensions { }

const ActionRow = Component.Builder((row): ActionRow => {
	row.style('action-row')

	let hasRight = false
	return row
		.extend<ActionRowExtensions>(row => ({
			left: undefined!,
			middle: undefined!,
			right: undefined!,
		}))
		.extendJIT('left', row => Component()
			.style('action-row-left')
			.appendTo(row))
		.extendJIT('middle', row => {
			const middle = Component()
				.style('action-row-middle')

			return hasRight
				? middle.insertTo(row, 'before', row.right)
				: middle.appendTo(row)
		})
		.extendJIT('right', row => {
			hasRight = true
			return Component()
				.style('action-row-right')
				.appendTo(row)
		})
})

export default ActionRow
