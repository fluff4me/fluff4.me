import Component from "ui/Component"
import Block from "ui/component/core/Block"
import Dialog from "ui/component/core/Dialog"

interface BlockDialogExtensions {
}

interface BlockDialog extends Dialog, Block, BlockDialogExtensions { }

const BlockDialog = Component.Builder((component): BlockDialog => {
	const dialog = component.and(Dialog).and(Block)
		.style("dialog-block")

	return dialog.extend<BlockDialogExtensions>(dialog => ({}))
})

export default BlockDialog
