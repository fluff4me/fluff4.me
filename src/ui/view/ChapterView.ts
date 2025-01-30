import type { Work as WorkData, WorkFull } from 'api.fluff4.me'
import type { ChapterParams } from 'endpoint/chapter/EndpointChapterGet'
import EndpointChapterGet from 'endpoint/chapter/EndpointChapterGet'
import EndpointChapterGetPaged from 'endpoint/chapter/EndpointChapterGetPaged'
import EndpointReactChapter from 'endpoint/reaction/EndpointReactChapter'
import EndpointUnreactChapter from 'endpoint/reaction/EndpointUnreactChapter'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import quilt from 'lang/en-nz'
import TextBody from 'model/TextBody'
import Component from 'ui/Component'
import Chapter from 'ui/component/Chapter'
import Comments from 'ui/component/Comments'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Slot from 'ui/component/core/Slot'
import Reaction from 'ui/component/Reaction'
import Tags from 'ui/component/Tags'
import type { TagsState } from 'ui/component/TagsEditor'
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
			.appendTo(view.content)

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
			.appendTo(view.content)
			.useInitial(initialChapterResponse.data, initialChapterResponse.page, initialChapterResponse.page_count)
			.thenUse(chaptersQuery)
			.withContent((slot, chapter, paginator) => {
				paginator.setURL(`/work/${params.author}/${params.vanity}/chapter/${chapter.url}`)

				if (chapter.notes_before)
					Component()
						.style('view-type-chapter-block-notes')
						.setMarkdownContent(TextBody.resolve(chapter.notes_before, chapter.mentions))
						.appendTo(slot)

				Tags()
					.set(chapter as TagsState)
					.appendTo(slot)

				Component()
					.style('view-type-chapter-block-body')
					.setMarkdownContent(chapter.body ?? '')
					.appendTo(slot)

				if (chapter.notes_after)
					Component()
						.style('view-type-chapter-block-notes')
						.setMarkdownContent(TextBody.resolve(chapter.notes_after, chapter.mentions))
						.appendTo(slot)
			})

		paginator.header.style('view-type-chapter-block-header')
		paginator.content.style('view-type-chapter-block-content')
		paginator.footer.style('view-type-chapter-block-paginator-actions')

		paginator.setActionsMenu(popover => Chapter.initActions(popover, chapterState.value, workData, author))

		Link(`/work/${params.author}/${params.vanity}`)
			.and(Button)
			.type('flush')
			.text.use('chapter/action/index')
			.appendTo(paginator.footer.middle)

		const reactions = chapterState.mapManual(chapter => chapter.reactions ?? 0)
		const reacted = chapterState.mapManual(chapter => !!chapter.reacted)
		Reaction('love', reactions, reacted)
			.event.subscribe('click', async () => {
				if (!author?.vanity)
					return

				const params = { author: author?.vanity, vanity: workData.vanity, url: chapterState.value.url, type: 'love' } as const
				if (reacted.value) {
					const response = await EndpointUnreactChapter.query({ params })
					if (toast.handleError(response))
						return

					delete chapterState.value.reacted
					if (chapterState.value.reactions)
						chapterState.value.reactions--
					chapterState.emit()
				}
				else {
					const response = await EndpointReactChapter.query({ params })
					if (toast.handleError(response))
						return

					chapterState.value.reacted = true
					chapterState.value.reactions ??= 0
					chapterState.value.reactions++
					chapterState.emit()
				}
			})
			.appendTo(paginator.footer.middle)

		paginator.data.use(paginator, chapter => chapterState.value = chapter)

		Slot()
			.use(paginator.data, (slot, chapter) => {
				if (!chapter.root_comment)
					return

				return Comments(chapter.root_comment as UUID, true)
			})
			.appendTo(view.content)

		return view
	},
})
