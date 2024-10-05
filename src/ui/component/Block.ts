import Component from "ui/Component"
import Heading from "ui/component/Heading"
import Define from "utility/Define"

interface BlockExtensions {
	readonly title: Heading
}

interface Block extends Component, BlockExtensions { }

const Block = Component.Builder((component): Block => {
	return component
		.style("block")
		.extend<BlockExtensions>(() => ({
			title: undefined!,
		}))
		.extendMagic("title", block => ({
			get: () => {
				const title = Heading().prependTo(block)
				Define.set(block, "title", title)
				return title
			},
		}))
})

export default Block
