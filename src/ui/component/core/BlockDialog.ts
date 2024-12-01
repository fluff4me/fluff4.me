import Component from "ui/Component"
import type { BlockExtensions } from "ui/component/core/Block"
import Block from "ui/component/core/Block"
import type { DialogExtensions } from "ui/component/core/Dialog"
import Dialog from "ui/component/core/Dialog"
import type { CanHasActionsMenuButtonExtensions } from "ui/component/core/ext/CanHasActionsMenuButton"
import Task from "utility/Task"

interface BlockDialogExtensions {
}

interface BlockDialog extends Dialog, Block, BlockDialogExtensions { }

const BlockDialog = Component.Builder((component): BlockDialog => {
	const dialog = component.and(Dialog).and(Block)
		.viewTransition()
		.style.remove("block")
	dialog
		.style("dialog-block-wrapper")
		.style.bind(dialog.opened.not, "dialog-block-wrapper--closed")

	const block = Block()
		.style("dialog-block")
		.style.bind(dialog.opened.not, "dialog-block--closed")
		.appendTo(dialog)
	dialog
		.extend<Partial<BlockExtensions & CanHasActionsMenuButtonExtensions>>(dialog => ({
			type: block.type,
			content: block.content,
			setActionsMenu: block.setActionsMenu,
		}))
		.extendJIT("header", () => block.header)
		.extendJIT("title", () => block.title)
		.extendJIT("primaryActions", () => block.primaryActions)
		.extendJIT("description", () => block.description)
		.extendJIT("footer", () => block.footer)
		.extendJIT("actionsMenuButton", () => block.actionsMenuButton)

	const superOpen = dialog.open
	return dialog.extend<BlockDialogExtensions & Partial<DialogExtensions>>(dialog => ({
		open () {
			superOpen()
			block.style("dialog-block--opening")
			void Task.yield().then(() => block.style.remove("dialog-block--opening"))
			return dialog
		},
	}))
})

export default BlockDialog
