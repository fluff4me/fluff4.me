import Component from 'ui/Component'
import Button from 'ui/component/core/Button'

interface ButtonRowExtensions {
	readonly content: Component
	readonly button: Button
}

interface ButtonRow extends Component, ButtonRowExtensions { }

export default Component.Builder((component): ButtonRow => {
	const content = Component()
		.style('button-row-content')

	const button = Button()
		.style('button-row-button')

	return component
		.style('button-row')
		.append(content, button)
		.extend<ButtonRowExtensions>(row => ({
			content,
			button,
		}))
})
