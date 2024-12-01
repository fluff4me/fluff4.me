import Component from "ui/Component"
import BlockDialog from "ui/component/core/BlockDialog"
import Button from "ui/component/core/Button"
import type { Quilt } from "ui/utility/StringApplicator"
import State from "utility/State"

interface ConfirmDialogExtensions {
	readonly state: State<boolean | undefined>
	readonly cancelButton: Button
	readonly confirmButton: Button
	await (owner: Component): Promise<boolean>
	cancel (): void
	confirm (): void
}

interface ConfirmDialog extends BlockDialog, ConfirmDialogExtensions { }

interface ConfirmDialogDefinition {
	titleTranslation?: Quilt.SimpleKey | Quilt.Handler
	confirmButtonTranslation?: Quilt.SimpleKey | Quilt.Handler
	cancelButtonTranslation?: Quilt.SimpleKey | Quilt.Handler
}

const ConfirmDialog = Object.assign(
	Component.Builder((component, definition?: ConfirmDialogDefinition): ConfirmDialog => {
		const dialog = component.and(BlockDialog)

		const state = State<boolean | undefined>(undefined)

		dialog.title.text.use(definition?.titleTranslation ?? "shared/prompt/confirm")

		const cancelButton = Button()
			.text.use(definition?.confirmButtonTranslation ?? "shared/action/cancel")
			.appendTo(dialog.footer.right)

		const confirmButton = Button()
			.type("primary")
			.text.use(definition?.confirmButtonTranslation ?? "shared/action/confirm")
			.appendTo(dialog.footer.right)

		return dialog
			.extend<ConfirmDialogExtensions>(dialog => ({
				state,
				cancelButton,
				confirmButton,
				await (owner) {
					state.value = undefined
					dialog.open()
					return new Promise<boolean>(resolve => dialog.state.await(owner, [true, false], resolve))
				},
				cancel () {
					state.value = false
					dialog.close()
				},
				confirm () {
					state.value = true
					dialog.close()
				},
			}))
			.onRooted(dialog => {
				dialog.cancelButton.event.subscribe("click", dialog.cancel)
				dialog.confirmButton.event.subscribe("click", dialog.confirm)
			})
	}),
	{
		prompt: (owner: Component, definition?: ConfirmDialogDefinition): Promise<boolean> =>
			ConfirmDialog(definition)
				.appendTo(document.body)
				.event.subscribe("close", event =>
					event.component.event.subscribe("transitionend", event =>
						event.component.remove()))
				.await(owner),
	},
)

export default ConfirmDialog
