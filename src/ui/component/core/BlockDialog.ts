import Component from 'ui/Component'
import type { BlockExtensions } from 'ui/component/core/Block'
import Block from 'ui/component/core/Block'
import type { DialogExtensions } from 'ui/component/core/Dialog'
import Dialog from 'ui/component/core/Dialog'
import type { CanHasActionsMenuExtensions } from 'ui/component/core/ext/CanHasActionsMenu'
import Task from 'utility/Task'

interface BlockDialogExtensions {
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
		.extend<Partial<BlockExtensions & CanHasActionsMenuExtensions>>(dialog => ({
			type: block.type,
			content: block.content,
			setActionsMenu: block.setActionsMenu as never,
			setActionsMenuButton: block.setActionsMenuButton as never,
		}))
		.extendJIT('header', () => block.header)
		.extendJIT('title', () => block.title)
		.extendJIT('primaryActions', () => block.primaryActions)
		.extendJIT('description', () => block.description)
		.extendJIT('footer', () => block.footer)

	const superOpen = dialog.open
	return dialog.extend<BlockDialogExtensions & Partial<DialogExtensions>>(dialog => ({
		open () {
			superOpen()
			block.style('dialog-block--opening')
			void Task.yield().then(() => block.style.remove('dialog-block--opening'))
			return dialog
		},
	}))
})

export default BlockDialog
