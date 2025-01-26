import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import CanHasActionsMenuButton from 'ui/component/core/ext/CanHasActionsMenuButton'
import Heading from 'ui/component/core/Heading'
import Paragraph from 'ui/component/core/Paragraph'
import type { ComponentName } from 'ui/utility/StyleManipulator'
import TypeManipulator from 'ui/utility/TypeManipulator'
import State from 'utility/State'

type BlockType = keyof { [KEY in ComponentName as KEY extends `block-type-${infer TYPE}--${string}` ? TYPE
	: KEY extends `block-type-${infer TYPE}-${string}` ? TYPE
	: KEY extends `block-type-${infer TYPE}` ? TYPE
	: never]: string[] }

export interface BlockExtensions {
	readonly header: Component
	readonly title: Heading
	readonly primaryActions: Component
	readonly description: Paragraph
	readonly content: Component
	readonly footer: ActionRow
	readonly type: TypeManipulator<this, BlockType>
}

export enum BlockClasses {
	Main = '$block',
}

interface Block extends Component, BlockExtensions, CanHasActionsMenuButton { }

const Block = Component.Builder((component): Block => {
	const types = State(new Set<BlockType>())

	let header: Component | undefined
	let footer: Component | undefined

	const block = component
		.classes.add(BlockClasses.Main)
		.viewTransition('block')
		.style('block')
		.extend<BlockExtensions>(block => ({
			title: undefined!,
			header: undefined!,
			description: undefined!,
			primaryActions: undefined!,
			content: Component().style('block-content').appendTo(component),
			footer: undefined!,
			type: TypeManipulator(block,
				newTypes => {
					for (const type of newTypes) {
						block.style(`block-type-${type}`)
						header?.style(`block-type-${type}-header`)
						footer?.style(`block-type-${type}-footer`)
					}
				},
				oldTypes => {
					for (const type of oldTypes) {
						block.style.remove(`block-type-${type}`)
						header?.style.remove(`block-type-${type}-header`)
						footer?.style.remove(`block-type-${type}-footer`)
					}
				},
			),
		}))
		.extendJIT('header', block => header = Component('hgroup')
			.style('block-header', ...[...types.value].map(t => `block-type-${t}-header` as const))
			.prependTo(block))
		.extendJIT('title', block => Heading().style('block-title').prependTo(block.header))
		.extendJIT('primaryActions', block => Component().style('block-actions-primary').appendTo(block.header))
		.extendJIT('description', block => Paragraph().style('block-description').appendTo(block.header))
		.extendJIT('footer', block => footer = ActionRow()
			.style('block-footer', ...[...types.value].map(t => `block-type-${t}-footer` as const))
			.appendTo(block))

	return block
		.and(CanHasActionsMenuButton, button => button.appendTo(block.primaryActions))
})

export default Block
