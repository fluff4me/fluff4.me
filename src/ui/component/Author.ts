import type { AuthorFull } from "api.fluff4.me"
import Component from "ui/Component"
import Block from "ui/component/core/Block"
import ExternalLink from "ui/component/core/ExternalLink"
import Slot from "ui/component/core/Slot"

export default Component.Builder((component, author: AuthorFull) => {
	component
		.viewTransition("author")
		.style("author")

	const block = component.and(Block)
	block.title
		.style("author-name")
		.text.set(author.name)
	block.description
		.append(Component()
			.style("author-vanity")
			.text.set(`@${author.vanity}`))
		.append(Slot.using(author.pronouns, (slot, pronouns) => pronouns && slot
			.text.append(" · ")
			.append(Component()
				.style("author-pronouns")
				.text.set(pronouns))))

	Component()
		.style("author-description")
		.append(Slot.using(author.description.body, (slot, body) => {
			if (body)
				slot.setMarkdownContent(body)
			else
				slot.style("placeholder").text.use("author/description/empty")
		}))
		.appendTo(block.content)

	if (author.support_link && author.support_message)
		ExternalLink(author.support_link)
			.style("author-support-link")
			.text.set(author.support_message)
			.appendTo(block.content)

	return block
}) 
