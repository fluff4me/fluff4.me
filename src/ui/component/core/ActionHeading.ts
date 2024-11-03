import Component from "ui/Component"
import ActionRow from "ui/component/core/ActionRow"
import Heading from "ui/component/core/Heading"

export interface ActionHeadingExtensions {
	readonly heading: Heading
}

interface ActionHeading extends ActionRow, ActionHeadingExtensions {
	readonly left: Heading
}

const ActionHeading = Component.Builder((component): ActionHeading => {
	const row = component.and(ActionRow).style("action-heading")

	const heading = row.left.and(Heading).style("action-heading-heading")

	return row.extend<ActionHeadingExtensions>(row => ({
		heading,
	})) as ActionHeading
})

export default ActionHeading
