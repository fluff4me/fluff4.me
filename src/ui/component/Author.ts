import type { AuthorFull } from "api.fluff4.me"
import Component from "ui/Component"
import Block from "ui/component/core/Block"

export default Component.Builder((component, author: AuthorFull) => {
	component.style("author")

	const block = component.and(Block)
	block.title
		.style("author-name")
		.text.set(author.name)
	block.description
		.style("author-vanity")
		.text.set(`@${author.vanity}`)

	Component()
		.style("author-description")
		.setMarkdownContent(author.description.body)
		.appendTo(block.content)

	return block
}) 
