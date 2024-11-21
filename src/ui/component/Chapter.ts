import type { ChapterLite } from "api.fluff4.me"
import Component from "ui/Component"
import Timestamp from "ui/component/core/Timestamp"

interface ChapterExtensions {
	// number: Component
	chapterName: Component
	timestamp?: Component
}

interface Chapter extends Component, ChapterExtensions { }

const Chapter = Component.Builder((component, chapter: ChapterLite): Chapter => {
	component
		.viewTransition("chapter")
		.style("chapter")

	// const number = Component()
	// 	.style("chapter-number")
	// 	.text.set(chapter.).

	const chapterName = Component()
		.style("chapter-name")
		.text.set(chapter.name)
		.appendTo(component)

	const timestamp = !chapter.time_last_update ? undefined
		: Timestamp(chapter.time_last_update)
			.appendTo(component)

	return component.extend<ChapterExtensions>(chapter => ({
		chapterName,
		timestamp,
	}))
})

export default Chapter
