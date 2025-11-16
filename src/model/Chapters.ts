import type { ChapterMetadata, ChapterReference, WorkReference } from 'api.fluff4.me'
import EndpointChapterDelete from 'endpoint/chapter/EndpointChapterDelete'
import type Component from 'ui/Component'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import type { Quilt } from 'ui/utility/StringApplicator'
import Maths from 'utility/maths/Maths'

namespace Chapters {
	export function resolve (reference: ChapterReference | null | undefined, chapters: ChapterMetadata[]): ChapterMetadata | undefined {
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

	export function getName (chapter?: ChapterMetadata): string | Quilt.Handler | undefined {
		if (!chapter)
			return undefined

		const chapterNumber = Maths.parseIntOrUndefined(chapter.url)
		return _
			|| chapter.name
			|| (!chapterNumber ? undefined : quilt => quilt['view/chapter/number/label'](chapterNumber))
			|| (chapter.url.includes('.') ? quilt => quilt['view/chapter/number/interlude/label'](chapter.url) : undefined)
	}
}

export default Object.assign(
	Chapters,
	{
		async delete (chapter?: ChapterMetadata, owner?: Component): Promise<boolean> {
			if (!chapter)
				return true

			const result = await ConfirmDialog.prompt(owner ?? null, {
				dangerToken: 'delete-chapter',
				bodyTranslation: quilt => quilt['chapter/action/delete/confirm'](chapter.name),
			})
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
