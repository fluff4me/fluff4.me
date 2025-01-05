import type Component from 'ui/Component'
import StringApplicator from 'ui/utility/StringApplicator'

type ComponentClass = typeof Component
let Break!: Component.Builder<[], Component>

interface TextManipulator<HOST> extends StringApplicator.Optional<HOST> {
	prepend (text: string): HOST
	append (text: string): HOST
}

const TextManipulator = Object.assign(
	function (component: Component): TextManipulator<Component> {
		return Object.assign(
			StringApplicator(component, value => {
				component.element.textContent = null
				if (!value)
					return value

				const texts = value.split('\n')
				for (let i = 0; i < texts.length; i++) {
					if (i > 0)
						component.append(Break())

					component.element.append(document.createTextNode(texts[i]))
				}

				return value
			}),
			{
				prepend (text: string) {
					const texts = text.split('\n')
					for (let i = texts.length - 1; i >= 0; i--) {
						if (i < texts.length - 1)
							component.prepend(Break())

						component.element.prepend(document.createTextNode(texts[i]))
					}

					return component
				},
				append (text: string) {
					const texts = text.split('\n')
					for (let i = 0; i < texts.length; i++) {
						if (i > 0)
							component.append(Break())

						component.element.append(document.createTextNode(texts[i]))
					}

					return component
				},
			}
		)
	},
	{
		setComponent (Component: ComponentClass) {
			Break = Component
				.Builder('br', component => component.style('break'))
				.setName('Break')
		},
	}
)

export default TextManipulator
