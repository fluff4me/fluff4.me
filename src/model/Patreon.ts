import type { PatreonCampaignTier } from 'api.fluff4.me'
import quilt from 'lang/en-nz'
import { QuiltHelper } from 'ui/utility/StringApplicator'
import { NonNullish } from 'utility/Arrays'
import Functions from 'utility/Functions'

namespace Patreon {

	export function translateTier (tier: PatreonCampaignTier) {
		return quilt['shared/term/patreon-tier']({
			NAME: tier.tier_name,
			PRICE: `$${(tier.amount / 100).toFixed(2)}`,
		})
	}

	export function translateTiers (tierIds: string[], definitions: PatreonCampaignTier[]) {
		const selectedTiers = tierIds
			.map(id => definitions?.find(tier => tier.tier_id === id))
			.filter(NonNullish)
			.sort((a, b) => a.amount - b.amount)

		if (!selectedTiers.length)
			return quilt['view/chapter-edit/shared/form/visibility-patreon-tier/selection/none']()

		if (definitions?.length === selectedTiers.length)
			return quilt['view/chapter-edit/shared/form/visibility-patreon-tier/selection/all']()

		const firstSelectedTier = selectedTiers[0]
		if (definitions?.every(tier => tier.amount <= firstSelectedTier.amount || tierIds.includes(tier.tier_id))) {
			const tierTranslation = translateTier(firstSelectedTier)
			const resolvedTranslation = Functions.resolve(tierTranslation, quilt, QuiltHelper)
			return quilt['view/chapter-edit/shared/form/visibility-patreon-tier/selection/tier-and-up'](resolvedTranslation)
		}

		return undefined
	}
}

export default Patreon
