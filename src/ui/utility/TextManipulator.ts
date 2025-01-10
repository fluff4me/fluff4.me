import type { Weave } from 'lang/en-nz'
import type Component from 'ui/Component'
import StringApplicator from 'ui/utility/StringApplicator'

interface TextManipulator<HOST> extends StringApplicator.Optional<HOST> {
	prepend (text: string): HOST
	append (text: string): HOST
}

function TextManipulator (component: Component, target = component): TextManipulator<Component> {
	return Object.assign(
		StringApplicator.Nodes(component, nodes => {
			target.removeContents()
			target.append(...nodes)
			return nodes
		}),
		{
			prepend (text?: string | Weave | null) {
				target.prepend(...StringApplicator.render(text))
				return component
			},
			append (text?: string | Weave | null) {
				target.append(...StringApplicator.render(text))
				return component
			},
		}
	)
}

export default TextManipulator
