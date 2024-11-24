import EndpointChapterGetAll from "endpoint/chapter/EndpointChapterGetAll"
import type { WorkParams } from "endpoint/work/EndpointWorkGet"
import EndpointWorkGet from "endpoint/work/EndpointWorkGet"
import Session from "model/Session"
import Chapter from "ui/component/Chapter"
import Button from "ui/component/core/Button"
import Paginator from "ui/component/core/Paginator"
import Slot from "ui/component/core/Slot"
import Work from "ui/component/Work"
import View from "ui/view/shared/component/View"
import ViewDefinition from "ui/view/shared/component/ViewDefinition"
import Errors from "utility/Errors"

export default ViewDefinition({
	create: async (params: WorkParams) => {
		const view = View("work")

		const response = await EndpointWorkGet.query({ params })
		if (response instanceof Error)
			throw response

		const workData = response.data
		const authorData = workData.synopsis.mentions.find(author => author.vanity === params.author)!
		if (!authorData)
			throw Errors.BadData("Work author not in synopsis authors")

		const work = await Work(workData, authorData)
		work
			.viewTransition("work-view-work")
			.setContainsHeading()
			.appendTo(view)

		const paginator = Paginator()
			.viewTransition("work-view-chapters")
			.tweak(p => p.title.text.use("view/work/chapters/title"))
			.tweak(p => p.primaryActions.append(Slot()
				.if(Session.Auth.loggedIn, () => Button()
					.setIcon("plus")
					.ariaLabel.use("view/work/chapters/action/label/new")
					.event.subscribe("click", () => navigate.toURL(`/work/${params.author}/${params.vanity}/chapter/new`)))))
			.appendTo(view)
		const chaptersQuery = EndpointChapterGetAll.prep({
			params: {
				author: params.author,
				vanity: params.vanity,
			},
		})
		await paginator.useEndpoint(chaptersQuery, (slot, chapters) => {
			slot.style("chapter-list")
			for (const chapterData of chapters)
				Chapter(chapterData, workData, authorData)
					.appendTo(slot)
		})

		return view
	},
})
