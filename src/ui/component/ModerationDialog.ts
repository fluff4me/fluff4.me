import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Button from 'ui/component/core/Button'
import Checkbutton from 'ui/component/core/Checkbutton'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import InfoDialog from 'ui/component/core/InfoDialog'
import Slot from 'ui/component/core/Slot'
import Tabinator, { Tab } from 'ui/component/core/Tabinator'
import { QuiltHelper, type Quilt } from 'ui/utility/StringApplicator'
import Objects from 'utility/Objects'
import type State from 'utility/State'

type CensorKey = keyof { [KEY in keyof Quilt as KEY extends `shared/prompt/moderation/censor/key/${infer KEY}` ? KEY : never]: true }

interface ModerationCensorProperty {
	type: 'plaintext' | 'markdown'
	content?: string | null
}

export interface ModerationCensor<T = unknown> {
	properties: Record<keyof T, ModerationCensorProperty>
	censor (censor: T): unknown
}

export function ModerationCensor<T> (
	censor: keyof T extends CensorKey ? ModerationCensor<T>
		: { 'No translation key for': keyof { [KEY in keyof T as KEY extends CensorKey ? never : KEY]: true } }
): ModerationCensor<T> {
	return censor as ModerationCensor<T>
}

export namespace ModerationCensor {
	export function plaintext (content?: string | null): ModerationCensorProperty {
		return { type: 'plaintext', content }
	}
	export function markdown (content?: string | null): ModerationCensorProperty {
		return { type: 'markdown', content }
	}
}

export interface ModerationDefinitionCustomGeneralSlot {
	type: 'general'
	tweak (slot: Slot): unknown
}

export interface ModerationDefinitionCustomTab {
	type: 'tab'
	tweak (tab: Tab): unknown
}

export interface ModerationDefinition {
	titleTranslation: Quilt.SimpleKey
	moderatedContentName: string | Quilt.Handler
	readonly delete?: () => unknown
	readonly censor?: ModerationCensor
	readonly custom?: (ModerationDefinitionCustomGeneralSlot | ModerationDefinitionCustomTab)[]
}

export function ModerationDefinition<ARGS extends any[]> (definitionSupplier: (...args: ARGS) => ModerationDefinition): { create (...args: ARGS): ModerationDefinition } {
	return { create: definitionSupplier }
}

const ModerationDialog = Component.Builder((component, definition: ModerationDefinition): InfoDialog => {
	const dialog = component.and(InfoDialog, {
		titleTranslation: quilt => quilt['shared/prompt/moderation/title'](quilt[definition.titleTranslation]()),
	})

	dialog.description.text.use(quilt => quilt['shared/prompt/moderation/subtitle'](QuiltHelper.arg(definition.moderatedContentName)))

	dialog.continueButton
		.type.remove('primary')
		.text.use('shared/action/done')

	const tabinator = Tabinator().appendTo(dialog.content)

	const customGeneral = (definition.custom ?? []).filter(custom => custom.type === 'general')
	if (definition.delete || customGeneral.length)
		Tab()
			.text.use('shared/prompt/moderation/tab/general')
			.tweak(tab => tab.content.style('moderation-dialog-general').append(
				...customGeneral
					.map(custom => Slot().style.remove('slot').style('moderation-dialog-general-slot').tweak(custom.tweak)),
				definition.delete && Button()
					.text.use('shared/prompt/moderation/action/delete')
					.event.subscribe('click', async event => {
						const confirmed = await ConfirmDialog.prompt(event.host, {
							bodyTranslation: quilt => quilt['shared/prompt/moderation/action/delete/body'](QuiltHelper.arg(definition.moderatedContentName)),
							dangerToken: 'moderate',
						})
						if (!confirmed)
							return

						definition.delete?.()
					})
			))
			.addTo(tabinator)

	if (definition.censor)
		Tab()
			.text.use('shared/prompt/moderation/tab/censor')
			.tweak(tab => {
				const properties = definition.censor!.properties as Record<CensorKey, ModerationCensorProperty>
				const censor: Record<string, true> = {}

				const censorList = Component()
					.style('moderation-dialog-censor-list')
					.appendTo(tab.content)

				for (const [key, property] of Objects.entries(properties)) {
					if (!property.content)
						continue

					Checkbutton()
						.style('moderation-dialog-censor')
						.setIcon('xmark')
						.append(Component()
							.style('moderation-dialog-censor-key')
							.text.use(`shared/prompt/moderation/censor/key/${key}`)
						)
						.append(Component('blockquote')
							.style('moderation-dialog-censor-content')
							.tweak(body => property.type === 'plaintext'
								? body.text.set(property.content)
								: body.style('moderation-dialog-censor-content--markdown').setMarkdownContent(property.content, 256, true)
							)
						)
						.event.subscribe('SetChecked', (event, checked) => {
							if (checked)
								censor[key] = true
							else
								delete censor[key]
						})
						.appendTo(censorList)
				}

				const censorActions = ActionRow().appendTo(tab.content)
				Button()
					.type('primary')
					.text.use('shared/prompt/moderation/action/censor')
					.event.subscribe('click', async event => {
						const confirmed = await ConfirmDialog.prompt(event.host, {
							bodyTranslation: quilt => quilt['shared/prompt/moderation/action/censor/body'](QuiltHelper.arg(definition.moderatedContentName), Object.keys(properties)),
							dangerToken: 'moderate',
						})
						if (!confirmed)
							return

						definition.censor?.censor(censor)
					})
					.appendTo(censorActions.right)
			})
			.addTo(tabinator)

	return dialog
})

export default Object.assign(ModerationDialog, {
	prompt: async (owner: State.Owner | null, definition: ModerationDefinition): Promise<boolean> =>
		ModerationDialog(definition)
			.appendTo(document.body)
			.event.subscribe('close', event =>
				event.host.event.subscribe('transitionend', event =>
					event.host.remove()))
			.await(owner),
})
