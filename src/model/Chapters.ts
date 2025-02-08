import type { ChapterLite, ChapterReference, WorkReference } from 'api.fluff4.me'
import EndpointChapterDelete from 'endpoint/chapter/EndpointChapterDelete'
import type Component from 'ui/Component'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'

namespace Chapters {
	export function resolve (reference: ChapterReference | null | undefined, chapters: ChapterLite[]): ChapterLite | undefined {
		return !reference ? undefined : chapters.find(chapter => chapter.author === reference.author && chapter.work === reference.work && chapter.url === reference.url)
	}

	export function work (reference: Omit<ChapterReference, 'url'>): WorkReference
	export function work (reference: Omit<ChapterReference, 'url'> | null | undefined): WorkReference | undefined
	export function work (reference: Omit<ChapterReference, 'url'> | null | undefined): WorkReference | undefined {
		return !reference ? undefined : { author: reference.author, vanity: reference.work }
	}

	export function reference (reference: ChapterReference): ChapterReference
	export function reference (reference: ChapterReference | null | undefined): ChapterReference | undefined
	export function reference (reference: ChapterReference | null | undefined): ChapterReference | undefined {
		return !reference ? undefined : { author: reference.author, work: reference.work, url: reference.url }
	}
}

export default Object.assign(
	Chapters,
	{
		async delete (chapter?: ChapterReference, owner?: Component): Promise<boolean> {
			if (!chapter)
				return true

			const result = await ConfirmDialog.prompt(owner ?? null, { dangerToken: 'delete-chapter' })
			if (!result)
				return false

			const response = await EndpointChapterDelete.query({ params: chapter })
			if (toast.handleError(response))
				return false

			if (navigate.isURL(`/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}/**`))
				void navigate.toURL(`/work/${chapter.author}/${chapter.work}`)

			return true
		},
	}
)
