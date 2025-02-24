import type { DangerTokenType } from 'model/Session'
import Session from 'model/Session'
import Component from 'ui/Component'
import OAuthServices from 'ui/component/auth/OAuthServices'
import BlockDialog from 'ui/component/core/BlockDialog'
import Button from 'ui/component/core/Button'
import Paragraph from 'ui/component/core/Paragraph'
import { QuiltHelper, type Quilt } from 'ui/utility/StringApplicator'
import State from 'utility/State'

interface ConfirmDialogExtensions {
	readonly state: State<boolean | undefined>
	readonly cancelButton: Button
	readonly confirmButton: Button
	await (owner: Component | null): Promise<boolean>
	cancel (): void
	confirm (): void
}

interface ConfirmDialog extends BlockDialog, ConfirmDialogExtensions { }

interface ConfirmDialogDefinition {
	dangerToken?: DangerTokenType
	titleTranslation?: Quilt.SimpleKey | Quilt.Handler
	bodyTranslation?: Quilt.SimpleKey | Quilt.Handler
	confirmButtonTranslation?: Quilt.SimpleKey | Quilt.Handler
	cancelButtonTranslation?: Quilt.SimpleKey | Quilt.Handler
}

const ConfirmDialog = Object.assign(
	Component.Builder(async (component, definition?: ConfirmDialogDefinition): Promise<ConfirmDialog> => {
		const dialog = component.and(BlockDialog)

		const state = State<boolean | undefined>(undefined)

		dialog.title.text.use(definition?.titleTranslation ?? 'shared/prompt/confirm')

		if (definition?.bodyTranslation)
			Component()
				.setMarkdownContent({ body: QuiltHelper.toString(definition.bodyTranslation) })
				.appendTo(dialog.content)

		const cancelButton = Button()
			.text.use(definition?.cancelButtonTranslation ?? 'shared/action/cancel')
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
				.event.subscribe('DangerTokenGranted', () => confirmButton.setDisabled(false, 'danger-token'))
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
					return new Promise<boolean>(resolve => owner
						? dialog.state.await(owner, [true, false], resolve)
						: dialog.state.awaitManual([true, false], resolve)
					)
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
		prompt: async (owner: Component | null, definition?: ConfirmDialogDefinition): Promise<boolean> =>
			(await ConfirmDialog(definition))
				.appendTo(document.body)
				.event.subscribe('close', event =>
					event.host.event.subscribe('transitionend', event =>
						event.host.remove()))
				.await(owner),
	},
)

export default ConfirmDialog
