import Component from "ui/Component"
import Heading from "ui/component/Heading"
import Paragraph from "ui/component/Paragraph"
import ViewTransition from "ui/view/component/ViewTransition"
import Define from "utility/Define"

interface BlockExtensions {
	readonly header: Component
	readonly title: Heading
	readonly description: Paragraph
}

interface Block extends Component, BlockExtensions { }

const Block = Component.Builder((component): Block => {
	return component
		.and(ViewTransition.Has)
		.style("block")
		.extend<BlockExtensions>(() => ({
			title: undefined!,
			header: undefined!,
			description: undefined!,
		}))
		.extendMagic("header", block => ({
			get: () => {
				const header = Component().style("block-header").prependTo(block)
				Define.set(block, "header", header)
				return header
			},
		}))
		.extendMagic("title", block => ({
			get: () => {
				const title = Heading().style("block-title").prependTo(block.header)
				Define.set(block, "title", title)
				return title
			},
		}))
		.extendMagic("description", block => ({
			get: () => {
				const description = Paragraph().style("block-description").appendTo(block.header)
				Define.set(block, "description", description)
				return description
			},
		}))
})

export default Block
