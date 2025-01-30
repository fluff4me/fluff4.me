import type { ChapterLite, ChapterReference } from 'api.fluff4.me'
import EndpointChapterDelete from 'endpoint/chapter/EndpointChapterDelete'
import type Component from 'ui/Component'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'

namespace Chapters {
	export function resolve (reference: ChapterReference | null | undefined, chapters: ChapterLite[]): ChapterLite | undefined {
		return !reference ? undefined : chapters.find(chapter => chapter.author === reference.author && chapter.work === reference.work && chapter.url === reference.url)
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

			const response = await EndpointChapterDelete.query({ params: { author: chapter.author, vanity: chapter.work, url: chapter.url } })
			if (toast.handleError(response))
				return false

			if (navigate.isURL(`/work/${chapter.author}/${chapter.work}/chapter/${chapter.url}/**`))
				void navigate.toURL(`/work/${chapter.author}/${chapter.work}`)

			return true
		},
	}
)
