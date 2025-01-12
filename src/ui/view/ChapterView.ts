import type { Work as WorkData, WorkFull } from 'api.fluff4.me'
import type { ChapterParams } from 'endpoint/chapter/EndpointChapterGet'
import EndpointChapterGet from 'endpoint/chapter/EndpointChapterGet'
import EndpointChapterGetPaged from 'endpoint/chapter/EndpointChapterGetPaged'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import quilt from 'lang/en-nz'
import Comments from 'ui/component/Comments'
import Link from 'ui/component/core/Link'
import Slot from 'ui/component/core/Slot'
import Work from 'ui/component/Work'
import PaginatedView from 'ui/view/shared/component/PaginatedView'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import Maths from 'utility/maths/Maths'
import State from 'utility/State'
import type { UUID } from 'utility/string/Strings'

export default ViewDefinition({
	create: async (params: ChapterParams) => {
		const view = PaginatedView('chapter')

		const response = await EndpointWorkGet.query({ params })
		if (response instanceof Error)
			throw response

		const author = response.data.synopsis.mentions.find(author => author.vanity === params.author)
		const workData = response.data as WorkData & Partial<WorkFull>
		delete workData.synopsis
		delete workData.custom_tags

		Link(`/work/${author?.vanity}/${workData.vanity}`)
			.and(Work, workData, author)
			.viewTransition('work-view-work')
			.style('view-type-chapter-work')
			.setContainsHeading()
			.appendTo(view)

		const initialChapterResponse = await EndpointChapterGet.query({ params })
		if (initialChapterResponse instanceof Error)
			throw initialChapterResponse

		const chapterState = State(initialChapterResponse.data)

		const chaptersQuery = EndpointChapterGetPaged.prep({ params })
		const paginator = await view.paginator()
			.viewTransition('chapter-view-chapter')
			.style('view-type-chapter-block')
			.type('flush')
			.tweak(p => p.title.text.bind(chapterState.mapManual(chapter =>
				quilt['view/chapter/title'](Maths.parseIntOrUndefined(chapter.url), chapter.name))))
			.appendTo(view)
			.useInitial(initialChapterResponse.data, initialChapterResponse.page, initialChapterResponse.page_count)
			.thenUse(chaptersQuery)
			.withContent((slot, chapter, paginator) => {
				paginator.setURL(`/work/${params.author}/${params.vanity}/chapter/${chapter.url}`)
				slot
					.style('view-type-chapter-block-body')
					.setMarkdownContent(chapter.body ?? '')
			})

		paginator.header.style('view-type-chapter-block-header')
		paginator.footer.style('view-type-chapter-block-paginator-actions')

		paginator.data.use(paginator, chapter => chapterState.value = chapter)

		Slot()
			.use(paginator.data, (slot, chapter) => {
				if (!chapter.root_comment)
					return

				return Comments(chapter.root_comment as UUID, true)
			})
			.appendTo(view)

		return view
	},
})
