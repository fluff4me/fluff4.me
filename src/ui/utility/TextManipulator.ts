import type { Weave } from 'lang/en-nz'
import type Component from 'ui/Component'
import StringApplicator from 'ui/utility/StringApplicator'

interface TextManipulator<HOST> extends Omit<StringApplicator.Optional<HOST>, 'rehost'> {
	prepend (text: string): HOST
	append (text: string): HOST
	rehost<COMPONENT extends Component> (component: COMPONENT): TextManipulator<COMPONENT>
}

function TextManipulator (component: Component, target = component): TextManipulator<Component> {
	return apply(StringApplicator.Nodes(component, nodes => {
		target.removeContents()
		target.append(...nodes)
		return nodes
	}))

	function apply (applicator: StringApplicator.Optional<Component>): TextManipulator<Component> {
		const rehost = applicator.rehost
		return Object.assign(
			applicator,
			{
				prepend (text?: string | Weave | null) {
					target.prepend(...StringApplicator.render(text))
					return component
				},
				append (text?: string | Weave | null) {
					target.append(...StringApplicator.render(text))
					return component
				},
				rehost (component: Component) {
					return apply(rehost(component))
				},
			}
		)
	}
}

export default TextManipulator
