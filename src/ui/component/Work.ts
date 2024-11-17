import type { Work as WorkData } from "api.fluff4.me"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Timestamp from "ui/component/core/Timestamp"

interface WorkExtensions {
	work: WorkData
}

interface Work extends Block, WorkExtensions { }

const Work = Component.Builder((component, work: WorkData): Work => {
	component.style("work")

	const block = component.and(Block)
	block.title
		.style("work-name")
		.text.set(work.name)
	// block.description
	// 	.style("work-vanity")
	// 	.text.set(`@${author.vanity}`)

	Component()
		.style("work-description")
		.setMarkdownContent(work.description)
		.appendTo(block.content)

	if (work.time_last_update)
		block.footer.right.append(Timestamp(work.time_last_update))

	return block.extend<WorkExtensions>(component => ({ work }))
})

export default Work
