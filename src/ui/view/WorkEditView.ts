import type { WorkFull } from 'api.fluff4.me'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import Works from 'model/Works'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import InfoDialog from 'ui/component/core/InfoDialog'
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

		const owner = Component()

		const work = response?.data
		if (!work)
			await InfoDialog.prompt(owner, {
				titleTranslation: 'shared/prompt/beta-restrictions/title',
				bodyTranslation: 'shared/prompt/beta-restrictions/description',
			})

		owner.remove()
		return { work }
	},
	create (params: WorkEditViewParams | undefined, { work }) {
		const id = 'work-edit'
		const view = View(id)

		const state = State<WorkFull | undefined>(work)
		const stateInternal = State<WorkFull | undefined>(work)

		state.use(view, work => view.breadcrumbs.setBackButton(
			work && `/work/${work.author}/${work.vanity}`,
			button => work && button.subText.set(work.name),
		))

		Slot()
			.use(state, () => WorkEditForm(stateInternal).subviewTransition(id))
			.appendTo(view.content)

		Slot()
			.use(state, () => createActionRow()?.subviewTransition(id))
			.appendTo(view.content)

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
						.event.subscribe('click', async () => Works.delete(state.value, view))))
		}
	},
})
