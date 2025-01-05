import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import State from 'utility/State'

interface FormExtensions {
	content: Component
	footer: ActionRow
	submit: Button
}

interface Form extends Component, FormExtensions { }

const Form = Component.Builder((form, label: Component): Form => {
	form.replaceElement('form')
		.style('form')
		.ariaRole('form')
		.ariaLabelledBy(label)

	form.receiveDescendantInsertEvents()

	const valid = State.Generator(() => (form.element as HTMLFormElement).checkValidity())
	form.event.subscribe(['input', 'change', 'descendantInsert'], () => valid.refresh())

	const content = (form.is(Block) ? form.content : Component())
		.style('form-content')

	const footer = (form.is(Block) ? form.footer : ActionRow())
		.style('form-footer')

	return form
		.append(content, footer)
		.extend<FormExtensions>(() => ({
			content, footer,
			submit: undefined!,
		}))
		.extendJIT('submit', () => Button()
			.type('primary')
			.attributes.set('type', 'submit')
			.bindDisabled(valid.not, 'invalid')
			.appendTo(footer.right))
})

export default Form
