import type { ChapterVisibility, WorkVisibility } from 'api.fluff4.me'
import Patreon from 'model/Patreon'
import Session from 'model/Session'
import { CheckDropdown } from 'ui/component/core/Dropdown'
import type LabelledTable from 'ui/component/core/LabelledTable'
import type RadioButton from 'ui/component/core/RadioButton'
import RadioRow from 'ui/component/core/RadioRow'
import State from 'utility/State'

type Visibility = WorkVisibility | ChapterVisibility

interface VisibilityOptions {
	readonly visibility: RadioRow<Visibility>
	readonly patreonTiers: CheckDropdown<string>
}

export interface VisibilityDataHost {
	visibility: Visibility
	patreonTiers?: string[] | null
}

function VisibilityOptions (table: LabelledTable, state: State<VisibilityDataHost | undefined>): VisibilityOptions {
	const VisibilityRadioInitialiser = (radio: RadioButton, id: Visibility) => radio
		.style('visibility-options-option')
		.text.use(`shared/form/visibility/${id.toLowerCase() as Lowercase<Visibility>}`)

	const campaign = Session.Auth.account.map(table, author => author?.patreon_campaign)
	const visibility = RadioRow()
		.add('Public', VisibilityRadioInitialiser)
		.add('Patreon', (radio, id) => radio
			.tweak(VisibilityRadioInitialiser, id)
			.style('visibility-options-option-patreon')
			.style.bind(campaign.falsy, 'radio-row-option--hidden'))
		.add('Private', VisibilityRadioInitialiser)
		.default.bind(state.map(table, chapter => chapter?.visibility ?? 'Private'))
	table.label(label => label.text.use('shared/form/visibility/label'))
		.content((content, label) => content.append(visibility.setLabel(label)))

	const visibilityStateIsPatreon = visibility.selection.map(table, selection => selection === 'Patreon')
	const tiers = State.Use(table, { campaign, visibilityStateIsPatreon })
		.map(table, ({ campaign, visibilityStateIsPatreon }) =>
			campaign && visibilityStateIsPatreon ? campaign.tiers : undefined)

	const patreonTiers = CheckDropdown<string>({
		translateSelection (dropdown, selection) {
			return Patreon.translateTiers(selection, tiers.value ?? [])
		},
	})
	table.label(label => label.text.use('shared/form/visibility-patreon-tier/label'))
		.if(tiers.truthy)
		.content((content, label) => content.append(
			patreonTiers.tweak(dropdown => {
				tiers.use(dropdown, tiers => {
					dropdown.clear()
					for (const tier of tiers ?? [])
						dropdown.add(tier.tier_id, {
							translation: id => quilt => quilt['shared/term/patreon-tier']({
								NAME: tier.tier_name,
								PRICE: `$${(tier.amount / 100).toFixed(2)}`,
							}),
						})
				})

				dropdown.selection.subscribeManual((selection, oldSelection) => {
					if (oldSelection?.length || selection?.length !== 1)
						return

					const selectedTier = tiers.value?.find(tier => tier.tier_id === selection[0])
					if (!selectedTier)
						return

					const higherTiers = tiers.value?.filter(tier => tier.amount > selectedTier.amount).sort((a, b) => a.amount - b.amount)
					if (higherTiers?.length)
						dropdown.selection.value = [...selection, ...higherTiers.map(tier => tier.tier_id)]
				})
			})
				.default.bind(state.map(table, chapter => chapter?.patreonTiers ?? []))
				.setLabel(label)
		))

	return {
		visibility,
		patreonTiers,
	}
}

export default VisibilityOptions
