// import EndpointSupporterOrders from 'endpoint/supporter/EndpointSupporterOrders'
// import EndpointSupporterPollFull from 'endpoint/supporter/EndpointSupporterPollFull'
import EndpointSupporterStatus from 'endpoint/supporter/EndpointSupporterStatus'
import PagedListData from 'model/PagedListData'
import Session from 'model/Session'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ButtonRow from 'ui/component/core/ButtonRow'
import Details from 'ui/component/core/Details'
import Heading from 'ui/component/core/Heading'
import Loading from 'ui/component/core/Loading'
import Paginator from 'ui/component/core/Paginator'
import Paragraph from 'ui/component/core/Paragraph'
import Placeholder from 'ui/component/core/Placeholder'
import Slot from 'ui/component/core/Slot'
import Small from 'ui/component/core/Small'
import Timestamp from 'ui/component/core/Timestamp'
import PatronAuthDialog from 'ui/component/PatronAuthDialog'
import type { Quilt } from 'ui/utility/StringApplicator'
import Popup from 'utility/Popup'
import State from 'utility/State'

const PopupSupporterStart = Popup({
	translation: 'view/account/supporter/popup/start/title',
	width: 1000,
	height: 900,
})

const PopupSupporterManage = Popup({
	translation: 'view/account/supporter/popup/manage/title',
	width: 1000,
	height: 900,
})

export default Component.Builder(component => {
	const block = component.and(Block)
	block.title.text.use('view/account/supporter/title')
	block.description.text.use('view/account/supporter/description')

	const slot = Slot()
		.style.remove('slot')
		.style('view-type-account-supporter')
		.appendTo(block.content)

	const status = State.Async.fromEndpoint(slot, EndpointSupporterStatus.prep())
	slot.use(status.state, (slot, statusState) => {
		if (!statusState.settled)
			return Loading().use(status)

		if (statusState.error)
			return Component()
				.append(Paragraph()
					.text.use(quilt => quilt['view/account/supporter/status/error'](statusState.error.message)))
				.append(Button()
					.text.use('view/account/supporter/status/action/retry')
					.event.subscribe('click', () => status.refresh()))

		if (statusState.value.status || statusState.value.months_remaining) {
			Component()
				.append(Component().useMarkdownContent('view/account/supporter/status/supporter'))
				.append(statusState.value.status === 'has_active_subscription' || !statusState.value.end_time ? undefined
					: Paragraph().and(Placeholder)
						.text.use(quilt => quilt['view/account/supporter/status/end-date'](
							Timestamp(statusState.value.end_time!).style.remove('timestamp')
						))
				)
				.append(!statusState.value.total_paid ? undefined
					: Paragraph()
						.style('view-type-account-supporter-status-total')
						.text.use(quilt => quilt['view/account/supporter/status/total'](
							(statusState.value.total_paid / 100).toFixed(2)
						))
				)
				.appendTo(slot)

			////////////////////////////////////
			//#region Patreon Paginator
			if (statusState.value.patreon_subscriptions.length)
				Paginator()
					.type('flush')
					.style('view-type-account-supporter-order-paginator')
					.tweak(paginator => paginator.title.text.use('view/account/supporter/order/list-title/patreon'))
					.tweak(paginator => paginator.header
						.style('view-type-account-supporter-order-paginator-header')
						.append(Button()
							.setIcon('rotate')
							.type('flush')
							.event.subscribe('click', async () => {
								// const response = await EndpointSupporterPollFull.query()
								// if (toast.handleError(response))
								// 	return

								status.refresh()
							})
						)
					)
					.tweak(paginator => paginator.content.style('view-type-account-supporter-order-paginator-content'))
					.tweak(paginator => paginator.footer.style('view-type-account-supporter-order-paginator-footer'))
					.set(PagedListData.fromArray(25, statusState.value.patreon_subscriptions), 0, (slot, orders) => {
						slot.style('view-type-account-supporter-order-list')

						const HeaderCell = () => Component().style('view-type-account-supporter-order-list-header-label')
						const HeaderCellAmount = () => HeaderCell().style('view-type-account-supporter-order-list-header-amount')
						Component()
							.style('view-type-account-supporter-order-list-header')
							.style('view-type-account-supporter-order')
							.append(HeaderCell().text.use('view/account/supporter/order/label/timestamp'))
							.append(HeaderCellAmount().text.use('view/account/supporter/order/label/amount'))
							.append(HeaderCell())
							.append(HeaderCell().text.use('view/account/supporter/order/label/status'))
							.append(HeaderCellAmount().text.use('view/account/supporter/order/label/total'))
							.appendTo(slot)

						for (const order of orders) {
							const orderURL = 'https://www.patreon.com/settings/memberships/fluff4me'
							Component('a')
								.attributes.set('href', orderURL)
								.attributes.set('target', '_blank')
								.style('view-type-account-supporter-order', 'view-type-account-supporter-order--patreon')
								.append(Timestamp(order.timestamp)
									.setSimple()
									.style('view-type-account-supporter-order-date')
								)
								.append(
									Component()
										.style('view-type-account-supporter-order-amount-value')
										.text.use(quilt => quilt['view/account/supporter/order/amount/subscription/value'](
											!order.interval_amount ? '?' : (order.interval_amount / 100).toFixed(2),
										)),
									Component()
										.style('view-type-account-supporter-order-amount-unit')
										.text.use(quilt => quilt['view/account/supporter/order/amount/subscription/unit'](false)),
								)
								.append(Component())
								.append(Component()
									.style('view-type-account-supporter-order-status')
									.text.use(quilt => {
										if (order.renewal_timestamp)
											return quilt['view/account/supporter/order/renews'](
												Timestamp(order.renewal_timestamp).setSimple().style.remove('timestamp')
											)

										return quilt['view/account/supporter/order/status'](order.status)
									})
								)
								.append(
									Component().and(Small)
										.style('view-type-account-supporter-order-amount-value')
										.text.use(quilt => quilt['view/account/supporter/order/amount/total/value'](
											(order.amount / 100).toFixed(2),
										)),
									Component().and(Small)
										.style('view-type-account-supporter-order-amount-unit')
										.text.use('view/account/supporter/order/amount/total/unit'),
								)
								.event.subscribe('click', async event => {
									event.preventDefault()
									await PopupSupporterManage.show(event.host, { url: orderURL }).toastError()
									status.refresh()
								})
								.appendTo(slot)
						}
					})
					.appendTo(slot)
			//#endregion
			////////////////////////////////////

			////////////////////////////////////
			//#region MoR Paginator
			// if (statusState.value.status)
			// 	Paginator()
			// 		.type('flush')
			// 		.style('view-type-account-supporter-order-paginator')
			// 		.tweak(paginator => paginator.title.text.use('view/account/supporter/order/list-title'))
			// 		.tweak(paginator => paginator.header
			// 			.style('view-type-account-supporter-order-paginator-header')
			// 			.append(Button()
			// 				.setIcon('rotate')
			// 				.type('flush')
			// 				.event.subscribe('click', async () => {
			// 					// const response = await EndpointSupporterPollFull.query()
			// 					// if (toast.handleError(response))
			// 					// 	return

			// 					status.refresh()
			// 				})
			// 			)
			// 		)
			// 		.tweak(paginator => paginator.content.style('view-type-account-supporter-order-paginator-content'))
			// 		.tweak(paginator => paginator.footer.style('view-type-account-supporter-order-paginator-footer'))
			// 		.set(PagedListData.fromEndpoint(25, EndpointSupporterOrders.prep()), (slot, orders) => {
			// 			slot.style('view-type-account-supporter-order-list')

			// 			const HeaderCell = () => Component().style('view-type-account-supporter-order-list-header-label')
			// 			const HeaderCellAmount = () => HeaderCell().style('view-type-account-supporter-order-list-header-amount')
			// 			Component()
			// 				.style('view-type-account-supporter-order-list-header')
			// 				.style('view-type-account-supporter-order')
			// 				.append(HeaderCell().text.use('view/account/supporter/order/label/timestamp'))
			// 				.append(HeaderCellAmount().text.use('view/account/supporter/order/label/amount'))
			// 				.append(HeaderCell().text.use('view/account/supporter/order/label/type'))
			// 				.append(HeaderCell().text.use('view/account/supporter/order/label/status'))
			// 				.append(HeaderCellAmount().text.use('view/account/supporter/order/label/total'))
			// 				.appendTo(slot)

			// 			for (const order of orders) {
			// 				const orderURL = `${Env.API_ORIGIN}supporter/order/${order.uuid}`
			// 				Component('a')
			// 					.attributes.set('href', orderURL)
			// 					.attributes.set('target', '_blank')
			// 					.style('view-type-account-supporter-order')
			// 					.style(`view-type-account-supporter-order--${order.type}`)
			// 					.append(Timestamp(order.timestamp)
			// 						.setSimple()
			// 						.style('view-type-account-supporter-order-date')
			// 					)
			// 					.append(
			// 						Component()
			// 							.style('view-type-account-supporter-order-amount-value')
			// 							.text.use(order.type === 'subscription'
			// 								? quilt => quilt['view/account/supporter/order/amount/subscription/value'](
			// 									!order.interval_amount ? '?' : (order.interval_amount / 100).toFixed(2),
			// 								)
			// 								: quilt => quilt['view/account/supporter/order/amount/total/value'](
			// 									(order.amount / 100).toFixed(2),
			// 								)
			// 							),
			// 						Component()
			// 							.style('view-type-account-supporter-order-amount-unit')
			// 							.text.use(order.type === 'subscription'
			// 								? quilt => quilt['view/account/supporter/order/amount/subscription/unit'](
			// 									order.interval === 'yearly',
			// 								)
			// 								: 'view/account/supporter/order/amount/total/unit'
			// 							),
			// 					)
			// 					.append(Component()
			// 						.style('view-type-account-supporter-order-type')
			// 						.text.use(`view/account/supporter/order/type/${order.type}`)
			// 					)
			// 					.append(Component()
			// 						.style('view-type-account-supporter-order-status')
			// 						.text.use(quilt => {
			// 							if (order.renewal_timestamp)
			// 								return quilt['view/account/supporter/order/renews'](
			// 									Timestamp(order.renewal_timestamp).setSimple().style.remove('timestamp')
			// 								)

			// 							return quilt['view/account/supporter/order/status'](order.status)
			// 						})
			// 					)
			// 					.append(
			// 						Component().and(Small)
			// 							.style('view-type-account-supporter-order-amount-value')
			// 							.text.use(quilt => quilt['view/account/supporter/order/amount/total/value'](
			// 								(order.amount / 100).toFixed(2),
			// 							)),
			// 						Component().and(Small)
			// 							.style('view-type-account-supporter-order-amount-unit')
			// 							.text.use('view/account/supporter/order/amount/total/unit'),
			// 					)
			// 					.event.subscribe('click', async event => {
			// 						event.preventDefault()
			// 						await PopupSupporterManage.show(event.host, { url: orderURL }).toastError()
			// 						status.refresh()
			// 					})
			// 					.appendTo(slot)
			// 			}
			// 		})
			// 		.appendTo(slot)
			//#endregion
			////////////////////////////////////
		}

		const shouldCompressPlans = false
			|| !!statusState.value.months_remaining
			|| !!statusState.value.patreon_subscriptions.length
			|| statusState.value.status === 'has_active_subscription'

		const addProduct = Details().appendTo(slot)
		addProduct.summary.type('primary').text.use('view/account/supporter/action/add-plan')
		addProduct.state.value = !shouldCompressPlans

		if (!shouldCompressPlans)
			addProduct.summary.style('view-type-account-supporter-add-plan-button--hidden')

		if (shouldCompressPlans)
			Paragraph().appendTo(addProduct)

		const productList = Component()
			.style('view-type-account-supporter-product-list')
			.appendTo(addProduct)

		// const remainingTillFounder = 200 - (statusState.value.total_paid) / 100
		type Product = Extract<keyof Quilt, `view/account/supporter/product/${string}/name`> extends `view/account/supporter/product/${infer TYPE}/name` ? TYPE : never
		const products = [/* 'single', */'monthly', 'yearly', 'founder'] satisfies Product[]
		for (let i = 0; i < products.length; i++) {
			const product = products[i]

			if (product === 'yearly')
				Paragraph().and(Small)
					.style('view-type-account-supporter-product-special-plans-hint')
					.useMarkdownContent('view/account/supporter/product/special-plans-hint')
					.appendTo(productList)

			// const realProduct = product === 'founder' ? 'single' : product
			const url = {
				monthly: 'https://www.patreon.com/checkout/fluff4me?rid=25959404&slug=fluff4me',
				yearly: 'https://www.patreon.com/checkout/fluff4me?rid=26004082&slug=fluff4me',
				founder: 'https://www.patreon.com/checkout/fluff4me?rid=26004089&slug=fluff4me',
			}[product]
			// const url = `${Env.API_ORIGIN}${(`/supporter/checkout/${realProduct}` satisfies keyof Paths).slice(1)}`
			Component('a')
				.and(Button)
				.attributes.set('href', url)
				.attributes.set('target', '_blank')
				.style('view-type-account-supporter-product')
				.style.setVariable('colour-rotation-index', i)
				.event.subscribe('click', async event => {
					event.preventDefault()
					// const transactionId = Strings.uid()
					// Store.items.supporterTransactionId = transactionId
					await PopupSupporterStart.show(event.host, { url: url /* `${url}?transaction_id=${transactionId}` */ }).toastError()
					status.refresh()
				})
				.append(Heading()
					.setAestheticStyle(false)
					.style('view-type-account-supporter-product-title')
					.tweak(heading => heading.textWrapper.remove())
					.append(Component()
						.style('view-type-account-supporter-product-name')
						.text.use(`view/account/supporter/product/${product}/name`)
					)
					.append(Component()
						.style('view-type-account-supporter-product-price')
						.text.use(
							// product === 'founder'
							// ? quilt => quilt['view/account/supporter/product/founder/price'](remainingTillFounder)
							// :
							`view/account/supporter/product/${product}/default-price`
						)
					)
				)
				.append(Paragraph()
					.style('view-type-account-supporter-product-description')
					.text.use(product === 'founder'
						? quilt => quilt['view/account/supporter/product/founder/description']()
						: `view/account/supporter/product/${product}/description`))
				////////////////////////////////////
				//#region MoR product config
				/*
				.append(product === 'founder'
					? Button()
						.style('view-type-account-supporter-product-icon', 'view-type-account-supporter-product-heart')
						.type('flush')
						.setIcon('heart')
					: Button()
						.style('view-type-account-supporter-product-icon', 'view-type-account-supporter-product-tweak')
						.type('flush')
						.setIcon('pencil')
						.event.subscribe('click', async event => {
							event.stopPropagation()
							event.preventDefault()
							const amount = State<number | undefined>(undefined)
							const transactionId = Strings.uid()
							const customURL = amount.mapManual(amount => !amount ? `${url}?transaction_id=${transactionId}` : `${url}?amount=${Math.floor(amount * 100)}&transaction_id=${transactionId}`)
							const confirmed = await ConfirmDialog.prompt(event.host, {
								titleTranslation: `view/account/supporter/product/${product}/name`,
								bodyTranslation: `view/account/supporter/product/${product}/description`,
								confirmButtonTranslation: 'view/account/supporter/action/checkout',
								tweak (dialog) {
									dialog.block.style('view-type-account-supporter-product-dialog')
										.style.setVariable('colour-rotation-index', i)

									const amountInput = CurrencyInput()
										.placeholder.set(product === 'yearly' ? '50.00' : '5.00')
									amount.bind(dialog, amountInput.state.map(dialog, input => +input))
									LabelledRow()
										.tweak(row => row.label.text.use('view/account/supporter/dialog/amount/label'))
										.tweak(row => row.content.append(amountInput.setLabel(row.label)))
										.appendTo(dialog.block.content)

									dialog.confirmButton?.replaceElement('a')
										.attributes.bind('href', customURL)
										.event.subscribe('click', event => event.preventDefault())
								},
							})

							if (!confirmed)
								return

							Store.items.supporterTransactionId = transactionId
							await PopupSupporterStart.show(event.host, { url: customURL.value }).toastError()
							status.refresh()
						})
				)
				*/
				//#endregion
				////////////////////////////////////
				.appendTo(productList)
		}

		if (!statusState.value.patreon_subscriptions.length)
			ButtonRow()
				.style('view-type-account-supporter-patreon-row')
				.tweak(row => row.content.append(Component().text.use('view/account/supporter/already-patron-hint')))
				.tweak(row => row.button
					.setIcon('patreon')
					.style('view-type-account-supporter-patreon-row-button')
					.text.bind(Session.Auth.account.map(slot, author =>
						!author?.patreon_patron
							? quilt => quilt['view/chapter/action/auth-to-patreon']()
							: quilt => quilt['view/chapter/action/unlink-patreon'](author.patreon_patron!.display_name)))
					.event.subscribe('click', async () => {
						await PatronAuthDialog.auth(slot)
						status.refresh()
					})
				)
				.appendTo(slot)
	})

	Component()
		.style('view-type-account-supporter-about')
		.append(Heading().text.use('view/account/supporter/about/title'))
		.append(Component().useMarkdownContent('document/about-supporters'))
		.appendTo(block.content)

	return component
})
