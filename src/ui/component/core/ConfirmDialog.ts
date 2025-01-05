import type { DangerTokenType } from 'model/Session'
import Session from 'model/Session'
import Component from 'ui/Component'
import BlockDialog from 'ui/component/core/BlockDialog'
import Button from 'ui/component/core/Button'
import Paragraph from 'ui/component/core/Paragraph'
import OAuthServices from 'ui/component/OAuthServices'
import type { Quilt } from 'ui/utility/StringApplicator'
import State from 'utility/State'

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
	dangerToken?: DangerTokenType
	titleTranslation?: Quilt.SimpleKey | Quilt.Handler
	confirmButtonTranslation?: Quilt.SimpleKey | Quilt.Handler
	cancelButtonTranslation?: Quilt.SimpleKey | Quilt.Handler
}

const ConfirmDialog = Object.assign(
	Component.Builder(async (component, definition?: ConfirmDialogDefinition): Promise<ConfirmDialog> => {
		const dialog = component.and(BlockDialog)

		const state = State<boolean | undefined>(undefined)

		dialog.title.text.use(definition?.titleTranslation ?? 'shared/prompt/confirm')

		const cancelButton = Button()
			.text.use(definition?.confirmButtonTranslation ?? 'shared/action/cancel')
			.appendTo(dialog.footer.right)

		const confirmButton = Button()
			.type('primary')
			.text.use(definition?.confirmButtonTranslation ?? 'shared/action/confirm')
			.appendTo(dialog.footer.right)

		if (definition?.dangerToken) {
			confirmButton.setDisabled(true, 'danger-token')

			Paragraph()
				.text.use('shared/prompt/reauth')
				.appendTo(dialog.content)

			const authServices = await OAuthServices(Session.Auth.state, definition.dangerToken)
			authServices
				.event.subscribe('dangerTokenGranted', () => confirmButton.setDisabled(false, 'danger-token'))
				.appendTo(dialog.content)
		}

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
				dialog.cancelButton.event.subscribe('click', dialog.cancel)
				dialog.confirmButton.event.subscribe('click', dialog.confirm)
			})
	}),
	{
		prompt: async (owner: Component, definition?: ConfirmDialogDefinition): Promise<boolean> =>
			(await ConfirmDialog(definition))
				.appendTo(document.body)
				.event.subscribe('close', event =>
					event.component.event.subscribe('transitionend', event =>
						event.component.remove()))
				.await(owner),
	},
)

export default ConfirmDialog
