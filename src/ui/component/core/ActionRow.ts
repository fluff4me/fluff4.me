import Component from "ui/Component"

interface ActionRowExtensions {
	readonly left: Component
	readonly middle: Component
	readonly right: Component
}

interface ActionRow extends Component, ActionRowExtensions { }

const ActionRow = Component.Builder((row): ActionRow => {
	row.style("action-row")

	return row
		.extend<ActionRowExtensions>(row => ({
			left: undefined!,
			middle: undefined!,
			right: undefined!,
		}))
		.extendJIT("left", row => Component()
			.style("action-row-left")
			.appendTo(row))
		.extendJIT("middle", row => Component()
			.style("action-row-middle")
			.appendTo(row))
		.extendJIT("right", row => Component()
			.style("action-row-right")
			.appendTo(row))
})

export default ActionRow
