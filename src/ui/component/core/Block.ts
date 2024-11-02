import Component from "ui/Component"
import Heading from "ui/component/core/Heading"
import Paragraph from "ui/component/core/Paragraph"
import ViewTransition from "ui/view/component/ViewTransition"

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
		.extendJIT("header", block => Component("hgroup").style("block-header").prependTo(block))
		.extendJIT("title", block => Heading().style("block-title").prependTo(block.header))
		.extendJIT("description", block => Paragraph().style("block-description").appendTo(block.header))
})

export default Block
