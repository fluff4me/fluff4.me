import Component from "ui/Component"
import ActionRow from "ui/component/core/ActionRow"
import Button from "ui/component/core/Button"
import Heading from "ui/component/core/Heading"
import Paragraph from "ui/component/core/Paragraph"
import type { PopoverComponentRegisteredExtensions, PopoverInitialiser } from "ui/component/core/Popover"
import type { ComponentName } from "ui/utility/StyleManipulator"

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
	readonly actionsMenuButton: Button & PopoverComponentRegisteredExtensions
	readonly description: Paragraph
	readonly content: Component
	readonly footer: ActionRow
	readonly type: BlockTypeManipulator<this>

	setActionsMenu (initialiser: PopoverInitialiser<Button>): this
}

interface Block extends Component, BlockExtensions { }

const Block = Component.Builder((component): Block => {
	const types = new Set<BlockType>()

	let header: Component | undefined
	let footer: Component | undefined

	let actionsMenuPopoverInitialiser: PopoverInitialiser<Button> = () => { }

	return component
		.viewTransition("block")
		.style("block")
		.extend<BlockExtensions>(block => ({
			title: undefined!,
			header: undefined!,
			description: undefined!,
			primaryActions: undefined!,
			actionsMenuButton: undefined!,
			content: Component().style("block-content").appendTo(component),
			footer: undefined!,
			type: Object.assign(
				(...newTypes: BlockType[]) => {
					for (const type of newTypes) {
						types.add(type)
						block.style(`block-type-${type}`)
						header?.style(`block-type-${type}-header`)
						footer?.style(`block-type-${type}-footer`)
					}
					return block
				},
				{
					remove (...removeTypes: BlockType[]) {
						for (const type of removeTypes) {
							types.delete(type)
							block.style.remove(`block-type-${type}`)
							header?.style.remove(`block-type-${type}-header`)
							footer?.style.remove(`block-type-${type}-footer`)
						}
						return block
					},
				},
			),
			setActionsMenu (initialiser) {
				actionsMenuPopoverInitialiser = initialiser
				block.actionsMenuButton.setPopover("click", initialiser)
				return block
			},
		}))
		.extendJIT("header", block => header = Component("hgroup")
			.style("block-header", ...[...types].map(t => `block-type-${t}-header` as const))
			.prependTo(block))
		.extendJIT("title", block => Heading().style("block-title").prependTo(block.header))
		.extendJIT("primaryActions", block => Component().style("block-actions-primary").appendTo(block.header))
		.extendJIT("actionsMenuButton", block => Button()
			.style("block-actions-menu-button")
			.setPopover("click", actionsMenuPopoverInitialiser)
			.appendTo(block.primaryActions))
		.extendJIT("description", block => Paragraph().style("block-description").appendTo(block.header))
		.extendJIT("footer", block => footer = ActionRow()
			.style("block-footer", ...[...types].map(t => `block-type-${t}-footer` as const))
			.appendTo(block))
})

export default Block
