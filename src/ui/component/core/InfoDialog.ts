import Component from 'ui/Component'
import BlockDialog from 'ui/component/core/BlockDialog'
import Button from 'ui/component/core/Button'
import { QuiltHelper, type Quilt } from 'ui/utility/StringApplicator'
import State from 'utility/State'

interface InfoDialogExtensions {
	readonly state: State<boolean | undefined>
	readonly continueButton: Button
	await (owner: State.Owner | null): Promise<boolean>
	continue (): void
}

interface InfoDialog extends BlockDialog, InfoDialogExtensions { }

interface InfoDialogDefinition {
	titleTranslation: Quilt.SimpleKey | Quilt.Handler
	bodyTranslation?: Quilt.SimpleKey | Quilt.Handler
	continueButtonTranslation?: Quilt.SimpleKey | Quilt.Handler
}

const InfoDialog = Object.assign(
	Component.Builder((component, definition: InfoDialogDefinition): InfoDialog => {
		const dialog = component.and(BlockDialog)

		const state = State<boolean | undefined>(undefined)

		dialog.title.text.use(definition?.titleTranslation)

		if (definition?.bodyTranslation)
			Component()
				.setMarkdownContent({ body: QuiltHelper.toString(definition.bodyTranslation) })
				.appendTo(dialog.content)

		const continueButton = Button()
			.type('primary')
			.text.use(definition?.continueButtonTranslation ?? 'shared/action/continue')
			.appendTo(dialog.footer.right)

		return dialog
			.extend<InfoDialogExtensions>(dialog => ({
				state,
				continueButton,
				await (owner) {
					state.value = undefined
					dialog.open()
					return new Promise<boolean>(resolve => owner
						? dialog.state.match(owner, [true, false], resolve)
						: dialog.state.matchManual([true, false], resolve)
					)
				},
				continue () {
					state.value = true
					dialog.close()
				},
			}))
			.onRooted(dialog => {
				dialog.continueButton.event.subscribe('click', dialog.continue)
			})
	}),
	{
		prompt: async (owner: Component | null, definition: InfoDialogDefinition): Promise<boolean> =>
			InfoDialog(definition)
				.appendTo(document.body)
				.event.subscribe('close', event =>
					event.host.event.subscribe('transitionend', event =>
						event.host.remove()))
				.await(owner),
	},
)

export default InfoDialog
