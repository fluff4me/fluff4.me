import type { ChapterLite, ChapterReference } from 'api.fluff4.me'

namespace Chapters {
	export function resolve (reference: ChapterReference | null | undefined, chapters: ChapterLite[]): ChapterLite | undefined {
		return !reference ? undefined : chapters.find(chapter => chapter.author === reference.author && chapter.work === reference.work && chapter.url === reference.url)
	}
}

export default Chapters
