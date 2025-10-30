import SiteStatus from 'model/SiteStatus'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import Link from 'ui/component/core/Link'
import Slot from 'ui/component/core/Slot'
import FundraiserBar from 'ui/component/FundraiserBar'
import PageListener from 'ui/utility/PageListener'
import Env from 'utility/Env'
import State from 'utility/State'
import Store from 'utility/Store'
import Time from 'utility/Time'

interface SiteStatusListenerData {
	dismissed: boolean
	lastActive: number
}

declare module 'utility/Store' {
	interface ILocalStorage {
		status: SiteStatusListenerData
	}
}

namespace SiteStatusListener {
	const bannerState = State<boolean>(!(Store.items.status?.dismissed ?? false))

	export function listen () {
		setActive()

		PageListener.visible.subscribeManual(setActive)
		navigate.state.subscribeManual(setActive)

		bannerState.useManual(async shown => {
			if (!shown)
				return

			if (Env.isDev)
				return

			await SiteStatus.getManifest()
			await banner.queue(banner => {
				banner.body.style('view-type-fundraiser-banner')
				Slot().appendTo(banner.body).use(SiteStatus, (slot, status) => {
					const fundraiser = status?.fundraisers[0]
					if (!fundraiser)
						return

					Link('/fundraiser')
						.text.use('fundraiser/title')
						.event.subscribe('Navigate', () => { banner.dismiss() })
						.appendTo(slot)

					Component()
						.style('view-type-fundraiser-progress-bar-wrapper')
						.append(FundraiserBar(fundraiser.monthly_income, 100000, 'monthly'))
						.append(FundraiserBar(fundraiser.funds_raised, fundraiser.thresholds[0], 'total')
							.style('view-type-fundraiser-progress-bar--total')
						)
						.appendTo(slot)
				})

				Button()
					.style('view-type-fundraiser-banner-dismiss-button')
					.type('icon', 'flush')
					.setIcon('xmark')
					.event.subscribe('click', banner.dismiss)
					.appendTo(banner.body)

				banner.dismissed.matchManual(true, () => {
					Store.items.status = { dismissed: true, lastActive: Date.now() }
					bannerState.value = false
				})
			})
		})
	}

	function setActive () {
		const status = Store.items.status ?? { dismissed: false, lastActive: Date.now() }

		if (status.dismissed && Date.now() - status.lastActive > Time.hours(2)) {
			status.dismissed = false
			bannerState.value = true
		}

		status.lastActive = Date.now()
		Store.items.status = status
	}
}

export default SiteStatusListener
