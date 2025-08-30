import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type State from 'utility/State'

export default Component.Builder('a', (component, link: string | undefined | State<string | undefined>): Component => {
	return component
		.replaceElement('a')
		.and(Button)
		.attributes.bind('href', link)
		.attributes.set('target', '_blank')
		.setIcon('rss')
		.type('flush')
		.style('rss-button')
		.event.subscribe('click', event => {
			event.stopPropagation()
		})
})
