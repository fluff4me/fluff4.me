import type { Author } from "api.fluff4.me"
import Component from "ui/Component"
import Block from "ui/component/core/Block"

export default Component.Builder((component, author: Author) => {
	const block = component.and(Block)
	block.title.text.set(author.name)
	block.description.text.set(`@${author.vanity}`)
	return block
}) 
