import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import CanHasActionsMenu from 'ui/component/core/ext/CanHasActionsMenu'
import Heading from 'ui/component/core/Heading'
import Link from 'ui/component/core/Link'
import Paragraph from 'ui/component/core/Paragraph'
import type { ComponentName } from 'ui/utility/StyleManipulator'
import TypeManipulator from 'ui/utility/TypeManipulator'
import type { StateOr, UnsubscribeState } from 'utility/State'
import State from 'utility/State'

type BlockType = keyof { [KEY in ComponentName as KEY extends `block--type-${infer TYPE}--${string}` ? TYPE
	: KEY extends `block--type-${infer TYPE}-${string}` ? TYPE
	: KEY extends `block--type-${infer TYPE}` ? TYPE
	: never]: string[] }

interface BlockHeader extends Component, CanHasActionsMenu { }

export interface BlockExtensions {
	readonly header: BlockHeader
	readonly title: Heading
	readonly primaryActions: Component
	readonly description: Paragraph
	readonly content: Component
	readonly footer: ActionRow
	readonly type: TypeManipulator<this, BlockType>
	useGradient (gradient?: StateOr<readonly number[] | null | undefined>): this
}

export enum BlockClasses {
	Main = '_block',
	Header = '_block-header',
}

interface Block extends Component, BlockExtensions, CanHasActionsMenu { }

const Block = Component.Builder((component): Block => {
	let header: Component | undefined
	let footer: Component | undefined

	let unuseGradient: UnsubscribeState | undefined
	const isLink = component.supers.mapManual(() => component.is(Link))
	const block = component
		.classes.add(BlockClasses.Main)
		.viewTransition('block')
		.style('block')
		.style.bind(isLink, 'block--link')
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
						block.style(`block--type-${type}`)
						header?.style(`block--type-${type}-header`)
						footer?.style(`block--type-${type}-footer`)
					}
				},
				oldTypes => {
					for (const type of oldTypes) {
						block.style.remove(`block--type-${type}`)
						header?.style.remove(`block--type-${type}-header`)
						footer?.style.remove(`block--type-${type}-footer`)
					}
				},
			),
			useGradient (gradient) {
				unuseGradient?.()
				unuseGradient = State.get(gradient).use(block, stops => block
					.style.toggle(!!stops?.length, 'block--gradient')
					.style.setVariable('block-gradient', !stops?.length ? undefined
						: `${(stops
							.map(colour => `#${colour.toString(16).padStart(6, '0')}`)
							.map(colour => `light-dark(
							oklch(from ${colour} max(var(--block-gradient-light-max), L) C H),
							oklch(from ${colour} min(var(--block-gradient-dark-min), L) C H)
						)`)
							.join(', ')
						)}`)
				)
				return block
			},
		}))
		.tweak(block => block
			.style.bindFrom(State.MapManual([isLink, block.type.state], (link, types) =>
				[...types].map((t): ComponentName => `block${link ? '--link' : ''}--type-${t}`)))
		)
		.extendJIT('header', block => header = Component('hgroup')
			.style('block-header')
			.style.bindFrom(block.type.state.mapManual(types => [...types].map(t => `block--type-${t}-header` as const)))
			.classes.add(BlockClasses.Header)
			.prependTo(block)
			.and(CanHasActionsMenu, actionsMenu => actionsMenu
				.subscribeReanchor((actionsMenu, isTablet) => {
					if (isTablet)
						return

					actionsMenu.anchor.reset()
						.anchor.add('off right', 'centre')
						.anchor.add('off right', 'centre')
						.anchor.orElseHide()
				})
			)
			.setActionsMenuButton(button => button
				.style('block-actions-menu-button')
				.appendTo(block.primaryActions))
		)
		.extendJIT('title', block => Heading().style('block-title').prependTo(block.header))
		.extendJIT('primaryActions', block => Component().style('block-actions-primary').appendTo(block.header))
		.extendJIT('description', block => Paragraph().style('block-description').appendTo(block.header))
		.extendJIT('footer', block => footer = ActionRow()
			.style('block-footer')
			.style.bindFrom(block.type.state.mapManual(types => [...types].map(t => `block--type-${t}-footer` as const)))
			.appendTo(block))

	return block
		.and(CanHasActionsMenu, actionsMenu => actionsMenu
			.subscribeReanchor((actionsMenu, isTablet) => {
				if (isTablet)
					return

				actionsMenu.anchor.reset()
					.anchor.add('off right', 'centre', `>> .${BlockClasses.Header}`)
					.anchor.add('off right', 'centre', `.${BlockClasses.Main}`)
					.anchor.orElseHide()
			})
		)
		.setActionsMenuButton(button => button
			.style('block-actions-menu-button')
			.appendTo(block.primaryActions))
})

export default Block
