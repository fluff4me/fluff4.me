import type { ChapterMetadata, ChapterReference } from 'api.fluff4.me'
import EndpointChapters$authorVanity$workVanity$chapterUrlDelete from 'endpoint/chapters/$author_vanity/$work_vanity/$chapter_url/EndpointChapters$authorVanity$workVanity$chapterUrlDelete'
import type { NewWorkReference } from 'model/Works'
import type Component from 'ui/Component'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import type { Quilt } from 'ui/utility/StringApplicator'
import Maths from 'utility/maths/Maths'

export interface NewChapterReference extends ChapterReference {
	author_vanity: string
	work_vanity: string
	chapter_url: string
}

namespace Chapters {
	export function resolve (reference: ChapterReference | null | undefined, chapters: ChapterMetadata[]): ChapterMetadata | undefined {
		return !reference ? undefined : chapters.find(chapter => chapter.author === reference.author && chapter.work === reference.work && chapter.url === reference.url)
	}

	export function work (reference: Omit<ChapterReference, 'url'>): NewWorkReference
	export function work (reference: Omit<ChapterReference, 'url'> | null | undefined): NewWorkReference | undefined
	export function work (reference: Omit<ChapterReference, 'url'> | null | undefined): NewWorkReference | undefined {
		return !reference ? undefined : { author_vanity: reference.author ?? reference.author_vanity!, work_vanity: reference.work ?? reference.work_vanity! }
	}

	export function reference (reference: ChapterReference): NewChapterReference
	export function reference (reference: ChapterReference | null | undefined): NewChapterReference | undefined
	export function reference (reference: ChapterReference | null | undefined): NewChapterReference | undefined {
		return !reference ? undefined : { author_vanity: reference.author ?? reference.author_vanity!, work_vanity: reference.work ?? reference.work_vanity!, chapter_url: reference.url ?? reference.chapter_url! }
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

			const response = await EndpointChapters$authorVanity$workVanity$chapterUrlDelete.query({ params: Chapters.reference(chapter) })
			if (toast.handleError(response))
				return false

			if (navigate.isURL(`/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}/**`))
				void navigate.toURL(`/work/${chapter.author}/${chapter.work}`)

			return true
		},
	}
)
