import type { ManifestNotificationTypes } from 'api.fluff4.me'
import FormInputLengths from 'model/FormInputLengths'
import Component from 'ui/Component'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import { RadioDropdown } from 'ui/component/core/Dropdown'
import LabelledTable from 'ui/component/core/LabelledTable'
import Textarea from 'ui/component/core/Textarea'
import { QuiltHelper, type Quilt } from 'ui/utility/StringApplicator'
import Objects from 'utility/Objects'
import type State from 'utility/State'

export type ReportReasonTypes = keyof { [TYPE in keyof ManifestNotificationTypes as TYPE extends `report-${infer REASON}` ? REASON : never]: true }

export interface ReportBody<REASONS extends ReportReasonTypes> {
	reason: REASONS
	reason_body: string
}

export type ReportReasons<BODY extends ReportBody<ReportReasonTypes>> = Record<BODY extends ReportBody<infer REASONS> ? REASONS : never, boolean>

// type ReportEndpoint =
// 	EndpointRoutesWithBodies<ReportBody<ReportReasonTypes>> extends infer ROUTES extends keyof Paths
// 	? (
// 		{ [ROUTE in ROUTES]: Endpoint<ROUTE> } extends infer ENDPOINTS
// 		? ENDPOINTS[keyof ENDPOINTS]
// 		: never
// 	)
// 	: never

export interface ReportDefinition<BODY extends ReportBody<ReportReasonTypes>> {
	titleTranslation: Quilt.SimpleKey
	reasons: ReportReasons<BODY>
}

export function ReportDefinition<BODY extends ReportBody<ReportReasonTypes>> (definition: ReportDefinition<BODY>): ReportDefinition<BODY> {
	return definition
}

export interface ReportInstance<BODY extends ReportBody<ReportReasonTypes>> {
	reportedContentName: string | Quilt.Handler
	onReport (body: BODY): unknown
}

const ReportDialog = Component.Builder(async (component, definition: ReportDefinition<ReportBody<ReportReasonTypes>>, instance: ReportInstance<ReportBody<ReportReasonTypes>>): Promise<ConfirmDialog> => {
	const dialog = await component.and(ConfirmDialog, {
		titleTranslation: quilt => quilt['shared/prompt/report/title'](quilt[definition.titleTranslation]()),
		bodyTranslation: quilt => quilt['shared/prompt/report/body'](QuiltHelper.arg(instance.reportedContentName)),
	})

	const table = LabelledTable().appendTo(dialog.content)

	const reasonDropdown = RadioDropdown()
		.setRequired()
		.tweak(dropdown => {
			for (const [reason, enabled] of Objects.entries(definition.reasons)) {
				if (!enabled)
					continue

				dropdown.add(reason, {
					translation: id => quilt => quilt[`shared/prompt/report/reason/option/${reason}`](),
				})
			}
		})
	table.label(label => label.text.use('shared/prompt/report/reason/label'))
		.content((content, label) => content.append(reasonDropdown.setLabel(label)))

	const details = Textarea()
		.setMaxLength(FormInputLengths.map(table, lengths => lengths?.report?.reason_body))
	table.label(label => label.text.use('shared/prompt/report/details/label'))
		.content((content, label) => content.append(details.setLabel(label)))

	dialog.confirmButton?.event.subscribe('click', () => {
		instance.onReport({
			reason: reasonDropdown.selection.value as ReportReasonTypes,
			reason_body: details.value,
		})
	})

	return dialog
})

export default Object.assign(ReportDialog, {
	prompt: async <BODY extends ReportBody<ReportReasonTypes>> (owner: State.Owner | null, definition: ReportDefinition<BODY>, instance: ReportInstance<BODY>): Promise<boolean> =>
		(await ReportDialog(definition, instance))
			.appendTo(document.body)
			.event.subscribe('close', event =>
				event.host.event.subscribe('transitionend', event =>
					event.host.remove()))
			.await(owner),
})
