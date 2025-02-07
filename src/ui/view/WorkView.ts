import EndpointChapterGetAll from 'endpoint/chapter/EndpointChapterGetAll'
import EndpointHistoryAddWork from 'endpoint/history/EndpointHistoryAddWork'
import type { WorkParams } from 'endpoint/work/EndpointWorkGet'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import Chapter from 'ui/component/Chapter'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Paginator2 from 'ui/component/core/Paginator2'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Work from 'ui/component/Work'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Errors from 'utility/Errors'

export default ViewDefinition({
	create: async (params: WorkParams) => {
		const view = View('work')

		const response = await EndpointWorkGet.query({ params })
		if (response instanceof Error)
			throw response

		void EndpointHistoryAddWork.query({ params })

		const workData = response.data
		const authorData = workData.synopsis.mentions.find(author => author.vanity === params.author)!
		if (!authorData)
			throw Errors.BadData('Work author not in synopsis authors')

		Work(workData, authorData)
			.viewTransition('work-view-work')
			.setContainsHeading()
			.appendTo(view.content)

		Paginator2()
			.viewTransition('work-view-chapters')
			.tweak(p => p.title.text.use('view/work/chapters/title'))
			.set(
				PagedListData.fromEndpoint(25, EndpointChapterGetAll.prep({
					params: {
						author: params.author,
						vanity: params.vanity,
					},
				})),
				(slot, chapters) => {
					slot.style('chapter-list')
					for (const chapterData of chapters)
						Chapter(chapterData, workData, authorData)
							.appendTo(slot)
				}
			)
			.orElse(slot => Block()
				.type('flush')
				.tweak(block => Placeholder()
					.text.use('view/work/chapters/content/empty')
					.appendTo(block.content))
				.appendTo(slot))
			.setActionsMenu(popover => popover
				.append(Slot()
					.if(Session.Auth.author.map(popover, author => author?.vanity === params.author), () => Button()
						.setIcon('plus')
						.type('flush')
						.text.use('view/work/chapters/action/label/new')
						.event.subscribe('click', () => navigate.toURL(`/work/${params.author}/${params.vanity}/chapter/new`))))
			)
			.appendTo(view.content)

		return view
	},
})
