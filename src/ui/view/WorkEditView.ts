import type { WorkFull } from 'api.fluff4.me'
import EndpointWorkDelete from 'endpoint/work/EndpointWorkDelete'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Slot from 'ui/component/core/Slot'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import WorkEditForm from 'ui/view/work/WorkEditForm'
import State from 'utility/State'

interface WorkEditViewParams {
	author: string
	vanity: string
}

export default ViewDefinition({
	requiresLogin: true,
	create: async (params: WorkEditViewParams | undefined) => {
		const id = 'work-edit'
		const view = View(id)

		const work = params && await EndpointWorkGet.query({ params })
		if (work instanceof Error)
			throw work

		const state = State<WorkFull | undefined>(work?.data)
		const stateInternal = State<WorkFull | undefined>(work?.data)

		Slot()
			.use(state, () => WorkEditForm(stateInternal).subviewTransition(id))
			.appendTo(view)

		Slot()
			.use(state, () => createActionRow()?.subviewTransition(id))
			.appendTo(view)

		stateInternal.subscribe(view, work =>
			ViewTransition.perform('subview', id, () => state.value = work))

		return view

		function createActionRow (): ActionRow | undefined {
			if (!stateInternal.value)
				return

			return ActionRow()
				.viewTransition('work-edit-action-row')
				.tweak(row => row.right
					.append(Button()
						.text.use('view/work-edit/update/action/delete')
						.event.subscribe('click', async () => {
							if (!params)
								return

							const result = await ConfirmDialog.prompt(view, { dangerToken: 'delete-work' })
							if (!result)
								return

							const response = await EndpointWorkDelete.query({ params })
							if (response instanceof Error) {
								console.error(response)
								return
							}

							return navigate.toURL(`/author/${params.author}`)
						})))
		}
	},
})
