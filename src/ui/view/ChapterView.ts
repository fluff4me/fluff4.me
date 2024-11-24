import type { Work as WorkData, WorkFull } from "api.fluff4.me"
import type { ChapterParams } from "endpoint/chapter/EndpointChapterGet"
import EndpointChapterGet from "endpoint/chapter/EndpointChapterGet"
import EndpointWorkGet from "endpoint/work/EndpointWorkGet"
import Block from "ui/component/core/Block"
import Work from "ui/component/Work"
import View from "ui/view/View"
import ViewDefinition from "ui/view/ViewDefinition"
import Maths from "utility/maths/Maths"

export default ViewDefinition({
	create: async (params: ChapterParams) => {
		const view = View("chapter")

		const response = await EndpointWorkGet.query({ params })
		if (response instanceof Error)
			throw response

		const author = response.data.synopsis.mentions.find(author => author.vanity === params.author)
		const workData = response.data as WorkData & Partial<WorkFull>
		delete workData.synopsis
		delete workData.custom_tags

		const work = await Work(workData, author)
		work
			.viewTransition("work-view-work")
			.style("view-type-chapter-work")
			.setContainsHeading()
			.appendTo(view)

		const response2 = await EndpointChapterGet.query({ params })
		if (response2 instanceof Error)
			throw response2

		const chapterData = response2.data

		const chapter = Block()
			.style("view-type-chapter-block")
			.appendTo(view)

		const number = Maths.parseIntOrUndefined(chapterData.url)
		chapter.title.text.use(quilt => quilt["view/chapter/title"](number ?? undefined, chapterData.name))

		chapter.content
			.style("view-type-chapter-block-body")
			.setMarkdownContent(chapterData.body ?? "")

		return view
	},
})
