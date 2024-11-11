import type { Work } from "api.fluff4.me"
import Component from "ui/Component"
import Block from "ui/component/core/Block"

export default Component.Builder((component, work: Work) => {
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

	return block
}) 
