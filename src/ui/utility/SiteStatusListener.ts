// import Store from 'utility/Store'

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
	// const bannerState = State<boolean>(!(Store.items.status?.dismissed ?? false))

	export function listen () {
		// setActive()

		// PageListener.visible.subscribeManual(setActive)
		// navigate.state.subscribeManual(setActive)

		// bannerState.useManual(async shown => {
		// 	if (shown)
		// 		await banner.queue(banner => {
		// 			banner.body.style('view-type-fundraiser-banner')
		// 			Slot().appendTo(banner.body).use(SiteStatus, (slot, status) => {
		// 				const fundraiser = status?.fundraisers[0]
		// 				if (!fundraiser)
		// 					return

		// 				Link('/fundraiser')
		// 					.text.use('fundraiser/title')
		// 					.event.subscribe('Navigate', () => { banner.dismiss() })
		// 					.appendTo(slot)

		// 				FundraiserBar(fundraiser)
		// 					.appendTo(slot)
		// 			})

		// 			Button()
		// 				.style('view-type-fundraiser-banner-dismiss-button')
		// 				.type('icon', 'flush')
		// 				.setIcon('xmark')
		// 				.event.subscribe('click', banner.dismiss)
		// 				.appendTo(banner.body)

		// 			banner.dismissed.matchManual(true, () => {
		// 				Store.items.status = { dismissed: true, lastActive: Date.now() }
		// 				bannerState.value = false
		// 			})
		// 		})
		// })
	}

	// function setActive () {
	// 	const status = Store.items.status ?? { dismissed: false, lastActive: Date.now() }

	// 	if (status.dismissed && Date.now() - status.lastActive > Time.hours(2)) {
	// 		status.dismissed = false
	// 		bannerState.value = true
	// 	}

	// 	status.lastActive = Date.now()
	// 	Store.items.status = status
	// }
}

export default SiteStatusListener
