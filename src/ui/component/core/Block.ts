import Component from "ui/Component"
import ActionRow from "ui/component/core/ActionRow"
import Heading from "ui/component/core/Heading"
import Paragraph from "ui/component/core/Paragraph"
import type { ComponentName } from "ui/utility/StyleManipulator"
import ViewTransition from "ui/view/shared/ext/ViewTransition"

type BlockType = keyof { [KEY in ComponentName as KEY extends `block-type-${infer TYPE}--${string}` ? TYPE
	: KEY extends `block-type-${infer TYPE}-${string}` ? TYPE
	: KEY extends `block-type-${infer TYPE}` ? TYPE
	: never]: string[] }

interface BlockTypeManipulator<HOST> {
	(...buttonTypes: BlockType[]): HOST
	remove (...buttonTypes: BlockType[]): HOST
}

interface BlockExtensions {
	readonly header: Component
	readonly title: Heading
	readonly primaryActions: Component
	readonly description: Paragraph
	readonly content: Component
	readonly footer: ActionRow
	readonly type: BlockTypeManipulator<this>
}

interface Block extends Component, BlockExtensions { }

const Block = Component.Builder((component): Block => {
	const types = new Set<BlockType>()

	let header: Component | undefined

	return component
		.and(ViewTransition.Has)
		.style("block")
		.extend<BlockExtensions>(block => ({
			title: undefined!,
			header: undefined!,
			description: undefined!,
			primaryActions: undefined!,
			content: Component().style("block-content").appendTo(component),
			footer: undefined!,
			type: Object.assign(
				(...newTypes: BlockType[]) => {
					for (const type of newTypes) {
						types.add(type)
						block.style(`block-type-${type}`)
						header?.style(`block-type-${type}-header`)
					}
					return block
				},
				{
					remove (...removeTypes: BlockType[]) {
						for (const type of removeTypes) {
							types.delete(type)
							block.style.remove(`block-type-${type}`)
							header?.style.remove(`block-type-${type}-header`)
						}
						return block
					},
				},
			),
		}))
		.extendJIT("header", block => header = Component("hgroup")
			.style("block-header", ...[...types].map(t => `block-type-${t}-header` as const))
			.prependTo(block))
		.extendJIT("title", block => Heading().style("block-title").prependTo(block.header))
		.extendJIT("primaryActions", block => Component().style("block-actions-primary").appendTo(block.header))
		.extendJIT("description", block => Paragraph().style("block-description").appendTo(block.header))
		.extendJIT("footer", block => ActionRow().style("block-footer").appendTo(block))
})

export default Block
