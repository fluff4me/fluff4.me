import type { ChapterMetadata, ChapterReference, WorkReference } from 'api.fluff4.me'
import EndpointChapters$authorVanity$workVanity$chapterUrlDelete from 'endpoint/chapters/$author_vanity/$work_vanity/$chapter_url/EndpointChapters$authorVanity$workVanity$chapterUrlDelete'
import type Component from 'ui/Component'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import type { Quilt } from 'ui/utility/StringApplicator'
import Maths from 'utility/maths/Maths'

namespace Chapters {
	export function resolve (reference: ChapterReference | null | undefined, chapters: ChapterMetadata[]): ChapterMetadata | undefined {
		return !reference ? undefined : chapters.find(chapter => chapter.author_vanity === reference.author_vanity && chapter.work_vanity === reference.work_vanity && chapter.chapter_url === reference.chapter_url)
	}

	export function work (reference: Omit<ChapterReference, 'chapter_url'>): WorkReference
	export function work (reference: Omit<ChapterReference, 'chapter_url'> | null | undefined): WorkReference | undefined
	export function work (reference: Omit<ChapterReference, 'chapter_url'> | null | undefined): WorkReference | undefined {
		return !reference ? undefined : { author_vanity: reference.author_vanity, work_vanity: reference.work_vanity }
	}

	export function reference (reference: ChapterReference): ChapterReference
	export function reference (reference: ChapterReference | null | undefined): ChapterReference | undefined
	export function reference (reference: ChapterReference | null | undefined): ChapterReference | undefined {
		return !reference ? undefined : { author_vanity: reference.author_vanity, work_vanity: reference.work_vanity, chapter_url: reference.chapter_url }
	}

	export function getName (chapter?: ChapterMetadata): string | Quilt.Handler | undefined {
		if (!chapter)
			return undefined

		const chapterNumber = Maths.parseIntOrUndefined(chapter.chapter_url)
		return _
			|| chapter.name
			|| (!chapterNumber ? undefined : quilt => quilt['view/chapter/number/label'](chapterNumber))
			|| (chapter.chapter_url.includes('.') ? quilt => quilt['view/chapter/number/interlude/label'](chapter.chapter_url) : undefined)
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

			const response = await EndpointChapters$authorVanity$workVanity$chapterUrlDelete.query({ params: Chapters.reference(chapter) })
			if (toast.handleError(response))
				return false

			if (navigate.isURL(`/work/${chapter.author_vanity}/${chapter.work_vanity}/chapter/${chapter.chapter_url}/**`))
				void navigate.toURL(`/work/${chapter.author_vanity}/${chapter.work_vanity}`)

			return true
		},
	}
)
