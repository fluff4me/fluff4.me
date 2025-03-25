import type { DangerTokenType } from 'model/DangerToken'
import DangerToken from 'model/DangerToken'
import Session from 'model/Session'
import Component from 'ui/Component'
import type OAuthServicesType from 'ui/component/auth/OAuthServices'
import BlockDialog from 'ui/component/core/BlockDialog'
import Button from 'ui/component/core/Button'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import { QuiltHelper, type Quilt } from 'ui/utility/StringApplicator'
import Errors from 'utility/Errors'
import State from 'utility/State'

let OAuthServices: typeof OAuthServicesType

interface ConfirmDialogExtensions {
	readonly state: State<boolean | undefined>
	readonly cancelButton?: Button
	readonly confirmButton?: Button
	readonly body?: Paragraph
	readonly dangerTokenAuthWrapper?: Component
	await (owner: State.Owner | null): Promise<boolean>
	cancel (): void
	confirm (): void
}

interface ConfirmDialog extends BlockDialog, ConfirmDialogExtensions { }

interface ConfirmDialogDefinition {
	dangerToken?: DangerTokenType
	titleTranslation?: Quilt.SimpleKey | Quilt.Handler
	bodyTranslation?: Quilt.SimpleKey | Quilt.Handler
	confirmButtonTranslation?: Quilt.SimpleKey | Quilt.Handler | false
	cancelButtonTranslation?: Quilt.SimpleKey | Quilt.Handler | false
	tweak?(dialog: ConfirmDialog): unknown
}

interface ConfirmDialogDefinitionWithDangerToken extends ConfirmDialogDefinition {
	dangerToken: DangerTokenType
}

interface ConfirmDialogDefinitionWithBodyTranslation extends ConfirmDialogDefinition {
	bodyTranslation: Quilt.SimpleKey | Quilt.Handler
}

const ConfirmDialog = Object.assign(
	Component.Builder(async (component, definition?: ConfirmDialogDefinition): Promise<ConfirmDialog> => {
		const dialog = component.and(BlockDialog)
			.style('confirm-dialog')

		if (definition?.cancelButtonTranslation === false && definition.confirmButtonTranslation === false)
			throw Errors.create('At least one ConfirmDialog button must be enabled')

		const state = State<boolean | undefined>(undefined)

		dialog.title.text.use(definition?.titleTranslation ?? 'shared/prompt/confirm')

		const body = !definition?.bodyTranslation ? undefined
			: Component()
				.style('confirm-dialog-body')
				.setMarkdownContent({ body: QuiltHelper.toString(definition.bodyTranslation) })
				.appendTo(dialog.content)

		const cancelButton = definition?.cancelButtonTranslation === false ? undefined
			: Button()
				.text.use(definition?.cancelButtonTranslation ?? 'shared/action/cancel')
				.appendTo(dialog.footer.right)

		const confirmButton = definition?.confirmButtonTranslation === false ? undefined
			: Button()
				.type('primary')
				.text.use(definition?.confirmButtonTranslation ?? 'shared/action/confirm')
				.appendTo(dialog.footer.right)

		let dangerTokenAuthWrapper: Component | undefined
		if (definition?.dangerToken && !DangerToken.canUse(definition.dangerToken)) {
			confirmButton?.setDisabled(true, 'danger-token')

			dangerTokenAuthWrapper = Component()
				.appendTo(dialog.content)

			Paragraph().and(Placeholder)
				.style('confirm-dialog-danger-token-hint')
				.text.use('shared/prompt/reauth')
				.appendTo(dangerTokenAuthWrapper)

			const authServices = await OAuthServices(Session.Auth.state, definition.dangerToken)
			authServices
				.event.subscribe('DangerTokenGranted', () => confirmButton?.setDisabled(false, 'danger-token'))
				.appendTo(dangerTokenAuthWrapper)
		}

		const confirmDialog = dialog
			.extend<ConfirmDialogExtensions>(dialog => ({
				state,
				cancelButton,
				confirmButton,
				body,
				dangerTokenAuthWrapper,
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
				dialog.cancelButton?.event.subscribe('click', dialog.confirmButton ? dialog.cancel : dialog.confirm)
				dialog.confirmButton?.event.subscribe('click', dialog.confirm)
			})

		await definition?.tweak?.(confirmDialog)
		return confirmDialog
	}),
	{
		prompt: async (owner: State.Owner | null, definition: ConfirmDialogDefinitionWithBodyTranslation): Promise<boolean> =>
			(await ConfirmDialog(definition))
				.appendTo(document.body)
				.event.subscribe('close', event =>
					event.host.event.subscribe('transitionend', event =>
						event.host.remove()))
				.await(owner),

		ensureDangerToken: async (owner: State.Owner | null, definition: ConfirmDialogDefinitionWithDangerToken): Promise<boolean> =>
			DangerToken.canUse(definition.dangerToken)
				? true
				: (await ConfirmDialog(definition))
					.appendTo(document.body)
					.event.subscribe('close', event =>
						event.host.event.subscribe('transitionend', event =>
							event.host.remove()))
					.await(owner),

		setOauthServicesComponent (component: typeof OAuthServicesType) {
			OAuthServices = component
		},
	},
)

export default ConfirmDialog
