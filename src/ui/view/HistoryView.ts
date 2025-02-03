import type { WorkReference } from 'api.fluff4.me'
import EndpointHistoryGet from 'endpoint/history/EndpointHistoryGet'
import Authors from 'model/Authors'
import PagedListData from 'model/PagedListData'
import Works from 'model/Works'
import Chapter from 'ui/component/Chapter'
import Block from 'ui/component/core/Block'
import Link from 'ui/component/core/Link'
import Paginator2 from 'ui/component/core/Paginator2'
import Work from 'ui/component/Work'
import View from 'ui/view/shared/component/View'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'

export default ViewDefinition({
	create: () => {
		const view = View('history')

		view.breadcrumbs.title.text.use('view/history/main/title')
		view.breadcrumbs.description.text.use('view/history/main/description')

		Paginator2()
			.type('flush')
			.set(
				PagedListData.fromEndpoint(25, EndpointHistoryGet.prep(), data => ({
					content: data.items,
					auxiliary: data,
				})),
				(slot, history, data) => {
					slot.style('history')

					let currentWork: WorkReference | undefined
					for (let i = history.length - 1; i >= 0; i--) {
						const item = history[i]
						if (item.chapter && !Works.equals(item.work, currentWork))
							history.splice(i + 1, 0, { work: item.work, view_time: item.view_time })

						if (!item.chapter && Works.equals(item.work, currentWork))
							history.splice(i, 1)

						currentWork = item.work
					}

					let currentChapterBlock: Block | undefined
					for (const historyItem of history) {
						const work = Works.resolve(historyItem.work, data.works.value)
						const author = Authors.resolve(work?.author, data.authors.value)

						if (!work || !author)
							continue

						if (!historyItem.chapter) {
							Link(`/work/${author.vanity}/${work.vanity}`)
								.and(Work, { ...work, time_last_update: historyItem.view_time }, author)
								.style('history-work')
								.appendTo(slot)

							currentChapterBlock = undefined
							continue
						}

						Chapter({ ...historyItem.chapter, time_last_update: historyItem.view_time }, work, author)
							.style('history-chapter')
							.appendTo(currentChapterBlock ??= Block()
								.style('history-chapter-block', 'chapter-list')
								.tweak(block => block.content.remove())
								.appendTo(slot))
					}
				},
			)
			.appendTo(view.content)

		return view
	},
})
