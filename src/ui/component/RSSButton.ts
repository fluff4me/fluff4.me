import Component from 'ui/Component'
import Button from 'ui/component/core/Button'

export default Component.Builder('a', (component, link: string | undefined): Component => {
	return component
		.replaceElement('a')
		.and(Button)
		.attributes.set('href', link)
		.attributes.set('target', '_blank')
		.setIcon('rss')
		.type('flush')
		.style('rss-button')
		.event.subscribe('click', event => {
			event.stopPropagation()
		})
})
