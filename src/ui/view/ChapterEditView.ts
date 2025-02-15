import type { Chapter, ChapterReference } from 'api.fluff4.me'
import EndpointChapterDelete from 'endpoint/chapter/EndpointChapterDelete'
import EndpointChapterGet from 'endpoint/chapter/EndpointChapterGet'
import Chapters from 'model/Chapters'
import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import InfoDialog from 'ui/component/core/InfoDialog'
import Slot from 'ui/component/core/Slot'
import ChapterEditForm from 'ui/view/chapter/ChapterEditForm'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import ViewTransition from 'ui/view/shared/ext/ViewTransition'
import State from 'utility/State'

interface ChapterEditViewParams extends Omit<ChapterReference, 'url'> {
	url?: string
}

export default ViewDefinition({
	requiresLogin: true,
	async load (params: ChapterEditViewParams) {
		const response = !params.url ? undefined : await EndpointChapterGet.query({ params: params as Required<ChapterEditViewParams> })
		if (response instanceof Error)
			throw response

		const chapter = response?.data

		const owner = Component()
		if (!chapter)
			await InfoDialog.prompt(owner, {
				titleTranslation: 'shared/prompt/beta-restrictions/title',
				bodyTranslation: 'shared/prompt/beta-restrictions/description',
			})

		owner.remove()
		return { chapter }
	},
	create (params: ChapterEditViewParams, { chapter }) {
		const id = 'chapter-edit'
		const view = View(id)

		if (params && chapter)
			view.breadcrumbs.setBackButton(`/work/${params.author}/${params.work}/chapter/${params.url}`,
				button => button.subText.set(chapter.name))

		const state = State<Chapter | undefined>(chapter)
		const stateInternal = State<Chapter | undefined>(chapter)

		Slot()
			.use(state, () => ChapterEditForm(stateInternal, Chapters.work(params)).subviewTransition(id))
			.appendTo(view.content)

		Slot()
			.use(state, () => createActionRow()?.subviewTransition(id))
			.appendTo(view.content)

		stateInternal.subscribe(view, chapter =>
			ViewTransition.perform('subview', id, () => state.value = chapter))

		return view

		function createActionRow (): ActionRow | undefined {
			if (!stateInternal.value)
				return

			return ActionRow()
				.viewTransition('chapter-edit-action-row')
				.tweak(row => row.right
					.append(Button()
						.text.use('view/chapter-edit/update/action/delete')
						.event.subscribe('click', async () => {
							if (!params.url)
								return

							const response = await EndpointChapterDelete.query({ params: { ...params, url: params.url } })
							if (toast.handleError(response))
								return

							await navigate.toURL(`/work/${params.author}/${params.work}`)
						})))
		}
	},
})
