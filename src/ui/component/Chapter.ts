import type { ChapterLite } from "api.fluff4.me"
import Component from "ui/Component"
import Timestamp from "ui/component/core/Timestamp"

interface ChapterExtensions {
	chapter: ChapterLite
	number: Component
	chapterName: Component
	timestamp?: Component
}

interface Chapter extends Component, ChapterExtensions { }

const Chapter = Component.Builder((component, chapter: ChapterLite): Chapter => {
	component.style("chapter")

	const number = Component()
		.style("chapter-number")
		.text.set(chapter.number ? `${chapter.number.toLocaleString()}` : "")
		.appendTo(component)

	const chapterName = Component()
		.style("chapter-name")
		.text.set(chapter.name)
		.appendTo(component)

	const timestamp = !chapter.time_last_update ? undefined
		: Timestamp(chapter.time_last_update)
			.style("chapter-timestamp")
			.appendTo(component)

	return component.extend<ChapterExtensions>(component => ({
		chapter,
		number,
		chapterName,
		timestamp,
	}))
})

export default Chapter
