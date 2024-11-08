import type { WorkFull } from "api.fluff4.me"
import EndpointWorkGet from "endpoint/work/EndpointWorkGet"
import ActionRow from "ui/component/core/ActionRow"
import Button from "ui/component/core/Button"
import Slot from "ui/component/core/Slot"
import ViewTransition from "ui/view/shared/ext/ViewTransition"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"
import WorkEditForm from "ui/view/work/WorkEditForm"
import State from "utility/State"

interface WorkEditViewParams {
	author: string
	vanity: string
}

export default ViewDefinition({
	requiresLogin: true,
	create: async (params: WorkEditViewParams | undefined) => {
		const view = View("work-edit")

		const work = params && await EndpointWorkGet.query({ params })
		if (work instanceof Error)
			throw work

		const state = State<WorkFull | undefined>(work?.data)
		const stateInternal = State<WorkFull | undefined>(work?.data)

		Slot()
			.use(state, () => WorkEditForm(stateInternal))
			.appendTo(view)

		Slot()
			.use(state, () => createActionRow())
			.appendTo(view)

		stateInternal.subscribe(view, work =>
			ViewTransition.perform("subview", () => state.value = work))

		return view

		function createActionRow (): ActionRow | undefined {
			if (!stateInternal.value)
				return

			return ActionRow()
				.tweak(row => row.right
					.append(Button()
						.text.use("view/work-edit/action/delete")
						.event.subscribe("click", async () => {
							// const response = await EndpointAuthorDelete.query()
							// if (response instanceof Error) {
							// 	console.error(response)
							// 	return
							// }

							// return Session.reset()
						})))
		}
	},
})
