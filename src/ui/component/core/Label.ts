import type { ComponentBrand } from 'ui/Component'
import Component from 'ui/Component'
import Button from 'ui/component/core/Button'
import type Input from 'ui/component/core/ext/Input'
import Form from 'ui/component/core/Form'
import View from 'ui/view/shared/component/View'
import type { UnsubscribeState } from 'utility/State'
import State from 'utility/State'

interface LabelExtensions {
	readonly textWrapper: Component
	readonly for: State<string | undefined>
	setFor (inputName?: string): this
	setRequired (required?: boolean | State<boolean>): this
	setInput (input?: Input): this
}

interface Label extends Component, LabelExtensions { }

const Label = Component.Builder('label', (label): Label => {
	label.style('label')

	const textWrapper = Component()
		.style('label-text')
		.appendTo(label)

	const infoButton = Button()
		.style('label-info-button', 'label-info-button--hidden')
		.type('icon')
		.setIcon('circle-question')
		.tweak(button => button.icon?.style('label-info-button-icon'))
		.appendTo(label)

	let requiredState: State<boolean> | undefined
	let unuseInput: UnsubscribeState | undefined
	return label
		.extend<LabelExtensions>(label => ({
			textWrapper,
			for: State(undefined),
			setFor: inputName => {
				label.attributes.set('for', inputName)
				label.for.asMutable?.setValue(inputName)
				return label
			},
			setRequired: (required = true) => {
				label.style.unbind(requiredState)
				requiredState = undefined
				if (typeof required === 'boolean')
					textWrapper.style.toggle(required, 'label-required')
				else
					textWrapper.style.bind(requiredState = required, 'label-required')
				return label
			},
			setInput: input => {
				unuseInput?.(); unuseInput = undefined
				if (!label.is(AutoLabel))
					label.setFor(input?.name.value)

				label.setRequired(input?.required)

				const inputInvalidOwner = State.Owner.create()
				if (input)
					State.Use(inputInvalidOwner, { invalid: input.invalid, touched: (input as Input & { touched?: State<boolean> }).touched })
						.use(inputInvalidOwner, ({ invalid, touched }) =>
							label.style.toggle(!!invalid && (touched ?? true), 'label--invalid'))
				const unuseInputHasPopover = input?.hasPopover.use(label, hasPopover => {
					infoButton.style.toggle(!hasPopover, 'label-info-button--hidden')
				})

				infoButton.event.subscribe('click', onInfoButtonClick)
				function onInfoButtonClick () {
					const popover = input?.getPopover()
					if ((popover?.lastStateChangeTime ?? Infinity) + 10 >= Date.now())
						return

					input?.getPopover()?.toggle().anchor.apply()
				}

				unuseInput = !input ? undefined : () => {
					inputInvalidOwner.remove()
					unuseInputHasPopover?.()
					infoButton.event.unsubscribe('click', onInfoButtonClick)
					unuseInput = undefined
				}
				return label
			},
		}))
		.extendJIT('text', label => label.textWrapper.text.rehost(label))
})

export default Label

interface AutoLabelExtensions extends ComponentBrand<'autolabel'> {
}

export interface AutoLabel extends Label, AutoLabelExtensions { }

let globalI = 0
export const AutoLabel = Component.Builder('label', (component): AutoLabel => {
	const i = globalI++

	const label = component.and(Label)

	let formName: string | undefined
	let viewPath: string | undefined

	let unuseFormName: UnsubscribeState | undefined

	label.receiveAncestorInsertEvents()
	label.event.subscribe(['insert', 'ancestorInsert'], () => {
		unuseFormName?.()

		const form = label.closest(Form)
		unuseFormName = form?.name.use(label, name => formName = name)

		const view = label.closest(View)
		viewPath = view ? view.hash : '_'

		updateFor()
	})
	label.text.state.use(label, () => updateFor())

	return label.extend<AutoLabelExtensions>(label => ({}))

	function updateFor () {
		const text = label.text.state.value?.toString().toLowerCase().replace(/\W+/g, '-')
		if (!text) {
			label.setFor()
			return
		}

		if (!formName)
			label.setFor(`${viewPath}--${text}--${i}`)
		else
			label.setFor(`${viewPath}--${formName}--${text}`)
	}
})
