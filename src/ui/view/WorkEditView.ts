import type { Work, WorkReference } from 'api.fluff4.me'
import EndpointWorks$authorVanity$workVanityGet from 'endpoint/works/$author_vanity/$work_vanity/EndpointWorks$authorVanity$workVanityGet'
import Session from 'model/Session'
import Works from 'model/Works'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import Slot from 'ui/component/core/Slot'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import WorkEditForm from 'ui/view/work/WorkEditForm'
import State from 'utility/State'

export default ViewDefinition({
	requiresLogin: true,
	async load (params: WorkReference | undefined) {
		const response = params && await EndpointWorks$authorVanity$workVanityGet.query({ params })
		if (response instanceof Error)
			throw response

		if (response && response?.data.author !== Session.Auth.author.value?.vanity)
			void navigate.toURL(`/work/${response.data.author}/${response.data.vanity}`)

		const work = response?.data
		return { work }
	},
	create (params: WorkReference | undefined, { work }) {
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
