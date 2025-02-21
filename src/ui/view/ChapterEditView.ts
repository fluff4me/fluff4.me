import type { ChapterReference, Work as WorkData, WorkFull } from 'api.fluff4.me'
import EndpointChapterDelete from 'endpoint/chapter/EndpointChapterDelete'
import EndpointChapterGet from 'endpoint/chapter/EndpointChapterGet'
import EndpointChapterGetPaged from 'endpoint/chapter/EndpointChapterGetPaged'
import EndpointWorkGet from 'endpoint/work/EndpointWorkGet'
import Chapters from 'model/Chapters'
import PagedData from 'model/PagedData'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import InfoDialog from 'ui/component/core/InfoDialog'
import Link from 'ui/component/core/Link'
import Work from 'ui/component/Work'
import ChapterEditForm from 'ui/view/chapter/ChapterEditForm'
import PaginatedView from 'ui/view/shared/component/PaginatedView'
import ViewDefinition from 'ui/view/shared/component/ViewDefinition'
import State from 'utility/State'
import Type from 'utility/Type'

interface ChapterEditViewParams extends Omit<ChapterReference, 'url'> {
	url?: string
}

const NEW_CHAPTER = Symbol('NEW_CHAPTER')

export default ViewDefinition({
	requiresLogin: true,
	async load (params: ChapterEditViewParams) {
		const initialChapterResponse = !params.url ? undefined : await EndpointChapterGet.query({ params: params as Required<ChapterEditViewParams> })
		if (initialChapterResponse instanceof Error)
			throw initialChapterResponse

		const workResponse = await EndpointWorkGet.query({ params: Chapters.work(params) })
		if (workResponse instanceof Error)
			throw workResponse

		const owner = Component()
		if (!params.url)
			await InfoDialog.prompt(owner, {
				titleTranslation: 'shared/prompt/beta-restrictions/title',
				bodyTranslation: 'shared/prompt/beta-restrictions/description',
			})

		owner.remove()
		return { initialChapterResponse, work: workResponse.data as WorkData & Partial<WorkFull> }
	},
	create (params: ChapterEditViewParams, { initialChapterResponse, work }) {
		const id = 'chapter-edit'
		const view = PaginatedView(id)

		const author = work.synopsis?.mentions.find(author => author.vanity === params.author)
		delete work.synopsis
		delete work.custom_tags

		Link(`/work/${author?.vanity}/${work.vanity}`)
			.and(Work, work, author)
			.viewTransition('chapter-view-work')
			.style('view-type-chapter-work')
			.setContainsHeading()
			.appendTo(view.content)

		const chapterCount = State((Type.as('number', initialChapterResponse?.page_count) ?? work.chapter_count ?? 0) + 1)

		const chapters = PagedData.fromEndpoint(
			EndpointChapterGetPaged.prep({ params }),
			page => page === chapterCount.value - 1 ? NEW_CHAPTER : null,
		)
		if (initialChapterResponse)
			chapters.set(initialChapterResponse.page, initialChapterResponse.data, !initialChapterResponse.has_more)

		chapters.pageCount.use(view, count => {
			if (count !== undefined)
				chapters.setPageCount(true)
		})

		const pageOwners: Record<number, Component | undefined> = {}
		const paginator = view.paginator()
			.type('flush')
			.setScroll((target, direction, context) => {
				if (!context.previousScrollRect)
					return

				const scrollHeight = context.scrollRect.height
				const previousScrollHeight = context.previousScrollRect.height
				const scrollY = Math.max(context.scrollRect.top, context.previousScrollRect.top)

				window.scrollTo({ top: scrollY + (scrollHeight - previousScrollHeight), behavior: 'instant' })
			})
			.tweak(p => p.page.value = initialChapterResponse?.page ?? chapterCount.value - 1)
			.set(chapters, (slot, pageData, page, source, paginator) => {
				pageOwners[page]?.remove()
				const owner = pageOwners[page] = Component()

				const state = State(pageData === NEW_CHAPTER ? undefined : pageData)
				state.subscribe(owner, chapter => source.set(page, chapter ?? NEW_CHAPTER))
				state.use(owner, chapter => {
					paginator.setURL(!chapter
						? `/work/${params.author}/${params.work}/chapter/new`
						: `/work/${params.author}/${params.work}/chapter/${chapter.url}/edit`)

					if (chapter && page === chapterCount.value - 1)
						chapterCount.value++
				})

				const form = ChapterEditForm(state, Chapters.work(params))
					.subviewTransition(id)
					.appendTo(slot)

				paginator.page.use(owner, (newPage, oldPage) => {
					if (state.value && oldPage === page && newPage !== oldPage && form.hasUnsavedChanges())
						void form.save()
				})

				if (state.value)
					Button()
						.setIcon('trash')
						.text.use('view/chapter-edit/update/action/delete')
						.event.subscribe('click', async () => {
							const chapter = state.value
							if (!chapter)
								return

							const response = await EndpointChapterDelete.query({ params: chapter })
							if (toast.handleError(response))
								return

							chapters.delete(page)
							chapters.unset(page, chapterCount.value)
							chapterCount.value--

							if (page >= chapterCount.value - 2)
								await navigate.toURL(`/work/${chapter.author}/${chapter.work}`)
							else
								paginator.page.emit(page - 1)
						})
						.appendTo(form.footer.left)
			})
			.appendTo(view.content)

		Button()
			.setIcon('angles-right')
			.type('icon')
			.style('paginator-button')
			.event.subscribe('click', () => paginator.page.value = chapterCount.value - 1)
			.appendTo(paginator.footer.right)

		paginator.data.use(view, chapter => view.breadcrumbs.setBackButton(
			chapter === NEW_CHAPTER || !chapter
				? `/work/${params.author}/${params.work}`
				: `/work/${params.author}/${params.work}/chapter/${chapter.url}`,
			button => button.subText.set(chapter === NEW_CHAPTER
				? work.name
				: chapter?.name)
		))

		// const state = State<Chapter | undefined>(chapter)
		// const stateInternal = State<Chapter | undefined>(chapter)

		// stateInternal.subscribe(view, chapter =>
		// 	ViewTransition.perform('subview', id, () => state.value = chapter))

		return view
	},
})
