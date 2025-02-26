import type { AuthService } from 'api.fluff4.me'
import Endpoint from 'endpoint/Endpoint'
import Session from 'model/Session'
import Component from 'ui/Component'
import OAuthService from 'ui/component/auth/OAuthService'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ConfirmDialog from 'ui/component/core/ConfirmDialog'
import Heading from 'ui/component/core/Heading'
import Slot from 'ui/component/core/Slot'
import popup from 'utility/Popup'

export default Component.Builder((component, patreon: AuthService) => {
	const block = component.and(Block)
		.style('view-type-account-patreon-campaign')

	block.title.text.use('view/account/patreon/campaign/title')
	block.description.text.use('view/account/patreon/campaign/description')

	const campaign = Session.Auth.author.map(block, author => author?.patreon_campaign ?? undefined)
	Component()
		.style('view-type-account-patreon-campaign-oauth-row')
		.append(
			OAuthService(patreon,
				{
					authorisationState: campaign,
					async onClick () {
						if (campaign.value)
							await unlink()
						else
							await relink()
						return true
					},
				}),
			Slot()
				.use(campaign, (slot, campaign) => campaign && Button()
					.style('view-type-account-patreon-campaign-oauth-row-relink-button')
					.setIcon('rotate')
					.event.subscribe('click', relink)
				),
		)
		.appendTo(block.content)

	Slot()
		.use(campaign, (slot, campaign) => campaign && Component()
			.style('view-type-account-patreon-campaign-tier-list-wrapper')
			.append(Heading()
				.setAestheticStyle(false)
				.style('view-type-account-patreon-campaign-tier-list-heading')
				.text.use('view/account/patreon/campaign/tiers'))
			.append(Component()
				.style('view-type-account-patreon-campaign-tier-list')
				.append(...campaign.tiers
					.sort((a, b) => a.amount - b.amount)
					.map(tier => Component()
						.style('view-type-account-patreon-campaign-tier')
						.append(Component()
							.style('view-type-account-patreon-campaign-tier-amount')
							.text.set(`$${(tier.amount / 100).toFixed(2)}`))
						.append(Component()
							.style('view-type-account-patreon-campaign-tier-name')
							.text.set(tier.tier_name))
					)))
		)
		.appendTo(block.content)

	return block

	async function relink () {
		await popup('Link Patreon Campaign', Endpoint.path('/auth/patreon/campaign/begin'), 600, 900)
			.then(() => true).catch(err => { console.warn(err); return false })
		await Session.refresh()
	}

	async function unlink () {
		const shouldUnlink = await ConfirmDialog.prompt(component, {
			titleTranslation: 'view/account/patreon/campaign/unlink/title',
			bodyTranslation: 'view/account/patreon/campaign/unlink/description',
			confirmButtonTranslation: 'view/account/patreon/campaign/unlink/confirm',
		})
		if (!shouldUnlink)
			return

		// TODO
		await Session.refresh()
	}
})
