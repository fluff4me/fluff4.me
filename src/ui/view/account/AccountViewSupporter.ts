import EndpointSupporterStatus from 'endpoint/supporter/EndpointSupporterStatus'
import Component from 'ui/Component'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import ExternalLink from 'ui/component/core/ExternalLink'
import Heading from 'ui/component/core/Heading'
import Loading from 'ui/component/core/Loading'
import Paragraph from 'ui/component/core/Paragraph'
import Slot from 'ui/component/core/Slot'
import TextEditor from 'ui/component/core/TextEditor'
import Popup from 'utility/Popup'
import State from 'utility/State'

const PopupSupporter = Popup({
	translation: 'view/account/supporter/popup/title',
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

		const productList = Component()
			.style('view-type-account-supporter-product-list')
			.appendTo(slot)

		const products = statusState.value.products.sort((a, b) => a.price - b.price)
		for (let i = 0; i < products.length; i++) {
			const product = products[i]
			ExternalLink(product.buy_now_url)
				.and(Button)
				.attributes.set('target', '_blank')
				.style('view-type-account-supporter-product')
				.style.setVariable('colour-rotation-index', i)
				.event.subscribe('click', async event => {
					event.preventDefault()
					await PopupSupporter.show(event.host, { url: product.buy_now_url }).toastError()
					// TODO
				})
				.append(Heading()
					.setAestheticStyle(false)
					.style('view-type-account-supporter-product-title')
					.tweak(heading => heading.textWrapper.remove())
					.append(Component()
						.style('view-type-account-supporter-product-name')
						.text.set(product.name)
					)
					.append(Component()
						.style('view-type-account-supporter-product-price')
						.text.set(product.price_formatted.replace('.00', ''))
					)
				)
				.append(Component()
					.style('view-type-account-supporter-product-description')
					.setMarkdownContent(TextEditor.passThrough(editor => !!editor.mirror?.pasteHTML(product.description), false)))
				.appendTo(productList)
		}
	})

	Component()
		.style('view-type-account-supporter-about')
		.append(Heading().text.use('view/account/supporter/about/title'))
		.append(Component().useMarkdownContent('document/about-supporters'))
		.appendTo(block.content)

	return component
})
