import type { Author, Work as WorkData } from "api.fluff4.me"
import Tags from "model/Tags"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Timestamp from "ui/component/core/Timestamp"
import Tag from "ui/component/Tag"

interface WorkExtensions {
	work: WorkData
}

interface Work extends Block, WorkExtensions { }

const Work = Component.Builder(async (component, work: WorkData, author: Author): Promise<Work> => {
	component.style("work")

	const block = component.and(Block)
	block.header.style("work-header")
	block.title
		.style("work-name")
		.text.set(work.name)
	block.description
		.style("work-author-list")
		.append(Component()
			.style("work-author")
			.text.set(author.name))

	block.content.style("work-content")
	Component()
		.style("work-description")
		.setMarkdownContent(work.description)
		.appendTo(block.content)

	let tagsWrapper: Component | undefined
	const tags = await Tags.resolve(work.global_tags)
	for (const tag of tags) {
		Tag(tag)
			.appendTo(tagsWrapper ??= Component()
				.style("work-tags")
				.appendTo(block.content))
	}

	if (work.time_last_update)
		block.footer.right.append(Timestamp(work.time_last_update).style("work-timestamp"))

	block.actionsMenuButton.setIcon("ellipsis-vertical")
	block.setActionsMenu((popover, button) => {
		popover.anchor.add("off right", "aligned top")
		popover.anchor.add("off right", "aligned bottom")
		Component()
			.text.set("hi")
			.appendTo(popover)
	})

	return block.extend<WorkExtensions>(component => ({ work }))
})

export default Work
