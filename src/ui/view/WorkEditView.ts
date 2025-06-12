import type { Work } from 'api.fluff4.me'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import Works from 'model/Works'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
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
	async load (params: WorkEditViewParams | undefined) {
		const response = params && await EndpointWorkGet.query({ params })
		if (response instanceof Error)
			throw response

		const work = response?.data
		return { work }
	},
	create (params: WorkEditViewParams | undefined, { work }) {
		const id = 'work-edit'
		const view = View(id)

		const state = State<Work | undefined>(work)
		const editFormState = State<Work | undefined>(work)

		state.use(view, work => view.breadcrumbs.setBackButton(
			work && `/work/${work.author}/${work.vanity}`,
			button => work && button.subText.set(work.name),
		))

		Slot()
			.use(state, () => WorkEditForm(editFormState).subviewTransition(id))
			.appendTo(view.content)

		Slot()
			.use(state, () => createActionRow()?.subviewTransition(id))
			.appendTo(view.content)

		editFormState.subscribe(view, work =>
			ViewTransition.perform('subview', id, () => state.value = work))

		return view

		function createActionRow (): ActionRow | undefined {
			const work = state.value
			if (!work)
				return

			return ActionRow()
				.viewTransition('work-edit-action-row')
				.tweak(row => row.left
					.append(Button()
						.setIcon('plus')
						.text.use('view/work-edit/update/action/new-chapter')
						.event.subscribe('click', () => navigate.toURL(`/work/${work.author}/${work.vanity}/chapter/new`)))
					.append(Button()
						.setIcon('plus')
						.text.use('view/work-edit/update/action/bulk-chapters')
						.event.subscribe('click', () => navigate.toURL(`/work/${work.author}/${work.vanity}/chapter/new/bulk`)))
				)
				.tweak(row => row.right
					.append(Button()
						.setIcon('trash')
						.text.use('view/work-edit/update/action/delete')
						.event.subscribe('click', async () => Works.delete(work, view)))
				)
		}
	},
})
