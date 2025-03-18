import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import State from 'utility/State'

interface FormExtensions {
	readonly content: Component
	readonly footer: ActionRow
	readonly submit: Button
	refreshValidity (): this
}

interface Form extends Component, FormExtensions { }

const Form = Component.Builder((component, label: Component | null): Form => {
	const form = (component.replaceElement('form')
		.style('form')
		.ariaRole('form')
		.ariaLabelledBy(label ?? undefined)
	) as Component<HTMLFormElement>

	form.receiveDescendantInsertEvents()

	const valid = State.Generator(() => (form.element).checkValidity())
	form.event.subscribe(['input', 'change', 'descendantInsert'], () => valid.refresh())

	const content = (form.is(Block) ? form.content : Component())
		.style('form-content')

	const footer = (form.is(Block) ? form.footer : ActionRow())
		.style('form-footer')

	let submitButtonWrapper: Component | undefined

	return form
		.append(content, footer)
		.extend<FormExtensions>(() => ({
			content, footer,
			submit: undefined!,
			refreshValidity () {
				valid.refresh()
				return this
			},
		}))
		.extendJIT('submit', () => Button()
			.type('primary')
			.attributes.set('type', 'submit')
			.bindDisabled(valid.not, 'invalid')
			.appendTo(submitButtonWrapper ??= Component()
				.event.subscribe('click', () => {
					if (!form.element.checkValidity())
						form.element.reportValidity()
				})
				.appendTo(footer.right))
			.tweak(submitButton => submitButton
				.style.bind(State.Every(form, submitButtonWrapper!.hovered, submitButton.disabled), 'button--disabled--hover')
				.style.bind(State.Every(form, submitButtonWrapper!.active, submitButton.disabled), 'button--disabled--active')
			))
})

export default Form
