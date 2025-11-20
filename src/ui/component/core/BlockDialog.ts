import Component from 'ui/Component'
import type { BlockExtensions } from 'ui/component/core/Block'
import Block from 'ui/component/core/Block'
import type { DialogExtensions } from 'ui/component/core/Dialog'
import Dialog from 'ui/component/core/Dialog'
import Task from 'utility/Task'

interface BlockDialogExtensions {
	readonly block: Block
}

interface BlockDialog extends Dialog, Block, BlockDialogExtensions { }

const BlockDialog = Component.Builder((component): BlockDialog => {
	const dialog = component.and(Dialog).and(Block)
		.viewTransition(false)
		.style.remove('block')
	dialog
		.style('dialog-block-wrapper')
		.style.bind(dialog.opened.not, 'dialog-block-wrapper--closed')

	const block = Block()
		.style('dialog-block')
		.style.bind(dialog.opened.not, 'dialog-block--closed')
		.appendTo(dialog)
	dialog
		.extend<Partial<BlockExtensions>>(dialog => ({
			content: block.content,
		}))
		.extendJIT('header', () => block.header)
		.extendJIT('title', () => block.title)
		.extendJIT('primaryActions', () => block.primaryActions)
		.extendJIT('description', () => block.description)
		.extendJIT('footer', () => block.footer)

	const superOpen = dialog.open
	return dialog.extend<BlockDialogExtensions & Partial<DialogExtensions>>(dialog => ({
		block,
		open () {
			superOpen()
			block.style('dialog-block--opening')
			dialog.style('dialog-block-wrapper--opening')
			void Task.yield().then(() => {
				block.style.remove('dialog-block--opening')
				dialog.style.remove('dialog-block-wrapper--opening')
			})
			return dialog
		},
	}))
})

export default BlockDialog
