import type { PatreonCampaignTier } from 'api.fluff4.me'
import quilt from 'lang/en-nz'
import type { Quilt } from 'ui/utility/StringApplicator'
import { QuiltHelper } from 'ui/utility/StringApplicator'
import { NonNullish } from 'utility/Arrays'
import Functions from 'utility/Functions'

namespace Patreon {

	export function getMoreRestrictive (a?: PatreonCampaignTier[], b?: PatreonCampaignTier[]): PatreonCampaignTier[] {
		if (!a?.length) return b || []
		if (!b?.length) return a || []

		const aMin = Math.min(...a.map(tier => tier.amount))
		const bMin = Math.min(...b.map(tier => tier.amount))
		return aMin > bMin ? a : b
	}

	export function translateTier (tier: PatreonCampaignTier): Quilt.Handler {
		return quilt => quilt['shared/term/patreon-tier']({
			NAME: tier.tier_name,
			PRICE: `$${(tier.amount / 100).toFixed(2)}`,
		})
	}

	export function translateTiers (tierIds: string[], definitions: PatreonCampaignTier[]): Quilt.Handler | undefined {
		const selectedTiers = tierIds
			.map(id => definitions?.find(tier => tier.tier_id === id))
			.filter(NonNullish)
			.sort((a, b) => a.amount - b.amount)

		if (!selectedTiers.length)
			return quilt => quilt['shared/form/visibility-patreon-tier/selection/none']()

		if (definitions?.length === selectedTiers.length)
			return quilt => quilt['shared/form/visibility-patreon-tier/selection/all']()

		const firstSelectedTier = selectedTiers[0]
		if (definitions?.every(tier => tier.amount <= firstSelectedTier.amount || tierIds.includes(tier.tier_id))) {
			const tierTranslation = translateTier(firstSelectedTier)
			const resolvedTranslation = Functions.resolve(tierTranslation, quilt, QuiltHelper)
			return quilt => quilt['shared/form/visibility-patreon-tier/selection/tier-and-up'](resolvedTranslation)
		}

		return undefined
	}
}

export default Patreon
