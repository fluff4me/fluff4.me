import Component from 'ui/Component'
import ActionRow from 'ui/component/core/ActionRow'
import Block from 'ui/component/core/Block'
import Button from 'ui/component/core/Button'
import Loading from 'ui/component/core/Loading'
import type { EventExtensions } from 'ui/utility/EventManipulator'
import State from 'utility/State'

type SubmitHandler<T> = (event: SubmitEvent & EventExtensions<T>) => unknown

interface FormExtensions {
	readonly content: Component
	readonly footer: ActionRow
	readonly submit: Button
	refreshValidity (): this
	onSubmit (submitHandler: SubmitHandler<this>): this
}

interface Form extends Component, FormExtensions { }

const Form = Component.Builder((component, label: Component | null): Form => {
	const form = (component.replaceElement('form')
		.style('form')
		.ariaRole('form')
		.ariaLabelledBy(label ?? undefined)
	) as Component<HTMLFormElement>

	form.receiveDescendantInsertEvents()
	form.event.subscribe('submit', event => event.preventDefault())

	const valid = State.Generator(() => (form.element).checkValidity())
	form.event.subscribe(['input', 'change', 'descendantInsert'], () => valid.refresh())

	const content = (form.is(Block) ? form.content : Component())
		.style('form-content')

	const footer = (form.is(Block) ? form.footer : ActionRow())
		.style('form-footer')

	let submitButtonWrapper: Component | undefined
	const processingSubmit = State(false)

	let submitHandler: SubmitHandler<Form> | undefined

	return form
		.append(content, footer)
		.extend<FormExtensions>(() => ({
			content, footer,
			submit: undefined!,
			refreshValidity () {
				valid.refresh()
				return this
			},
			onSubmit (handler) {
				submitHandler = handler
				return this
			},
		}))
		.extendJIT('submit', () => Button()
			.type('primary')
			.attributes.set('type', 'submit')
			.bindDisabled(valid.not, 'invalid')
			.appendToWhen(processingSubmit.falsy, submitButtonWrapper ??= Component()
				.event.subscribe('click', () => {
					if (!form.element.checkValidity())
						form.element.reportValidity()
				})
				.appendWhen(processingSubmit, Loading().tweak(loading => {
					loading.style('form-submit-loading')
					loading.enabled.bind(loading, processingSubmit)
					loading.flag.style('form-submit-loading-flag')
				}))
				.appendTo(footer.right)
			)
			.tweak(submitButton => submitButton
				.style.bind(State.Every(form, submitButtonWrapper!.hovered, submitButton.disabled), 'button--disabled--hover')
				.style.bind(State.Every(form, submitButtonWrapper!.active, submitButton.disabled), 'button--disabled--active')
			)
		)
		.event.subscribe('submit', async event => {
			event.preventDefault()
			processingSubmit.value = true
			await submitHandler?.(event)
			processingSubmit.value = false
		})
})

export default Form
